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
    <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-4 px-6 text-gray-600 font-bold text-sm uppercase tracking-wider">Actor</th>
              <th className="text-left py-4 px-6 text-gray-600 font-bold text-sm uppercase tracking-wider">Action</th>
              <th className="text-left py-4 px-6 text-gray-600 font-bold text-sm uppercase tracking-wider">Item</th>
              <th className="text-left py-4 px-6 text-gray-600 font-bold text-sm uppercase tracking-wider">Date & Time</th>
              {isOrgAccount && <th className="text-left py-4 px-6 text-gray-600 font-bold text-sm uppercase tracking-wider">IP Address</th>}
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr 
                key={log.id} 
                className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="py-4 px-6 text-gray-900 text-sm font-semibold">{log.actor}</td>
                <td className="py-4 px-6">
                  <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${getSeverityColor(log.severity)}`}>
                    {log.action.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-700 text-sm font-medium">{log.item}</td>
                <td className="py-4 px-6 text-gray-600 text-sm">{log.date}</td>
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