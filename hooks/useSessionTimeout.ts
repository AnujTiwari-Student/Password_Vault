import { useState, useEffect, useCallback } from 'react';
import { sessionManager } from '@/lib/session-manager';
import { SessionState } from '@/types/session';

export function useSessionTimeout() {
  const [sessionState, setSessionState] = useState<SessionState>(() => 
    sessionManager.getSessionState()
  );

  useEffect(() => {
    sessionManager.restoreSession();
    
    const unsubscribe = sessionManager.subscribe((state) => {
      setSessionState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const startSession = useCallback(() => {
    sessionManager.startSession();
  }, []);

  const endSession = useCallback(() => {
    sessionManager.endSession();
  }, []);

  const extendSession = useCallback(() => {
    sessionManager.extendSession();
  }, []);

  const isSessionValid = useCallback(() => {
    return sessionManager.isSessionValid();
  }, []);

  return {
    sessionState,
    startSession,
    endSession,
    extendSession,
    isSessionValid,
    isActive: sessionState.isActive,
    remainingTime: sessionState.remainingTime,
    isWarning: sessionState.isWarning,
  };
}
