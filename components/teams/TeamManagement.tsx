"use client";


import React, { useState, useEffect, useCallback } from "react";
import { Users, Plus, UserPlus, AlertCircle, UserX } from "lucide-react";
import axios from "axios";
import { Vault, User } from "@/types/vault";
import { Team } from "@/types/team";
import { APIResponse } from "@/types/api-responses";
import { CreateTeamModal } from "./CreateTeamModal";
import { AddMemberModal } from "./AddMemberModal";
import { TeamCard } from "./TeamCard";
import Image from "next/image";


interface TeamManagementProps {
  vault: Vault | null | undefined;
  user: User | null | undefined;
}


interface OrganizationMember {
  id: string;
  user_id: string;
  org_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  ovk_wrapped_for_user: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}


interface TeamsResponse {
  teams: Team[];
}

interface MembersResponse {
  members: OrganizationMember[];
}


export const TeamManagement: React.FC<TeamManagementProps> = ({
  vault,
  user,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [membersLoading, setMembersLoading] = useState<boolean>(true);
  const [showCreateTeam, setShowCreateTeam] = useState<boolean>(false);
  const [showAddMember, setShowAddMember] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);


  const hasValidVault = vault && vault.id;
  const hasValidOrg = vault?.org_id && user?.org?.id;
  const isOrgVault = vault?.type === "org";
  const orgId = user?.org?.id;
  const vaultId = vault?.id;
  const vaultOrgId = vault?.org_id;


  const fetchTeams = useCallback(async (): Promise<void> => {
    if (!vaultOrgId || !vaultId) {
      setLoading(false);
      return;
    }


    try {
      setFetchError(null);
      const response = await axios.get<APIResponse<TeamsResponse>>(
        `/api/teams?org_id=${vaultOrgId}&vault_id=${vaultId}`
      );


      if (response.data.success && response.data.data) {
        const teamsData = response.data.data.teams || [];
        setTeams(teamsData);
        if (teamsData.length > 0) {
          setSelectedTeam(teamsData[0]);
        }
      } else {
        setFetchError(
          response.data.errors?._form?.[0] || "Failed to fetch teams"
        );
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          setTeams([]);
          setFetchError(null);
        } else {
          setFetchError(
            error.response?.data?.errors?._form?.[0] || 
            error.response?.data?.message ||
            error.message ||
            "Failed to fetch teams"
          );
        }
      } else {
        setFetchError("An unexpected error occurred while fetching teams");
      }
    } finally {
      setLoading(false);
    }
  }, [vaultOrgId, vaultId]);


  const fetchOrgMembers = useCallback(async (): Promise<void> => {
    if (!orgId) {
      setMembersLoading(false);
      return;
    }


    try {
      setMembersError(null);
      setMembersLoading(true);


      const response = await axios.get<APIResponse<MembersResponse>>(
        `/api/members?org_id=${orgId}`
      );


      if (response.data.success && response.data.data) {
        const membersData = response.data.data.members || [];
        setOrgMembers(membersData);
      } else {
        setMembersError(
          response.data.errors?._form?.[0] || 
          "Failed to fetch organization members"
        );
        setOrgMembers([]);
      }
    } catch (error) {
      console.error("Failed to fetch organization members:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          setOrgMembers([]);
          setMembersError(null);
        } else {
          setMembersError(
            error.response?.data?.errors?._form?.[0] || 
            error.response?.data?.message ||
            error.message ||
            "Failed to fetch organization members"
          );
        }
      } else {
        setMembersError("An unexpected error occurred while fetching members");
      }
      setOrgMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [orgId]);


  useEffect(() => {
    if (hasValidVault && hasValidOrg && vaultId && vaultOrgId) {
      fetchTeams();
      fetchOrgMembers();
    } else {
      setLoading(false);
      setMembersLoading(false);
    }
  }, [hasValidVault, hasValidOrg, vaultId, vaultOrgId, fetchTeams, fetchOrgMembers]);


  const handleTeamCreated = (newTeam: Team): void => {
    setTeams((prev) => [...prev, newTeam]);
    setSelectedTeam(newTeam);
    setShowCreateTeam(false);
  };


  const handleMemberAdded = (): void => {
    fetchOrgMembers();
    setShowAddMember(false);
  };


  const retryFetchTeams = () => {
    setFetchError(null);
    setLoading(true);
    fetchTeams();
  };


  const retryFetchMembers = () => {
    setMembersError(null);
    fetchOrgMembers();
  };


  if (!vault) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-red-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-red-300 font-semibold text-base">Invalid Vault</p>
            <p className="text-sm mt-1 text-gray-400">
              Vault information is missing or invalid
            </p>
          </div>
        </div>
      </div>
    );
  }


  if (!user) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-red-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-red-300 font-semibold text-base">User Not Found</p>
            <p className="text-sm mt-1 text-gray-400">
              User information is missing or invalid
            </p>
          </div>
        </div>
      </div>
    );
  }


  if (!hasValidVault || !isOrgVault) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-yellow-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-yellow-300 font-semibold text-base">Not Available</p>
            <p className="text-sm mt-1 text-gray-400">
              Team management is only available for organization vaults
            </p>
          </div>
        </div>
      </div>
    );
  }


  if (!hasValidOrg) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-yellow-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-yellow-300 font-semibold text-base">Organization Required</p>
            <p className="text-sm mt-1 text-gray-400">
              This vault requires organization membership to manage teams and members.
            </p>
          </div>
        </div>
      </div>
    );
  }


  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-12 border border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-500/10 rounded-lg">
            <Users size={24} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Teams</h2>
        </div>
        <p className="text-gray-400 text-sm ml-14">
          Organize vault access and collaboration with teams
        </p>
      </div>


      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-700 bg-gray-800/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Team Management - {vault?.name || "Unknown Vault"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Organize access to this vault by teams
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateTeam(true)}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-gray-600"
              >
                <Plus className="w-4 h-4" />
                Create Team
              </button>
              <button
                onClick={() => setShowAddMember(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Add Member
              </button>
            </div>
          </div>
        </div>


        <div className="p-6">
          {fetchError ? (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-red-300 font-semibold">Error Loading Teams</p>
                  <p className="text-sm text-red-400 mt-1">{fetchError}</p>
                </div>
                <button
                  onClick={retryFetchTeams}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-16 bg-gray-750 rounded-lg border border-gray-700">
              <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-base font-semibold text-white mb-2">
                No teams created yet
              </p>
              <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                Create your first team to organize vault access and collaboration
              </p>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all inline-flex items-center gap-2 font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Your First Team
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  isSelected={selectedTeam?.id === team.id}
                  onClick={() => setSelectedTeam(team)}
                />
              ))}
            </div>
          )}
        </div>
      </div>


      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white">
                Organization Members
                {!membersLoading && !membersError && (
                  <span className="text-gray-400 font-normal ml-2">
                    ({orgMembers.length})
                  </span>
                )}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Members with access to this organization
              </p>
            </div>
            {!membersLoading && !membersError && orgMembers.length > 0 && (
              <button
                onClick={retryFetchMembers}
                className="text-sm text-gray-400 hover:text-white transition-colors font-medium"
              >
                Refresh
              </button>
            )}
          </div>
        </div>


        <div className="p-6">
          {membersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-3 p-4 bg-gray-750 rounded-lg border border-gray-700">
                    <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                    <div className="w-16 h-6 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : membersError ? (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-red-300 font-semibold">Error Loading Members</p>
                  <p className="text-sm text-red-400 mt-1">{membersError}</p>
                </div>
                <button
                  onClick={retryFetchMembers}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : orgMembers.length === 0 ? (
            <div className="text-center py-16 bg-gray-750 rounded-lg border border-gray-700">
              <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserX className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-base font-semibold text-white mb-2">
                No members in organization
              </p>
              <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                Start building your team by inviting members to collaborate
              </p>
              <button
                onClick={() => setShowAddMember(true)}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all inline-flex items-center gap-2 font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Invite Your First Member
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orgMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-750 rounded-lg hover:bg-gray-700/70 transition-all border border-gray-700/50 hover:border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    {member.user?.image ? (
                      <Image
                        src={member.user.image}
                        alt={member.user?.name || "User"}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-600/50 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {member.user?.name || "Unknown User"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {member.user?.email || "No email"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold ${
                      member.role === "owner"
                        ? "bg-yellow-900/30 text-yellow-300 border-yellow-700/30 border"
                        : member.role === "admin"
                        ? "bg-blue-900/30 text-blue-300 border-blue-700/30 border"
                        : member.role === "member"
                        ? "bg-green-900/30 text-green-300 border-green-700/30 border"
                        : "bg-gray-700/50 text-gray-400"
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {vaultOrgId && vaultId && (
        <CreateTeamModal
          isOpen={showCreateTeam}
          onClose={() => setShowCreateTeam(false)}
          onTeamCreated={handleTeamCreated}
          orgId={vaultOrgId}
          vaultId={vaultId}
        />
      )}


      {orgId && (
        <AddMemberModal
          isOpen={showAddMember}
          onClose={() => setShowAddMember(false)}
          onMemberAdded={handleMemberAdded}
          orgId={orgId}
        />
      )}
    </div>
  );
};
