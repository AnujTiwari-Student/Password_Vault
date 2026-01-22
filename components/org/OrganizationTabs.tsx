import React from "react";
import { Users } from "lucide-react";

interface OrganizationTabsProps {
  activeTab: "members" | "teams";
  setActiveTab: (tab: "members" | "teams") => void;
}

export const OrganizationTabs: React.FC<OrganizationTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="px-6 py-4 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-5 py-2.5 rounded-xl transition-all font-semibold text-sm flex items-center gap-2 ${
            activeTab === "members"
              ? "bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 shadow-sm"
          }`}
        >
          <Users className="w-4 h-4" />
          Members
        </button>
        
        {/* <button
          onClick={() => setActiveTab("teams")}
          className={`px-5 py-2.5 rounded-xl transition-all font-semibold text-sm flex items-center gap-2 ${
            activeTab === "teams"
              ? "bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 shadow-sm"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Teams
        </button> */}
      </div>
    </div>
  );
};