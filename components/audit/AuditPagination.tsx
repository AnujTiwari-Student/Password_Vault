"use client";

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export const AuditPagination: React.FC<AuditPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  onNextPage,
  onPrevPage,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-t border-gray-700">
      <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
        Showing <span className="font-semibold text-gray-300">{startIndex + 1}</span> to{" "}
        <span className="font-semibold text-gray-300">{Math.min(endIndex, totalItems)}</span> of{" "}
        <span className="font-semibold text-gray-300">{totalItems}</span> logs
      </div>
      
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onPrevPage}
          disabled={currentPage === 1}
          className="p-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-700 transition-colors border border-gray-600"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} className="text-gray-300" />
        </button>

        <div className="flex gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[40px] h-[40px] rounded-lg font-semibold text-sm transition-all ${
                currentPage === page
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={onNextPage}
          disabled={currentPage === totalPages}
          className="p-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-700 transition-colors border border-gray-600"
          aria-label="Next page"
        >
          <ChevronRight size={18} className="text-gray-300" />
        </button>
      </div>
    </div>
  );
};
