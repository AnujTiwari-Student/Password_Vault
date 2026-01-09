import React from "react";
import { Shield } from "lucide-react";

export const AccessDenied: React.FC = () => {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-yellow-500/10 rounded-lg">
          <Shield className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <p className="text-yellow-300 font-semibold text-base">
            Access Denied
          </p>
          <p className="text-sm mt-1 text-gray-400">
            Only organization owners and admins can manage members and teams.
          </p>
        </div>
      </div>
    </div>
  );
};