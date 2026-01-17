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
import { toast } from "sonner";

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
  const [currentOrgId, setCurrentOrgId] = useState<string>(orgId);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    if (orgId && orgId !== currentOrgId) {
      console.log("Organization changed from", currentOrgId, "to", orgId);
      setCurrentOrgId(orgId);
      setMembers([]);
      setLoading(true);
    }
  }, [orgId, currentOrgId]);

  const isOwnerOrAdmin =
    user?.org?.owner_user_id === user?.id ||
    members.find((m) => m.user_id === user?.id)?.role === "admin";

  const fetchMembers = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      console.log("=== FETCH MEMBERS START ===");
      console.log("Fetching members for all user's organizations");
      console.log("User:", user?.name, "User ID:", user?.id);

      const response = await axios.get<APIResponse<MembersResponse>>(
        `/api/members/all-orgs?user_id=${user.id}`
      );

      console.log("API Response success:", response.data.success);

      if (response.data.success && response.data.data) {
        const fetchedMembers = response.data.data.members || [];
        console.log("Total member entries fetched:", fetchedMembers.length);
        console.log(
          "Members details:",
          fetchedMembers.map((m) => ({
            name: m.user?.name,
            email: m.user?.email,
            org_id: m.org_id,
            org_name: m.org?.name,
            membership_id: m.id,
            role: m.role,
          }))
        );

        setMembers(fetchedMembers);
      }
      console.log("=== FETCH MEMBERS END ===");
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.name]);

  const fetchTeams = useCallback(async (): Promise<void> => {
    if (!currentOrgId || !user.vault?.id) return;

    try {
      const response = await axios.get<APIResponse<TeamsResponse>>(
        `/api/teams?org_id=${currentOrgId}&vault_id=${user.vault.id}`
      );
      if (response.data.success && response.data.data) {
        setTeams(response.data.data.teams || []);
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    }
  }, [currentOrgId, user.vault?.id]);

  useEffect(() => {
    console.log(
      "OrganizationManagement effect triggered - currentOrgId:",
      currentOrgId
    );
    if (currentOrgId) {
      fetchMembers();
      fetchTeams();
    }
  }, [currentOrgId, fetchMembers, fetchTeams]);

  if (!isOwnerOrAdmin && !loading) {
    return <AccessDenied />;
  }

  if (loading) {
    return <LoadingState />;
  }

  const toggleMemberSelection = (memberId: string) => {
    const newSelection = new Set(selectedMembers);
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId);
    } else {
      newSelection.add(memberId);
    }
    setSelectedMembers(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const selectAllMembers = () => {
    const allIds = new Set(
      members
        .filter((m) => m.role !== "owner" && m.user_id !== user?.id)
        .map((m) => m.id)
    );
    setSelectedMembers(allIds);
    setShowBulkActions(allIds.size > 0);
  };

  const clearSelection = () => {
    setSelectedMembers(new Set());
    setShowBulkActions(false);
  };

  const handleBulkRemove = async () => {
    if (!confirm(`Remove ${selectedMembers.size} members?`)) return;

    startTransition(async () => {
      let successCount = 0;
      let errorCount = 0;

      for (const memberId of selectedMembers) {
        const member = members.find((m) => m.id === memberId);
        if (!member) continue;

        try {
          const response = await axios.delete(
            `/api/members?id=${memberId}&org_id=${member.org_id}`
          );
          if (response.data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error("Failed to remove member:", error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} member(s) removed successfully`);
        await fetchMembers();
      }
      if (errorCount > 0) {
        toast.error(`Failed to remove ${errorCount} member(s)`);
      }

      clearSelection();
    });
  };

  return (
    <div className="space-y-8">
      <OrganizationHeader />

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <OrganizationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="p-6">
          {activeTab === "members" ? (
            <div className="space-y-4">
              {showBulkActions && (
                <div className="flex items-center justify-between p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                  <span className="text-sm text-blue-300">
                    {selectedMembers.size} member(s) selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={clearSelection}
                      className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleBulkRemove}
                      className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                      disabled={isPending}
                    >
                      Remove Selected
                    </button>
                  </div>
                </div>
              )}
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
                selectedMembers={selectedMembers}
                toggleMemberSelection={toggleMemberSelection}
                selectAllMembers={selectAllMembers}
              />
            </div>
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
        userId={user.id}
        currentOrgId={currentOrgId}
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
