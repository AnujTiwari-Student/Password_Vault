"use client";

import { AuditLog } from './types';
import { getSeverityColor } from './utils';
import { AuditPagination } from './AuditPagination';

interface AuditTableMobileProps {
  logs: AuditLog[];
  isOrgAccount: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export const AuditTableMobile: React.FC<AuditTableMobileProps> = ({
  logs,
  isOrgAccount,
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  onNextPage,
  onPrevPage,
}) => {
  return (
    <div className="lg:hidden space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all overflow-hidden"
        >
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Actor</span>
                <p className="text-white text-sm mt-1 font-medium break-all">{log.actor}</p>
              </div>
              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${getSeverityColor(log.severity)} whitespace-nowrap`}>
                {log.action.replace(/_/g, ' ').toLowerCase()}
              </span>
            </div>

            <div className="pt-3 border-t border-gray-700/50">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Item</span>
              <p className="text-gray-300 text-sm mt-1">{log.item}</p>
            </div>

            <div className="pt-3 border-t border-gray-700/50">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Date & Time</span>
              <p className="text-gray-300 text-sm mt-1">{log.date}</p>
            </div>

            {isOrgAccount && log.ip && (
              <div className="pt-3 border-t border-gray-700/50">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">IP Address</span>
                <p className="text-gray-500 text-xs mt-1 font-mono">{log.ip}</p>
              </div>
            )}
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-6 border-t border-gray-700">
          <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
            Showing <span className="font-semibold text-gray-300">{startIndex + 1}</span> to{" "}
            <span className="font-semibold text-gray-300">{Math.min(endIndex, totalItems)}</span> of{" "}
            <span className="font-semibold text-gray-300">{totalItems}</span> logs
          </div>
          
          <AuditPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={onPageChange}
            onNextPage={onNextPage}
            onPrevPage={onPrevPage}
          />
        </div>
      )}
    </div>
  );
};
