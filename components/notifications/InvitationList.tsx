import React from "react";
import { Invitation } from "./types";
import { InvitationCard } from "./InvitationCard";

interface InvitationListProps {
  invitations: Invitation[];
  onInvitationClick: (invitation: Invitation) => void;
}

export const InvitationList: React.FC<InvitationListProps> = ({
  invitations,
  onInvitationClick,
}) => {
  return (
    <div className="space-y-3">
      {invitations.map((invitation) => (
        <InvitationCard
          key={invitation.id}
          invitation={invitation}
          onClick={() => onInvitationClick(invitation)}
        />
      ))}
    </div>
  );
};