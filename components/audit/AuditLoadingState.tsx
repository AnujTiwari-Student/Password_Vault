"use client";

export const AuditLoadingState: React.FC<{ message?: string }> = ({ message = "Loading logs..." }) => {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      <p className="text-gray-400 text-sm mt-4">{message}</p>
    </div>
  );
};
