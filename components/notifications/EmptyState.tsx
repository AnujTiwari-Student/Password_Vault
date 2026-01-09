import React from "react";
import { SquareArrowOutUpRight } from "lucide-react";

export const EmptyState: React.FC = () => {
  return (
    <div className="w-full max-w-8xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Notifications</h2>
      </div>
      <div className="bg-gray-800 border-gray-700 rounded-lg p-8 text-center text-white">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
          <SquareArrowOutUpRight />
        </div>
        <h3 className="text-sm font-medium text-gray-300 mb-2">
          No notifications
        </h3>
        <p className="text-xs text-gray-400">
          You will see organization invitations here
        </p>
      </div>
    </div>
  );
};