import React from "react";
import { Invitation } from "./types";
import { formatTimeAgo, formatExpiresAt, getRoleBadgeClass } from "./utils";

interface InvitationCardProps {
  invitation: Invitation;
  onClick: () => void;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 border-gray-700 border rounded-lg p-4 sm:p-6 cursor-pointer hover:bg-gray-700 transition-colors relative"
    >
      <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className="bg-blue-600 p-1.5 rounded flex-shrink-0">
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-5 5-5-5h5zm0 0V3"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-white truncate">
                {invitation.org.name}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Invited by {invitation.invitedBy.name}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-2 sm:hidden">
                <span
                  className={`px-2 py-0.5 text-xs rounded ${getRoleBadgeClass(
                    invitation.role
                  )}`}
                >
                  {invitation.role}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(invitation.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex sm:flex-col sm:items-end sm:gap-2">
          <span
            className={`px-2 py-0.5 text-xs rounded ${getRoleBadgeClass(
              invitation.role
            )}`}
          >
            {invitation.role}
          </span>
          <div className="text-right">
            <div className="text-xs text-gray-500">
              {formatTimeAgo(invitation.created_at)}
            </div>
            <div className="text-xs text-yellow-400">
              {formatExpiresAt(invitation.expires_at)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 sm:hidden">
        <div className="text-xs text-yellow-400">
          {formatExpiresAt(invitation.expires_at)}
        </div>
      </div>
    </div>
  );
};