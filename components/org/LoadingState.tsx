import React from "react";

export const LoadingState: React.FC = () => {
  return (
    <div className="bg-gray-800 rounded-xl p-12 border border-gray-700">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-700 rounded w-1/4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
};