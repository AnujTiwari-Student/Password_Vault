"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { AcceptInviteModal } from "../modals/AcceptInviteModal";
import { LoadingState } from "./LoadingState";
import { InvitationList } from "./InvitationList";
import { Invitation } from "./types";
import { 
  Inbox, 
  Send, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  CalendarDays,
  Building2,
  Mail
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationHeader } from "./NotificationHeader"; // Import new header

export const NotificationBadge: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); 

  const fetchInvitations = async (): Promise<void> => {
    try {
      setLoading(true);
      const typeParam = activeTab === 'sent' ? '?type=sent' : '?type=received';
      const response = await axios.get(`/api/invites${typeParam}`);
      if (response.data.success) {
        setInvitations(response.data.data.invitations || []);
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationClick = (invitation: Invitation): void => {
    if (activeTab === 'inbox') {
      setSelectedInvitation(invitation);
      setShowModal(true);
    }
  };

  const handleInvitationAccepted = (): void => {
    fetchInvitations();
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date() && status === 'pending';
    
    if (status === 'accepted') {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Accepted
        </Badge>
      );
    }
    if (isExpired) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Expired
        </Badge>
      );
    }
    if (status === 'pending') {
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <>
      <div className="w-full mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* New Consolidated Header */}
        <NotificationHeader 
          count={invitations.length} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {loading ? (
          <LoadingState />
        ) : invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-gray-200 border-dashed rounded-xl text-center shadow-sm">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              {activeTab === 'inbox' ? <Inbox className="w-6 h-6 text-gray-400" /> : <Send className="w-6 h-6 text-gray-400" />}
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              {activeTab === 'inbox' ? 'No pending invitations' : 'No invitations sent yet'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {activeTab === 'inbox' 
                ? 'When you are invited to a team, it will appear here.' 
                : 'Invites you send to others will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'inbox' ? (
              <InvitationList
                invitations={invitations}
                onInvitationClick={handleInvitationClick}
              />
            ) : (
              <div className="grid gap-3">
                {invitations.map((invite) => (
                  <div 
                    key={invite.id} 
                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100 text-blue-600">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{invite.email}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 capitalize">{invite.role}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {invite.org?.name || 'Unknown Org'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5" />
                            Sent {new Date(invite.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 self-end sm:self-center">
                      {getStatusBadge(invite.status, invite.expires_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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