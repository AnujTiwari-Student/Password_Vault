import React from "react";
import { Mail, Clock, User } from "lucide-react";
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
      className="group relative bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200"
    >
      {/* Notification Dot */}
      <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full ring-4 ring-white shadow-sm animate-pulse z-10"></div>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Icon */}
        <div className="shrink-0">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 text-blue-600 shadow-sm group-hover:scale-105 transition-transform">
            <Mail className="w-6 h-6" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 truncate flex items-center gap-2">
                {invitation.org.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Invited by <span className="font-medium text-gray-900">{invitation.invitedBy.name}</span></span>
              </div>
            </div>

            {/* Role Badge - Desktop */}
            <div className="hidden sm:block">
              <span
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border shadow-sm ${getRoleBadgeClass(
                  invitation.role
                )}`}
              >
                {invitation.role}
              </span>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
              <Clock className="w-3.5 h-3.5" />
              {formatTimeAgo(invitation.created_at)}
            </div>
            
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
              <span>Expires {formatExpiresAt(invitation.expires_at)}</span>
            </div>
          </div>

          {/* Role Badge - Mobile */}
          <div className="mt-4 sm:hidden">
            <span
              className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border shadow-sm ${getRoleBadgeClass(
                invitation.role
              )}`}
            >
              {invitation.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};