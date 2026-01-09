import React from "react";

interface NotificationHeaderProps {
  count: number;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  count,
}) => {
  return (
    <div className="bg-gray-800 border-gray-700 rounded-lg px-4 py-3 sm:px-6 border">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-300">
          Organization Invitations ({count})
        </h2>
      </div>
    </div>
  );
};