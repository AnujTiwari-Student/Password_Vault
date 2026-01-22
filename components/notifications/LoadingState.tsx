import React from "react";

export const LoadingState: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* List Skeletons */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Icon Placeholder */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse"></div>
              </div>

              {/* Content Placeholders */}
              <div className="flex-1 w-full space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 w-full max-w-md">
                    {/* Title */}
                    <div className="h-5 w-3/4 sm:w-1/2 bg-gray-200 rounded animate-pulse"></div>
                    {/* Subtitle */}
                    <div className="h-4 w-1/2 sm:w-1/3 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                  
                  {/* Badge Placeholder (Desktop) */}
                  <div className="hidden sm:block h-7 w-20 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>

                {/* Footer Metadata Placeholders */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="h-6 w-24 bg-gray-50 rounded-md animate-pulse"></div>
                  <div className="h-6 w-32 bg-gray-50 rounded-md animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};