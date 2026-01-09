"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { User } from "@/types/vault";
import { APIResponse } from "@/types/api-responses";
import { AccessDenied } from "./AccessDenied";
import { LoadingState } from "./LoadingState";
import { OrganizationHeader } from "./OrganizationHeader";
import { OrganizationTabs } from "./OrganizationTabs";
import { MembersTab } from "./MembersTab";
import { TeamsTab } from "./TeamsTab";
import { RoleChangeModal } from "./RoleChangeModal";
import { RemoveMemberModal } from "./RemoveMemberModal";
import { DeleteTeamModal } from "./DeleteTeamModal";
import {
  OrganizationMember,
  TeamWithMembers,
  MembersResponse,
  TeamsResponse,
} from "./types";

interface OrganizationManagementProps {
  user: User;
  orgId: string;
}

export const OrganizationManagement: React.FC<OrganizationManagementProps> = ({
  user,
  orgId,
}) => {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [selectedMember, setSelectedMember] =
    useState<OrganizationMember | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] =
    useState<boolean>(false);
  const [showDeleteTeamModal, setShowDeleteTeamModal] =
    useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"members" | "teams">("members");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [newRole, setNewRole] = useState<string>("");

  const isOwnerOrAdmin =
    user?.org?.owner_user_id === user?.id ||
    members.find((m) => m.user_id === user?.id)?.role === "admin";

  const fetchMembers = useCallback(async (): Promise<void> => {
    try {
      const response = await axios.get<APIResponse<MembersResponse>>(
        `/api/members?org_id=${orgId}`
      );
      if (response.data.success && response.data.data) {
        setMembers(response.data.data.members || []);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const fetchTeams = useCallback(async (): Promise<void> => {
    try {
      const response = await axios.get<APIResponse<TeamsResponse>>(
        `/api/teams?org_id=${orgId}&vault_id=${user.vault!.id}`
      );
      if (response.data.success && response.data.data) {
        setTeams(response.data.data.teams || []);
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    }
  }, [orgId, user.vault]);

  useEffect(() => {
    fetchMembers();
    fetchTeams();
  }, [fetchMembers, fetchTeams]);

  if (!isOwnerOrAdmin) {
    return <AccessDenied />;
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <OrganizationHeader />

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <OrganizationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="p-6">
          {activeTab === "members" ? (
            <MembersTab
              members={members}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              user={user}
              setSelectedMember={setSelectedMember}
              setShowRoleModal={setShowRoleModal}
              setShowRemoveMemberModal={setShowRemoveMemberModal}
            />
          ) : (
            <TeamsTab
              teams={teams}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setSelectedTeam={setSelectedTeam}
              setShowDeleteTeamModal={setShowDeleteTeamModal}
              fetchTeams={fetchTeams}
            />
          )}
        </div>
      </div>

      <RoleChangeModal
        showRoleModal={showRoleModal}
        setShowRoleModal={setShowRoleModal}
        selectedMember={selectedMember}
        setSelectedMember={setSelectedMember}
        newRole={newRole}
        setNewRole={setNewRole}
        error={error}
        setError={setError}
        success={success}
        setSuccess={setSuccess}
        isPending={isPending}
        startTransition={startTransition}
        fetchMembers={fetchMembers}
      />

      <RemoveMemberModal
        showRemoveMemberModal={showRemoveMemberModal}
        setShowRemoveMemberModal={setShowRemoveMemberModal}
        selectedMember={selectedMember}
        setSelectedMember={setSelectedMember}
        error={error}
        setError={setError}
        success={success}
        setSuccess={setSuccess}
        isPending={isPending}
        startTransition={startTransition}
        fetchMembers={fetchMembers}
      />

      <DeleteTeamModal
        showDeleteTeamModal={showDeleteTeamModal}
        setShowDeleteTeamModal={setShowDeleteTeamModal}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
        error={error}
        setError={setError}
        success={success}
        setSuccess={setSuccess}
        isPending={isPending}
        startTransition={startTransition}
        fetchTeams={fetchTeams}
      />
    </div>
  );
};