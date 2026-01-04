import React, { useState, useEffect } from "react";
import axios from "axios";
import { AcceptInviteModal } from "../modals/AcceptInviteModal";
import { SquareArrowOutUpRight } from "lucide-react";

interface Invitation {
  id: string;
  org_id: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "pending";
  expires_at: string;
  invited_by: string;
  created_at: string;
  org: {
    id: string;
    name: string;
    owner_user_id: string;
  };
  invitedBy: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export const NotificationBadge: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selectedInvitation, setSelectedInvitation] =
    useState<Invitation | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.get("/api/invites");
      if (response.data.success) {
        setInvitations(response.data.data.invitations || []);
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationClick = (invitation: Invitation): void => {
    setSelectedInvitation(invitation);
    setShowModal(true);
  };

  const handleInvitationAccepted = (): void => {
    fetchInvitations();
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  const formatExpiresAt = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
    } else if (diffHours > 0) {
      return `Expires in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    } else {
      return "Expires soon";
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="bg-gray-800 border-gray-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
            <span className="ml-3 text-gray-400">Loading invitations...</span>
          </div>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="w-full max-w-8xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Notifications</h2>
        </div>
        <div className="bg-gray-800 border-gray-700 rounded-lg p-8 text-center text-white">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
            <SquareArrowOutUpRight />
          </div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            No notifications
          </h3>
          <p className="text-xs text-gray-400">
            You will see organization invitations here
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-8xl mx-auto p-4 space-y-4">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Notifications</h2>
        </div>

        <div className="bg-gray-800 border-gray-700 rounded-lg px-4 py-3 sm:px-6 border">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300">
              Organization Invitations ({invitations.length})
            </h2>
          </div>
        </div>

        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              onClick={() => handleInvitationClick(invitation)}
              className="bg-gray-800 border-gray-700 border rounded-lg p-4 sm:p-6 cursor-pointer hover:bg-gray-700 transition-colors"
            >
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
                          className={`px-2 py-0.5 text-xs rounded ${
                            invitation.role === "owner"
                              ? "bg-yellow-900/30 text-yellow-300"
                              : invitation.role === "admin"
                              ? "bg-blue-900/30 text-blue-300"
                              : "bg-gray-700/50 text-gray-400"
                          }`}
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
                    className={`px-2 py-0.5 text-xs rounded ${
                      invitation.role === "owner"
                        ? "bg-yellow-900/30 text-yellow-300"
                        : invitation.role === "admin"
                        ? "bg-blue-900/30 text-blue-300"
                        : "bg-gray-700/50 text-gray-400"
                    }`}
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
          ))}
        </div>
      </div>

      <AcceptInviteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        invitation={selectedInvitation}
        onAccepted={handleInvitationAccepted}
      />
    </>
  );
};
