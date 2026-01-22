import React from "react";
import { Shield } from "lucide-react";

export const OrganizationHeader: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="bg-white rounded-xl shadow-sm border flex items-center justify-between w-full border-gray-200 p-6 sm:p-8">
        <div className="gap-4 flex items-center">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Shield size={22} className="text-blue-600" />
          </div>
          <div className="">
            <h2 className="text-3xl lg:text-2xl font-bold text-gray-900">
              Manage Organization
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage your organization settings and members
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
