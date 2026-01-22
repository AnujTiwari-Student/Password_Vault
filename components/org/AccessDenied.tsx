import React from "react";
import { Shield, Lock } from "lucide-react";

export const AccessDenied: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex-shrink-0">
          <Shield className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-gray-900 font-bold text-base flex items-center gap-2">
            Access Restricted
            <Lock className="w-3.5 h-3.5 text-gray-400" />
          </h3>
          <p className="text-sm mt-1 text-gray-500 leading-relaxed">
            You do not have permission to view this section. Only organization <span className="font-medium text-gray-900">Owners</span> and <span className="font-medium text-gray-900">Admins</span> can manage members and teams.
          </p>
        </div>
      </div>
    </div>
  );
};