"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, AlertCircle, UserX } from "lucide-react";
import axios from "axios";
import { Vault, User } from "@/types/vault";
import { APIResponse } from "@/types/api-responses";
import { AddMemberModal } from "./AddMemberModal";
import Image from "next/image";
import { toast } from "sonner";

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

interface MembersResponse {
  members: OrganizationMember[];
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  vault,
  user,
}) => {
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [membersLoading, setMembersLoading] = useState<boolean>(true);
  const [showAddMember, setShowAddMember] = useState<boolean>(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const hasValidVault = vault && vault.id;
  const hasValidOrg = vault?.org_id && user?.org?.id;
  const isOrgVault = vault?.type === "org";
  const orgId = user?.org?.id;
  const vaultOrgId = vault?.org_id;

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
    if (hasValidVault && hasValidOrg && vaultOrgId) {
      fetchOrgMembers();
    } else {
      setMembersLoading(false);
    }
  }, [hasValidVault, hasValidOrg, vaultOrgId, fetchOrgMembers]);

  const handleMemberAdded = (): void => {
    fetchOrgMembers();
    setShowAddMember(false);
  };

  const retryFetchMembers = () => {
    setMembersError(null);
    fetchOrgMembers();
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove ${memberName} from the organization?`
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete<APIResponse>(
        `/api/members?id=${memberId}`
      );

      if (response.data.success) {
        toast.success("Member removed successfully");
        fetchOrgMembers();
      } else {
        const errorMsg =
          response.data.errors?._form?.[0] || "Failed to remove member";
        toast.error(errorMsg);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg =
          error.response?.data?.errors?._form?.[0] ||
          error.response?.data?.message ||
          error.message ||
          "Failed to remove member";
        toast.error(errorMsg);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  if (!vault) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-red-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-red-300 font-semibold text-base">
              Invalid Vault
            </p>
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
            <p className="text-red-300 font-semibold text-base">
              User Not Found
            </p>
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
            <p className="text-yellow-300 font-semibold text-base">
              Not Available
            </p>
            <p className="text-sm mt-1 text-gray-400">
              Member management is only available for organization vaults
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
            <p className="text-yellow-300 font-semibold text-base">
              Organization Required
            </p>
            <p className="text-sm mt-1 text-gray-400">
              This vault requires organization membership to manage members.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (membersLoading) {
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
          <h2 className="text-2xl font-bold text-white">Members</h2>
        </div>
        <p className="text-gray-400 text-sm ml-14">
          Manage organization members and their access
        </p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-700 bg-gray-800/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Organization Members
                {!membersLoading && !membersError && (
                  <span className="text-gray-400 font-normal ml-2">
                    ({orgMembers.length})
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Members with access to {vault?.name || "this vault"}
              </p>
            </div>
            <button
              onClick={() => setShowAddMember(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          </div>
        </div>

        <div className="p-6">
          {membersError ? (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-red-300 font-semibold">
                    Error Loading Members
                  </p>
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
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all inline-flex items-center gap-2 font-medium"
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
                  <div className="flex items-center gap-3">
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
                    {member.role !== "owner" &&
                      member.user_id !== user?.id && (
                        <button
                          onClick={() =>
                            handleRemoveMember(
                              member.id,
                              member.user?.name || "this member"
                            )
                          }
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remove member"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
