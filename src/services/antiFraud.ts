// Anti-Fraud System Service

import { deviceTracking } from './deviceTracking';
import { db, auth } from './firebase';
import { collection, doc, setDoc, getDoc, updateDoc, increment, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export interface FraudCheckResult {
  isAllowed: boolean;
  riskScore: number;
  reasons: string[];
  recommendations: string[];
}

export interface UserActivity {
  type: 'click' | 'view' | 'complete' | 'signup';
  timestamp: Date;
  metadata: Record<string, any>;
}

class AntiFraudService {
  private userId: string | null = null;
  private activityHistory: UserActivity[] = [];
  private sessionStart: Date = new Date();
  private fraudScore: number = 0;

  async initialize(): Promise<void> {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        this.userId = user?.uid || null;
        if (user) {
          await this.loadUserHistory();
        }
        resolve();
      });
    });
  }

  private async loadUserHistory(): Promise<void> {
    if (!this.userId) return;

    const userRef = doc(db, 'users', this.userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      this.fraudScore = data.fraudScore || 0;
    }
  }

  async checkAction(action: string, metadata: Record<string, any> = {}): Promise<FraudCheckResult> {
    const result: FraudCheckResult = {
      isAllowed: true,
      riskScore: this.fraudScore,
      reasons: [],
      recommendations: []
    };

    // Record activity
    const activity: UserActivity = {
      type: action as any,
      timestamp: new Date(),
      metadata
    };
    this.activityHistory.push(activity);

    // Check various fraud indicators
    await this.checkRapidClicks(result);
    await this.checkMultipleAccounts(result);
    await this.checkSuspiciousPatterns(result);
    await this.checkVPNUsage(result);
    await this.checkBotBehavior(result);

    // Update fraud score
    this.fraudScore = Math.min(100, result.riskScore);
    await this.updateFraudScore();

    // Determine if action should be allowed
    result.isAllowed = result.riskScore < 50;

    return result;
  }

  private async checkRapidClicks(result: FraudCheckResult): Promise<void> {
    const recentActivities = this.activityHistory.filter(
      a => Date.now() - a.timestamp.getTime() < 1000
    ).length;

    if (recentActivities > 10) {
      result.riskScore += 20;
      result.reasons.push('Rapid clicking detected - possible bot activity');
      result.recommendations.push('Slow down your clicking speed');
    }
  }

  private async checkMultipleAccounts(result: FraudCheckResult): Promise<void> {
    if (!this.userId) return;

    // Check if same fingerprint has multiple accounts
    const deviceInfo = await deviceTracking.initialize();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('fingerprint', '==', deviceInfo.fingerprint));
    const snapshot = await getDocs(q);

    if (snapshot.size > 1) {
      result.riskScore += 30;
      result.reasons.push('Multiple accounts detected from same device');
      result.recommendations.push('Only one account per device is allowed');
    }
  }

  private async checkSuspiciousPatterns(result: FraudCheckResult): Promise<void> {
    // Check for suspicious patterns in activity
    const lastHour = this.activityHistory.filter(
      a => Date.now() - a.timestamp.getTime() < 3600000
    );

    // Check for consistent timing (bots often have very regular patterns)
    const timestamps = lastHour.map(a => a.timestamp.getTime());
    for (let i = 1; i < timestamps.length; i++) {
      const interval = timestamps[i] - timestamps[i - 1];
      if (interval > 0 && interval < 100) {
        result.riskScore += 5;
      }
    }
  }

  private async checkVPNUsage(result: FraudCheckResult): Promise<void> {
    // VPN detection is typically done server-side
    // For now, we'll rely on backend validation
    result.recommendations.push('VPN usage may affect your earning eligibility');
  }

  private async checkBotBehavior(result: FraudCheckResult): Promise<void> {
    const recentClicks = this.activityHistory.filter(
      a => a.type === 'click' && Date.now() - a.timestamp.getTime() < 60000
    ).length;

    if (recentClicks > 50) {
      result.riskScore += 25;
      result.reasons.push('Bot-like clicking behavior detected');
      result.recommendations.push('Please use the site naturally');
    }
  }

  private async updateFraudScore(): Promise<void> {
    if (!this.userId) return;

    const userRef = doc(db, 'users', this.userId);
    await updateDoc(userRef, {
      fraudScore: increment(this.fraudScore - (await this.getCurrentFraudScore())),
      lastUpdated: serverTimestamp()
    });
  }

  private async getCurrentFraudScore(): Promise<number> {
    if (!this.userId) return 0;
    const userRef = doc(db, 'users', this.userId);
    const userDoc = await getDoc(userRef);
    return userDoc.data()?.fraudScore || 0;
  }

  async recordEarn(action: string, amount: number): Promise<boolean> {
    const check = await this.checkAction('earn_' + action, { amount });

    if (!check.isAllowed) {
      console.warn('Action blocked by anti-fraud system:', check.reasons);
      return false;
    }

    // Record the earning
    if (this.userId) {
      const earningsRef = doc(collection(db, 'earnings'), `${this.userId}_${Date.now()}`);
      await setDoc(earningsRef, {
        userId: this.userId,
        action,
        amount,
        timestamp: serverTimestamp(),
        riskScore: this.fraudScore
      });
    }

    return true;
  }

  async getUserRiskScore(): Promise<number> {
    if (!this.userId) return 0;
    const userRef = doc(db, 'users', this.userId);
    const userDoc = await getDoc(userRef);
    return userDoc.data()?.fraudScore || 0;
  }
}

export const antiFraud = new AntiFraudService();