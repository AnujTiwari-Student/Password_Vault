import React from "react";
import { Users, SearchX } from "lucide-react";
import { User } from "@/types/vault";
import { MemberCard } from "./MemberCard";
import { OrganizationMember } from "./types";

interface MembersListProps {
  filteredMembers: OrganizationMember[];
  searchTerm: string;
  user: User;
  setSelectedMember: (member: OrganizationMember) => void;
  setShowRoleModal: (show: boolean) => void;
  setShowRemoveMemberModal: (show: boolean) => void;
  selectedMembers: Set<string>;
  toggleMemberSelection: (id: string) => void;
}

export const MembersList: React.FC<MembersListProps> = ({
  filteredMembers,
  searchTerm,
  user,
  setSelectedMember,
  setShowRoleModal,
  setShowRemoveMemberModal,
  selectedMembers,
  toggleMemberSelection,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between mb-4 px-1">
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          {filteredMembers.length}{" "}
          {filteredMembers.length === 1 ? "Member" : "Members"}
        </h4>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 mb-4">
            {searchTerm ? (
              <SearchX className="w-8 h-8 text-gray-400" />
            ) : (
              <Users className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-gray-900 font-bold text-lg mb-1">
            {searchTerm ? "No members found" : "No members yet"}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm">
            {searchTerm 
              ? `We couldn't find any members matching "${searchTerm}". Try adjusting your search.`
              : "Get started by inviting your first team member to the organization."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              user={user}
              setSelectedMember={setSelectedMember}
              setShowRoleModal={setShowRoleModal}
              setShowRemoveMemberModal={setShowRemoveMemberModal}
              isSelected={selectedMembers.has(member.id)}
              onToggleSelect={toggleMemberSelection}
            />
          ))}
        </div>
      )}
    </div>
  );
};