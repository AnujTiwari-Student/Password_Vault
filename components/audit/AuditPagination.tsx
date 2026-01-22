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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5 border-t border-gray-200 bg-gray-50">
      <div className="text-sm text-gray-600 text-center sm:text-left font-medium">
        Showing <span className="font-bold text-blue-600">{startIndex + 1}</span> to{" "}
        <span className="font-bold text-blue-600">{Math.min(endIndex, totalItems)}</span> of{" "}
        <span className="font-bold text-blue-600">{totalItems}</span> logs
      </div>
      
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onPrevPage}
          disabled={currentPage === 1}
          className="p-2.5 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors border border-gray-300"
          aria-label="Previous page"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>

        <div className="flex gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[44px] h-[44px] rounded-lg font-bold text-sm transition-all ${
                currentPage === page
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={onNextPage}
          disabled={currentPage === totalPages}
          className="p-2.5 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors border border-gray-300"
          aria-label="Next page"
        >
          <ChevronRight size={20} className="text-gray-700" />
        </button>
      </div>
    </div>
  );
};