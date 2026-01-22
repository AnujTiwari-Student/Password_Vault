import React from "react";
import { Users, MoreHorizontal, Edit3, UserX, Building2, Calendar, Shield } from "lucide-react";
import Image from "next/image";
import { User } from "@/types/vault";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { OrganizationMember } from "./types";

interface MemberCardProps {
  member: OrganizationMember;
  user: User;
  setSelectedMember: (member: OrganizationMember) => void;
  setShowRoleModal: (show: boolean) => void;
  setShowRemoveMemberModal: (show: boolean) => void;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

// Local style helper to guarantee the badge colors match your screenshots
const getBadgeStyles = (role: string) => {
  switch (role.toLowerCase()) {
    case "owner":
      return "bg-amber-100 text-amber-700 border-amber-200"; // Specific Amber for Owner
    case "admin":
      return "bg-indigo-100 text-indigo-700 border-indigo-200"; // Indigo for Admin
    case "member":
      return "bg-gray-100 text-gray-600 border-gray-200"; // Gray for Member
    case "viewer":
      return "bg-slate-100 text-slate-500 border-slate-200";
    default:
      return "bg-gray-50 text-gray-500 border-gray-200";
  }
};

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  user,
  setSelectedMember,
  setShowRoleModal,
  setShowRemoveMemberModal,
  isSelected,
  onToggleSelect,
}) => {
  const orgName = member.org?.name || member.org_name || '';
  
  // Keep logs for debugging as requested
  console.log("onToggleSelect:", onToggleSelect); 
  
  return (
    <div 
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
        isSelected 
          ? 'bg-blue-50/50 border-blue-300 shadow-sm ring-1 ring-blue-100' 
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-4 w-full sm:w-auto min-w-0">
        {/* Avatar Section */}
        <div className="flex-shrink-0">
          {member.user?.image ? (
            <Image
              src={member.user.image}
              alt={member.user?.name || "User"}
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
              <Users className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-base font-bold text-gray-900 truncate">
              {member.user?.name || "Unknown User"}
            </p>
            {orgName && (
              <span className="inline-flex flex-shrink-0 items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide border border-blue-200">
                <Building2 className="w-3 h-3" />
                {orgName}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-500 truncate mb-1.5 font-medium">
            {member.user?.email || "No email"}
          </p>
          
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>Joined {new Date(member.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Actions Section - Stacked on mobile, Row on desktop */}
      <div className="flex items-center justify-between sm:justify-end gap-3 mt-4 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100 w-full sm:w-auto">
        {/* Role Badge with Correct Colors */}
        <span
          className={`inline-flex items-center justify-center min-w-[70px] px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md border shadow-sm ${getBadgeStyles(
            member.role
          )}`}
        >
          {member.role === 'owner' && <Shield className="w-3 h-3 mr-1" />}
          {member.role}
        </span>

        {member.role !== "owner" && member.user_id !== user?.id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg -mr-2 sm:mr-0"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white border-gray-200 shadow-xl rounded-xl min-w-[160px] p-1.5"
            >
              <DropdownMenuItem
                onClick={() => {
                  setSelectedMember(member);
                  setShowRoleModal(true);
                }}
                className="text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer rounded-lg px-2 py-2 font-medium"
              >
                <Edit3 className="w-4 h-4 mr-2.5" />
                Change Role
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-100 my-1" />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedMember(member);
                  setShowRemoveMemberModal(true);
                }}
                className="text-red-600 hover:bg-red-50 cursor-pointer rounded-lg px-2 py-2 font-medium"
              >
                <UserX className="w-4 h-4 mr-2.5" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};