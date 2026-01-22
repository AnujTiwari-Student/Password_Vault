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
    <div className="lg:hidden space-y-4">
      {logs.map((log) => (
        <div
          key={log.id}
          className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all overflow-hidden"
        >
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Actor</span>
                <p className="text-gray-900 text-sm sm:text-base mt-1 font-semibold break-all">{log.actor}</p>
              </div>
              <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${getSeverityColor(log.severity)} whitespace-nowrap`}>
                {log.action.replace(/_/g, ' ').toLowerCase()}
              </span>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Item</span>
              <p className="text-gray-900 text-sm sm:text-base mt-1 font-medium">{log.item}</p>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Date & Time</span>
              <p className="text-gray-700 text-sm sm:text-base mt-1">{log.date}</p>
            </div>

            {isOrgAccount && log.ip && (
              <div className="pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">IP Address</span>
                <p className="text-gray-600 text-xs sm:text-sm mt-1 font-mono">{log.ip}</p>
              </div>
            )}
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
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