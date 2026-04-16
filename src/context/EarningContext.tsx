// Earning System Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, updateDoc, increment, serverTimestamp, collection, addDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { antiFraud } from '../services/antiFraud';
import { deviceTracking } from '../services/deviceTracking';

interface EarningStats {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingEarnings: number;
}

interface EarningHistory {
  id: string;
  type: 'ad' | 'game' | 'survey' | 'referral' | 'bonus';
  amount: number;
  status: 'completed' | 'pending' | 'rejected';
  timestamp: Date;
  description: string;
}

interface Task {
  id: string;
  type: 'ad' | 'game' | 'survey';
  title: string;
  description: string;
  reward: number;
  requiredActions: number;
  completedActions: number;
  status: 'available' | 'in_progress' | 'completed' | 'locked';
  expiresAt?: Date;
}

interface EarningContextType {
  stats: EarningStats;
  history: EarningHistory[];
  availableTasks: Task[];
  claimEarning: (type: string, amount: number, description: string) => Promise<boolean>;
  completeTask: (taskId: string) => Promise<boolean>;
  getEarnings: () => Promise<void>;
}

const EarningContext = createContext<EarningContextType | undefined>(undefined);

export const useEarnings = () => {
  const context = useContext(EarningContext);
  if (!context) {
    throw new Error('useEarnings must be used within an EarningProvider');
  }
  return context;
};

export const EarningProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<EarningStats>({
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    pendingEarnings: 0
  });
  const [history, setHistory] = useState<EarningHistory[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (currentUser) {
      getEarnings();
      loadAvailableTasks();
    } else {
      setStats({ balance: 0, totalEarned: 0, totalWithdrawn: 0, pendingEarnings: 0 });
      setHistory([]);
      setAvailableTasks([]);
    }
  }, [currentUser]);

  const getEarnings = async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setStats({
          balance: data.balance || 0,
          totalEarned: data.totalEarned || 0,
          totalWithdrawn: data.totalWithdrawn || 0,
          pendingEarnings: data.pendingEarnings || 0
        });
      }

      // Load earning history
      const historyRef = collection(db, 'earnings');
      const historyQuery = query(historyRef, where('userId', '==', currentUser.uid));
      const historySnapshot = await getDocs(historyQuery);

      const historyData: EarningHistory[] = [];
      historySnapshot.forEach(doc => {
        const data = doc.data();
        historyData.push({
          id: doc.id,
          type: data.type,
          amount: data.amount,
          status: data.status || 'completed',
          timestamp: data.timestamp?.toDate() || new Date(),
          description: data.description || ''
        });
      });

      setHistory(historyData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const loadAvailableTasks = async () => {
    // Generate available tasks
    const tasks: Task[] = [
      {
        id: 'daily_ad_1',
        type: 'ad',
        title: 'Watch 5 Banner Ads',
        description: 'Watch 5 banner advertisements to earn rewards',
        reward: 0.50,
        requiredActions: 5,
        completedActions: 0,
        status: 'available',
        expiresAt: new Date(Date.now() + 86400000)
      },
      {
        id: 'daily_ad_2',
        type: 'ad',
        title: 'View Interstitial Ads',
        description: 'View 3 interstitial page advertisements',
        reward: 0.75,
        requiredActions: 3,
        completedActions: 0,
        status: 'available',
        expiresAt: new Date(Date.now() + 86400000)
      },
      {
        id: 'game_install_1',
        type: 'game',
        title: 'Install Featured Game',
        description: 'Install and play a featured game for 5 minutes',
        reward: 1.50,
        requiredActions: 1,
        completedActions: 0,
        status: 'available'
      },
      {
        id: 'survey_1',
        type: 'survey',
        title: 'Complete Survey',
        description: 'Answer survey questions and earn points',
        reward: 2.00,
        requiredActions: 1,
        completedActions: 0,
        status: 'available'
      },
      {
        id: 'daily_bonus',
        type: 'ad',
        title: 'Daily Login Bonus',
        description: 'Login daily to receive bonus rewards',
        reward: 0.25,
        requiredActions: 1,
        completedActions: 0,
        status: 'available',
        expiresAt: new Date(Date.now() + 86400000)
      }
    ];

    setAvailableTasks(tasks);
  };

  const claimEarning = async (type: string, amount: number, description: string): Promise<boolean> => {
    if (!currentUser) return false;

    // Check anti-fraud
    const fraudCheck = await antiFraud.checkAction('earn_' + type, { amount });

    if (!fraudCheck.isAllowed) {
      console.warn('Earning blocked by anti-fraud:', fraudCheck.reasons);
      return false;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);

      // Update user balance
      await updateDoc(userRef, {
        balance: increment(amount),
        totalEarned: increment(amount)
      });

      // Record earning
      await addDoc(collection(db, 'earnings'), {
        userId: currentUser.uid,
        type,
        amount,
        description,
        status: 'completed',
        timestamp: serverTimestamp(),
        fraudScore: fraudCheck.riskScore
      });

      // Refresh stats
      await getEarnings();

      return true;
    } catch (error) {
      console.error('Error claiming earning:', error);
      return false;
    }
  };

  const completeTask = async (taskId: string): Promise<boolean> => {
    const task = availableTasks.find(t => t.id === taskId);
    if (!task || task.status !== 'available') return false;

    // Track action
    deviceTracking.trackAction('task_complete', { taskId });

    // Update task status
    const updatedTasks = availableTasks.map(t => {
      if (t.id === taskId) {
        const newCompleted = t.completedActions + 1;
        return {
          ...t,
          completedActions: newCompleted,
          status: newCompleted >= t.requiredActions ? 'completed' : 'in_progress' as any
        };
      }
      return t;
    });

    setAvailableTasks(updatedTasks);

    // If task is complete, claim reward
    if (task.status === 'available' && task.completedActions + 1 >= task.requiredActions) {
      return await claimEarning(task.type, task.reward, task.title);
    }

    return true;
  };

  return (
    <EarningContext.Provider value={{
      stats,
      history,
      availableTasks,
      claimEarning,
      completeTask,
      getEarnings
    }}>
      {children}
    </EarningContext.Provider>
  );
};

// Import db
import { db } from '../services/firebase';