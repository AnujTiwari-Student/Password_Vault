"use client";

import { Shield, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

interface AuditEmptyStateProps {
  isOrgAccount: boolean;
}

export const AuditEmptyState: React.FC<AuditEmptyStateProps> = ({ isOrgAccount }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 sm:p-16 text-center shadow-sm">
      <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6 border-2 border-gray-200">
        <Shield size={40} className="text-gray-400" />
      </div>
      <p className="text-gray-900 text-base sm:text-lg font-semibold mb-2">
        {isOrgAccount ? 'No Audit Logs Found' : 'No Security Logs Found'}
      </p>
      <p className="text-gray-500 text-sm sm:text-base">
        Try adjusting your filters or check back later
      </p>
    </div>
  );
};

interface AuditErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const AuditErrorState: React.FC<AuditErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-red-100 rounded-lg">
          <AlertCircle size={20} className="text-red-600" />
        </div>
        <div className="flex-1">
          <p className="text-red-900 text-sm sm:text-base font-semibold mb-1">Error Loading Logs</p>
          <p className="text-red-700 text-sm">{error}</p>
          <button 
            onClick={onRetry}
            className="mt-3 flex items-center gap-2 text-red-700 hover:text-red-900 text-sm font-semibold transition-colors bg-white px-4 py-2 rounded-lg border border-red-200 hover:border-red-300"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export const AuditLoadingState: React.FC<{ message?: string }> = ({ message = "Loading logs..." }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 sm:p-16 text-center shadow-sm">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
      <p className="text-gray-600 text-sm sm:text-base font-medium">{message}</p>
    </div>
  );
};