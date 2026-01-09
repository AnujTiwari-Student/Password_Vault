import React from "react";
import { Shield } from "lucide-react";

export const OrganizationHeader: React.FC = () => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-blue-500/10 rounded-lg">
          <Shield size={24} className="text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Manage Organization</h2>
      </div>
      <p className="text-gray-400 text-sm ml-14">
        Control your organization members, teams, and permissions
      </p>
    </div>
  );
};