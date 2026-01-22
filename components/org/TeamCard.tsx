import React from "react";
import {
  Users,
  MoreHorizontal,
  UserCheck,
  Edit3,
  Trash2,
  UserX,
  Calendar,
  Briefcase
} from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { APIResponse } from "@/types/api-responses";
import { toast } from "sonner";
import { TeamWithMembers } from "./types";

interface TeamCardProps {
  team: TeamWithMembers;
  setSelectedTeam: (team: TeamWithMembers) => void;
  setShowDeleteTeamModal: (show: boolean) => void;
  fetchTeams: () => Promise<void>;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  setSelectedTeam,
  setShowDeleteTeamModal,
  fetchTeams,
}) => {
  const handleRemoveFromTeam = async (
    teamId: string,
    userId: string
  ): Promise<void> => {
    try {
      const response = await axios.delete<APIResponse>(
        `/api/team-members/${teamId}/${userId}`
      );
      if (response.data.success) {
        toast.success("Member removed from team successfully!");
        await fetchTeams();
      }
    } catch (error) {
      console.error("Failed to remove member from team:", error);
      toast.error("Failed to remove member from team");
    }
  };

  return (
    <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-600 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-bold text-gray-900 text-base">{team.name}</h5>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
              {team.description || "No description provided."}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-3 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              Created {new Date(team.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pl-4">
          <div className="bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="text-xs text-gray-600 font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {team.member_count}{" "}
              <span className="hidden sm:inline">{team.member_count === 1 ? "member" : "members"}</span>
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white border-gray-200 shadow-xl rounded-xl min-w-40 p-1.5"
            >
              <DropdownMenuItem className="text-gray-700 hover:bg-gray-50 cursor-pointer rounded-lg px-2 py-2 font-medium">
                <UserCheck className="w-4 h-4 mr-2 text-gray-500" />
                Manage Members
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-700 hover:bg-gray-50 cursor-pointer rounded-lg px-2 py-2 font-medium">
                <Edit3 className="w-4 h-4 mr-2 text-gray-500" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-100 my-1" />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTeam(team);
                  setShowDeleteTeamModal(true);
                }}
                className="text-red-600 hover:bg-red-50 cursor-pointer rounded-lg px-2 py-2 font-medium"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {team.members && team.members.length > 0 && (
        <div className="px-5 py-4 bg-gray-50/80 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
            Team Members
          </p>
          <div className="space-y-2">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-200 transition-colors group/member"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    {member.user?.name ? member.user.name.charAt(0).toUpperCase() : <Users className="w-4 h-4" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-900 font-semibold">
                      {member.user?.name || "Unknown User"}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {member.user?.email}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFromTeam(team.id, member.user_id)}
                  className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover/member:opacity-100"
                  title="Remove from team"
                >
                  <UserX className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};