import React from "react";
import { BellRing, Inbox, Send } from "lucide-react";

interface NotificationHeaderProps {
  count: number;
  activeTab: 'inbox' | 'sent';
  onTabChange: (tab: 'inbox' | 'sent') => void;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  count,
  activeTab,
  onTabChange
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      {/* Title Section */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 shrink-0">
            <BellRing className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Notifications
            {count > 0 && activeTab === 'inbox' && (
                <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full min-w-5 animate-in zoom-in">
                {count}
                </span>
            )}
            </h2>
            <p className="text-xs text-gray-500 font-medium">Manage your team invitations</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-gray-100/80 rounded-lg border border-gray-200/60 w-full sm:w-auto">
        <button
          onClick={() => onTabChange('inbox')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === 'inbox'
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Inbox
        </button>
        <button
          onClick={() => onTabChange('sent')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === 'sent'
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          <Send className="w-4 h-4" />
          Sent
        </button>
      </div>
    </div>
  );
};