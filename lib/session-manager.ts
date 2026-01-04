import { SESSION_CONFIG } from '@/constants/session';
import { SessionState, SessionManager } from '@/types/session';

class VaultSessionManager implements SessionManager {
  private expiresAt: number | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: Set<(state: SessionState) => void> = new Set();

  startSession(): void {
    this.expiresAt = Date.now() + SESSION_CONFIG.TIMEOUT_DURATION;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_CONFIG.STORAGE_KEY, this.expiresAt.toString());
    }
    
    this.startMonitoring();
    this.notifySubscribers();
  }

  endSession(): void {
    this.expiresAt = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
    }
    
    this.stopMonitoring();
    this.notifySubscribers();
  }

  extendSession(): void {
    if (this.isSessionValid()) {
      this.startSession();
    }
  }

  isSessionValid(): boolean {
    if (!this.expiresAt) return false;
    return Date.now() < this.expiresAt;
  }

  getRemainingTime(): number {
    if (!this.expiresAt) return 0;
    const remaining = this.expiresAt - Date.now();
    return Math.max(0, remaining);
  }

  getSessionState(): SessionState {
    const remainingTime = this.getRemainingTime();
    const isActive = this.isSessionValid();
    const isWarning = remainingTime > 0 && remainingTime <= SESSION_CONFIG.WARNING_BEFORE_TIMEOUT;

    return {
      isActive,
      expiresAt: this.expiresAt,
      remainingTime,
      isWarning,
    };
  }

  subscribe(callback: (state: SessionState) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private startMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      if (!this.isSessionValid()) {
        this.endSession();
      } else {
        this.notifySubscribers();
      }
    }, SESSION_CONFIG.CHECK_INTERVAL);
  }

  private stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private notifySubscribers(): void {
    const state = this.getSessionState();
    this.callbacks.forEach(callback => callback(state));
  }

  restoreSession(): void {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem(SESSION_CONFIG.STORAGE_KEY);
    if (stored) {
      const expiresAt = parseInt(stored, 10);
      if (expiresAt > Date.now()) {
        this.expiresAt = expiresAt;
        this.startMonitoring();
        this.notifySubscribers();
      } else {
        this.endSession();
      }
    }
  }
}

export const sessionManager = new VaultSessionManager();
