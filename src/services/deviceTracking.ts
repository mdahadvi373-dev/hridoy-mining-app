// Device and IP Tracking Service

export interface DeviceInfo {
  deviceId: string;
  fingerprint: string;
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
  ipAddress: string;
  firstVisit: Date;
  lastVisit: Date;
  visitCount: number;
}

export interface FraudIndicator {
  type: 'suspicious_activity' | 'multiple_accounts' | 'vpn_detected' | 'bot_detected' | 'rapid_clicks';
  score: number;
  reason: string;
  timestamp: Date;
}

class DeviceTrackingService {
  private deviceId: string = '';
  private fingerprint: string = '';

  async initialize(): Promise<DeviceInfo> {
    this.deviceId = this.generateDeviceId();
    this.fingerprint = await this.generateFingerprint();

    const deviceInfo: DeviceInfo = {
      deviceId: this.deviceId,
      fingerprint: this.fingerprint,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ipAddress: '', // Will be set by backend
      firstVisit: new Date(),
      lastVisit: new Date(),
      visitCount: 1
    };

    return deviceInfo;
  }

  private generateDeviceId(): string {
    const stored = localStorage.getItem('device_id');
    if (stored) return stored;

    const id = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('device_id', id);
    return id;
  }

  private async generateFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.platform,
      navigator.language,
      screen.width.toString(),
      screen.height.toString(),
      screen.colorDepth.toString(),
      new Date().getTimezoneOffset().toString(),
      navigator.hardwareConcurrency?.toString() || 'unknown',
    ];

    const fingerprint = await this.hashString(components.join('|'));
    return fingerprint;
  }

  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get IP:', error);
      return 'unknown';
    }
  }

  trackAction(action: string, metadata: Record<string, any> = {}): void {
    const event = {
      deviceId: this.deviceId,
      fingerprint: this.fingerprint,
      action,
      metadata,
      timestamp: new Date().toISOString()
    };

    // Store in localStorage for session
    const events = JSON.parse(localStorage.getItem('user_events') || '[]');
    events.push(event);
    if (events.length > 100) events.shift(); // Keep last 100 events
    localStorage.setItem('user_events', JSON.stringify(events));
  }
}

export const deviceTracking = new DeviceTrackingService();