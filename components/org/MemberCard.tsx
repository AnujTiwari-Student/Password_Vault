import React from "react";
import { Users, MoreHorizontal, Edit3, UserX } from "lucide-react";
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
import { getRoleBadgeColor } from "./utils";

interface MemberCardProps {
  member: OrganizationMember;
  user: User;
  setSelectedMember: (member: OrganizationMember) => void;
  setShowRoleModal: (show: boolean) => void;
  setShowRemoveMemberModal: (show: boolean) => void;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

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
  console.log("onToggleSelect:", onToggleSelect);
  console.log("Rendering MemberCard for member:", member);


  return (
    <div className={`flex items-center justify-between p-4 bg-gray-750 rounded-lg hover:bg-gray-700/70 transition-all border ${
      isSelected ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700/50 hover:border-gray-600'
    }`}>
      <div className="flex items-center gap-3">
        {/* {canSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(member.id)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
            onClick={(e) => e.stopPropagation()}
          />
        )} */}
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
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">
              {member.user?.name || "Unknown User"}
            </p>
            {orgName && (
              <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                {orgName}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {member.user?.email || "No email"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Joined {new Date(member.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${getRoleBadgeColor(
            member.role
          )}`}
        >
          {member.role}
        </span>

        {member.role !== "owner" && member.user_id !== user?.id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-600"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-gray-800 border-gray-700"
            >
              <DropdownMenuItem
                onClick={() => {
                  setSelectedMember(member);
                  setShowRoleModal(true);
                }}
                className="text-white hover:bg-gray-700 cursor-pointer"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Change Role
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedMember(member);
                  setShowRemoveMemberModal(true);
                }}
                className="text-red-300 hover:bg-red-900/20 cursor-pointer"
              >
                <UserX className="w-4 h-4 mr-2" />
                Remove from Org
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};