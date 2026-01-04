"use client";

import React from 'react';

export const DashboardLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-700 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="text-xl font-medium">Loading User Data...</div>
        <div className="text-sm text-gray-400">Please wait while we secure your vault</div>
      </div>
    </div>
  );
};
