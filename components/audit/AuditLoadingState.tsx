"use client";

import React from "react";

export const AuditLoadingState: React.FC<{ message?: string }> = ({ message = "Loading logs..." }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="text-gray-500 text-sm mt-4 font-medium">{message}</p>
    </div>
  );
};