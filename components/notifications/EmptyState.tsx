import React from "react";
import { BellDot, SquareArrowOutUpRight } from "lucide-react";

export const EmptyState: React.FC = () => {
  return (
    <div className="w-full max-w-8xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-white rounded-xl shadow-sm border flex items-center justify-between w-full border-gray-200 p-6 sm:p-8">
          <div className="gap-4 flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BellDot size={22} className="text-blue-600" />
            </div>
            <div className="">
              <h2 className="text-3xl lg:text-2xl font-bold text-gray-900">
                Manage Notifications
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                View and manage your notifications  
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border mt-6 border-gray-200 rounded-2xl shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-100">
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center border border-gray-100 shadow-sm transform rotate-3 transition-transform hover:rotate-6">
            <SquareArrowOutUpRight className="w-10 h-10 text-gray-400" />
          </div>
          {/* Decorative background element */}
          <div className="absolute inset-0 bg-blue-50 rounded-3xl -z-10 transform -rotate-6 opacity-60"></div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          No new notifications
        </h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
          You are all caught up! Organization invitations and important updates
          will appear here.
        </p>
      </div>
    </div>
  );
};
