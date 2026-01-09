import React from "react";

export const LoadingState: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-gray-800 border-gray-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          <span className="ml-3 text-gray-400">Loading invitations...</span>
        </div>
      </div>
    </div>
  );
};