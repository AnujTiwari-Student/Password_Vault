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
    <div className="px-6 py-5 border-b border-gray-700 bg-gray-800/50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("members")}
            className={`px-5 py-2.5 rounded-lg transition-all font-medium text-sm flex items-center gap-2 ${
              activeTab === "members"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600"
            }`}
          >
            <Users className="w-4 h-4" />
            Members
          </button>
        </div>
      </div>
    </div>
  );
};