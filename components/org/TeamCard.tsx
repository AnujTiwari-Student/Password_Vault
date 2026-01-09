import React from "react";
import {
  Users,
  MoreHorizontal,
  UserCheck,
  Edit3,
  Trash2,
  UserX,
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
    <div className="border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-all">
      <div className="flex items-center justify-between p-5 bg-gray-750">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-lg">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h5 className="font-semibold text-white text-base">{team.name}</h5>
            <p className="text-xs text-gray-400 mt-0.5">
              {team.description || "No description"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Created {new Date(team.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-gray-700 px-3 py-1.5 rounded-lg">
            <span className="text-xs text-gray-300 font-medium">
              {team.member_count}{" "}
              {team.member_count === 1 ? "member" : "members"}
            </span>
          </div>
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
              <DropdownMenuItem className="text-white hover:bg-gray-700 cursor-pointer">
                <UserCheck className="w-4 h-4 mr-2" />
                Manage Members
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white hover:bg-gray-700 cursor-pointer">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTeam(team);
                  setShowDeleteTeamModal(true);
                }}
                className="text-red-300 hover:bg-red-900/20 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {team.members && team.members.length > 0 && (
        <div className="p-5 bg-gray-800/30 border-t border-gray-700">
          <p className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wide">
            Team Members
          </p>
          <div className="space-y-2">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-750 rounded-lg border border-gray-700/50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-gray-600/50 rounded-full flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <span className="text-sm text-white font-medium">
                    {member.user?.name || "Unknown User"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFromTeam(team.id, member.user_id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-7 px-2"
                >
                  <UserX className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};