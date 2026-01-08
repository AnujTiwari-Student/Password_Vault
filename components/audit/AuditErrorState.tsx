"use client";

import { AlertCircle, RefreshCw } from 'lucide-react';

interface AuditErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const AuditErrorState: React.FC<AuditErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-red-300 text-sm font-medium">{error}</p>
          <button 
            onClick={onRetry}
            className="mt-2 flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
};
