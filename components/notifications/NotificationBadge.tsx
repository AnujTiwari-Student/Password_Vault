"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { AcceptInviteModal } from "../modals/AcceptInviteModal";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { NotificationHeader } from "./NotificationHeader";
import { InvitationList } from "./InvitationList";
import { Invitation } from "./types";

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

  if (loading) {
    return <LoadingState />;
  }

  if (invitations.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="w-full max-w-8xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Notifications</h2>
        </div>

        <NotificationHeader count={invitations.length} />

        <InvitationList
          invitations={invitations}
          onInvitationClick={handleInvitationClick}
        />
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