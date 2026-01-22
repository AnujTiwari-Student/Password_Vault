"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  AlertCircle,
  UserX,
  Shield,
  Mail,
  Building,
  ChevronRight,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { Vault, User } from "@/types/vault";
import { APIResponse } from "@/types/api-responses";
import { AddMemberModal } from "./AddMemberModal";
import Image from "next/image";
import { MemberDetailsModal } from "../organization/MemberDetailsModal";

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
  org?: {
    id: string;
    name: string;
    owner_user_id: string;
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
  const [selectedMemberForDetails, setSelectedMemberForDetails] =
    useState<OrganizationMember | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const hasValidVault = vault && vault.id;
  const hasValidOrg = vault?.org_id && user?.org?.id;
  const isOrgVault = vault?.type === "org";

  const fetchOrgMembers = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setMembersLoading(false);
      return;
    }

    try {
      setMembersError(null);
      setMembersLoading(true);

      const response = await axios.get<APIResponse<MembersResponse>>(
        `/api/members/all-orgs?user_id=${user.id}`,
      );

      if (response.data.success && response.data.data) {
        const membersData = response.data.data.members || [];
        setOrgMembers(membersData);
      } else {
        setMembersError(
          response.data.errors?._form?.[0] ||
            "Failed to fetch organization members",
        );
        setOrgMembers([]);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          setOrgMembers([]);
          setMembersError(null);
        } else {
          setMembersError(
            error.response?.data?.errors?._form?.[0] ||
              error.response?.data?.message ||
              error.message ||
              "Failed to fetch organization members",
          );
        }
      } else {
        setMembersError("An unexpected error occurred while fetching members");
      }
      setOrgMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (hasValidVault && hasValidOrg) {
      fetchOrgMembers();
    } else {
      setMembersLoading(false);
    }
  }, [hasValidVault, hasValidOrg, fetchOrgMembers]);

  const handleMemberAdded = (): void => {
    fetchOrgMembers();
    setShowAddMember(false);
  };

  const retryFetchMembers = () => {
    setMembersError(null);
    fetchOrgMembers();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "admin":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "member":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (!vault) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-50 rounded-xl border border-red-100">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-gray-900 font-bold text-base">Invalid Vault</h3>
            <p className="text-sm mt-1 text-gray-500">
              Vault information is missing or invalid. Please check your
              configuration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-50 rounded-xl border border-red-100">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-gray-900 font-bold text-base">
              User Not Found
            </h3>
            <p className="text-sm mt-1 text-gray-500">
              User information could not be retrieved. Please try logging in
              again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasValidVault || !isOrgVault) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-gray-900 font-bold text-base">
              Feature Not Available
            </h3>
            <p className="text-sm mt-1 text-gray-500">
              Team management is exclusively available for Organization vaults.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasValidOrg) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-gray-900 font-bold text-base">
              Organization Required
            </h3>
            <p className="text-sm mt-1 text-gray-500">
              You must be part of an organization to manage team members.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (membersLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-sm flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-900 font-medium">Loading team members...</p>
        <p className="text-gray-500 text-sm mt-1">
          Fetching organization details
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-white rounded-xl shadow-sm border flex items-center justify-between w-full border-gray-200 p-6 sm:p-8">
          <div className="gap-4 flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users size={22} className="text-blue-600" />
            </div>
            <div className="">
              <h2 className="text-3xl lg:text-2xl font-bold text-gray-900">
                Member Management
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage your organization&apos;s team members
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Organization Members
            </h3>
            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
              {orgMembers.length}
            </span>
          </div>
        </div>

        <div className="p-6">
          {membersError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center text-center">
              <div className="bg-red-100 p-3 rounded-full mb-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-red-900 font-bold mb-1">
                Error Loading Members
              </h3>
              <p className="text-red-700 text-sm mb-4">{membersError}</p>
              <button
                onClick={retryFetchMembers}
                className="px-4 py-2 bg-white border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Try Again
              </button>
            </div>
          ) : orgMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 mb-4">
                <UserX className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-gray-900 font-bold text-lg mb-2">
                No members yet
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm">
                Your organization does not have any members yet. Invite your
                team to start collaborating.
              </p>
              <button
                onClick={() => setShowAddMember(true)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Invite First Member
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {orgMembers.map((member) => {
                const orgName = member.org?.name || "";
                return (
                  <div
                    key={member.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer relative"
                    onClick={() => {
                      setSelectedMemberForDetails(member);
                      setShowDetailsModal(true);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {member.user?.image ? (
                        <Image
                          src={member.user.image}
                          alt={member.user?.name || "User"}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-xl border border-gray-100 object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                          <Users className="w-6 h-6" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {member.user?.name || "Unknown User"}
                          </h4>
                          {orgName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide border border-blue-100">
                              <Building className="w-3 h-3" />
                              {orgName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-600">
                          <Mail className="w-3.5 h-3.5" />
                          <span>
                            {member.user?.email || "No email provided"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 mt-4 sm:mt-0 pl-16 sm:pl-0">
                      <div
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${getRoleColor(member.role)}`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        {member.role}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <MemberDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedMemberForDetails(null);
        }}
        // @ts-expect-error passing OrganizationMember
        member={selectedMemberForDetails}
      />

      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onMemberAdded={handleMemberAdded}
      />
    </div>
  );
};
