import React from "react";
import { Users } from "lucide-react";
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold text-white">
          {filteredMembers.length}{" "}
          {filteredMembers.length === 1 ? "Member" : "Members"}
        </h4>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="text-center py-16 bg-gray-750 rounded-lg border border-gray-700">
          <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-400">No members found</p>
          {searchTerm && (
            <p className="text-xs mt-1.5 text-gray-500">
              Try adjusting your search or filter
            </p>
          )}
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
