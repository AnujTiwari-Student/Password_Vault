import React from "react";

export const LoadingState: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden w-full">
      {/* Header Skeleton */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/30">
        <div className="flex items-center gap-4 animate-pulse">
          {/* Icon placeholder */}
          <div className="h-10 w-10 bg-gray-200 rounded-xl flex-shrink-0"></div>
          
          {/* Title/Subtitle placeholder */}
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 sm:w-48"></div>
            <div className="h-3 bg-gray-100 rounded w-24 sm:w-32"></div>
          </div>
          
          {/* Action button placeholder */}
          <div className="h-9 w-24 bg-gray-200 rounded-lg hidden sm:block"></div>
        </div>
      </div>
      
      {/* Body Skeleton */}
      <div className="p-6 space-y-6 animate-pulse">
        {/* Text lines */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 rounded w-full"></div>
          <div className="h-4 bg-gray-100 rounded w-5/6"></div>
          <div className="h-4 bg-gray-100 rounded w-4/6"></div>
        </div>
        
        {/* Grid/Card placeholders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="h-24 bg-gray-50 rounded-xl border border-gray-100"></div>
          <div className="h-24 bg-gray-50 rounded-xl border border-gray-100"></div>
        </div>
      </div>
    </div>
  );
};