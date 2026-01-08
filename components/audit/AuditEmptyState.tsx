"use client";

import { Shield } from 'lucide-react';

interface AuditEmptyStateProps {
  isOrgAccount: boolean;
}

export const AuditEmptyState: React.FC<AuditEmptyStateProps> = ({ isOrgAccount }) => {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
      <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <Shield size={32} className="text-gray-600" />
      </div>
      <p className="text-gray-400 text-sm font-medium">
        {isOrgAccount ? 'No audit logs found' : 'No security logs found'}
      </p>
      <p className="text-gray-500 text-sm mt-1.5">
        Try adjusting your filters or check back later
      </p>
    </div>
  );
};
