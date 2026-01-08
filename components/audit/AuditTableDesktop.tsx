"use client";

import { AuditLog } from './types';
import { getSeverityColor } from './utils';
import { AuditPagination } from './AuditPagination';

interface AuditTableDesktopProps {
  logs: AuditLog[];
  isOrgAccount: boolean;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export const AuditTableDesktop: React.FC<AuditTableDesktopProps> = ({
  logs,
  isOrgAccount,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  onPageChange,
  onNextPage,
  onPrevPage,
}) => {
  return (
    <div className="hidden lg:block bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900/50">
            <tr className="border-b border-gray-700">
              <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">Actor</th>
              <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">Action</th>
              <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">Item</th>
              <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">Date & Time</th>
              {isOrgAccount && <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">IP</th>}
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr 
                key={log.id} 
                className={`border-b border-gray-700/50 hover:bg-gray-750 transition-colors ${
                  index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'
                }`}
              >
                <td className="py-4 px-6 text-white text-sm font-medium">{log.actor}</td>
                <td className="py-4 px-6">
                  <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold ${getSeverityColor(log.severity)}`}>
                    {log.action.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-400 text-sm">{log.item}</td>
                <td className="py-4 px-6 text-gray-400 text-sm">{log.date}</td>
                {isOrgAccount && <td className="py-4 px-6 text-gray-500 text-xs font-mono">{log.ip || '-'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AuditPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={logs.length}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={onPageChange}
        onNextPage={onNextPage}
        onPrevPage={onPrevPage}
      />
    </div>
  );
};
