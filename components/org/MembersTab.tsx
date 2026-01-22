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

  // Keep for debugging/logic preservation
  console.log(selectAllMembers);

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 w-full items-stretch sm:items-center">
        {/* Search Input - Flex Grow */}
        <div className="relative flex-grow group">
          <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors pointer-events-none z-10">
            <Search className="w-4 h-4" />
          </div>
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all shadow-sm hover:border-gray-300"
          />
        </div>
        
        {/* Filter Dropdown - Fixed Width */}
        <div className="w-full sm:w-[160px] flex-shrink-0">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-11 w-full bg-white border-gray-200 text-gray-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 rounded-xl shadow-sm hover:bg-gray-50/50 hover:border-gray-300 transition-all px-3.5">
              <div className="flex items-center gap-2 w-full">
                <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="font-medium text-sm truncate flex-1 text-left">
                  <SelectValue placeholder="All Roles" />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent 
              align="end"
              className="bg-white border-gray-200 shadow-xl rounded-xl w-[160px]"
            >
              <SelectItem value="all" className="text-gray-700 hover:bg-gray-50 cursor-pointer py-2.5 px-3 rounded-lg focus:bg-gray-50 font-medium text-sm">
                All Roles
              </SelectItem>
              <SelectItem value="owner" className="text-gray-700 hover:bg-amber-50 cursor-pointer py-2.5 px-3 rounded-lg focus:bg-amber-50 text-sm">
                Owner
              </SelectItem>
              <SelectItem value="admin" className="text-gray-700 hover:bg-indigo-50 cursor-pointer py-2.5 px-3 rounded-lg focus:bg-indigo-50 text-sm">
                Admin
              </SelectItem>
              <SelectItem value="member" className="text-gray-700 hover:bg-emerald-50 cursor-pointer py-2.5 px-3 rounded-lg focus:bg-emerald-50 text-sm">
                Member
              </SelectItem>
              <SelectItem value="viewer" className="text-gray-700 hover:bg-slate-50 cursor-pointer py-2.5 px-3 rounded-lg focus:bg-slate-50 text-sm">
                Viewer
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
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