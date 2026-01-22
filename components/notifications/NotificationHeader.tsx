import React from "react";
import { BellRing } from "lucide-react";

interface NotificationHeaderProps {
  count: number;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  count,
}) => {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5 sm:px-6">
      <div className="flex items-center gap-2.5">
        <BellRing className="w-4 h-4 text-blue-600" />
        <h2 className="text-sm font-semibold text-blue-900">
          Pending Invitations
          <span className="ml-2 inline-flex items-center justify-center bg-blue-200 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full min-w-5">
            {count}
          </span>
        </h2>
      </div>
    </div>
  );
};