"use client"

import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { formatTimeRemaining } from '@/utils/vault-helpers';

export const SessionTimer: React.FC = () => {
  const { isActive, remainingTime, isWarning } = useSessionTimeout();

  if (!isActive) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
      isWarning 
        ? 'bg-yellow-900/20 border border-yellow-700/30 text-yellow-300' 
        : 'bg-gray-800/30 border border-gray-700/30 text-gray-400'
    }`}>
      {isWarning ? (
        <AlertTriangle className="w-4 h-4 animate-pulse" />
      ) : (
        <Clock className="w-4 h-4" />
      )}
      <span className="text-sm font-mono">
        {formatTimeRemaining(remainingTime)}
      </span>
      {isWarning && (
        <span className="text-xs">Session expiring soon</span>
      )}
    </div>
  );
};
