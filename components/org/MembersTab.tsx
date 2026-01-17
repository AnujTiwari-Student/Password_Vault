import React from "react";
import { Search, Filter } from "lucide-react";
import { User } from "@/types/vault";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MembersList } from "./MembersList";
import { OrganizationMember } from "./types";

interface MembersTabProps {
  members: OrganizationMember[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: string;
  setRoleFilter: (filter: string) => void;
  user: User;
  setSelectedMember: (member: OrganizationMember) => void;
  setShowRoleModal: (show: boolean) => void;
  setShowRemoveMemberModal: (show: boolean) => void;
  selectedMembers: Set<string>;
  toggleMemberSelection: (id: string) => void;
  selectAllMembers: () => void;
}

export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  user,
  setSelectedMember,
  setShowRoleModal,
  setShowRemoveMemberModal,
  selectedMembers,
  toggleMemberSelection,
  selectAllMembers,
}) => {
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  console.log("Rendering MembersTab with selectedMembers:", selectAllMembers);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-750 border-gray-700 focus:border-blue-500 text-white"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-gray-750 border-gray-700 focus:border-blue-500 text-white">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all" className="text-white hover:bg-gray-700">
              All Roles
            </SelectItem>
            <SelectItem value="owner" className="text-white hover:bg-gray-700">
              Owner
            </SelectItem>
            <SelectItem value="admin" className="text-white hover:bg-gray-700">
              Admin
            </SelectItem>
            <SelectItem value="member" className="text-white hover:bg-gray-700">
              Member
            </SelectItem>
            <SelectItem value="viewer" className="text-white hover:bg-gray-700">
              Viewer
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <MembersList
        filteredMembers={filteredMembers}
        searchTerm={searchTerm}
        user={user}
        setSelectedMember={setSelectedMember}
        setShowRoleModal={setShowRoleModal}
        setShowRemoveMemberModal={setShowRemoveMemberModal}
        selectedMembers={selectedMembers}
        toggleMemberSelection={toggleMemberSelection}
      />
    </div>
  );
};
