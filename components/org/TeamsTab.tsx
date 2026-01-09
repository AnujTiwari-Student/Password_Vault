import React from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TeamCard } from "./TeamCard";
import { TeamWithMembers } from "./types";

interface TeamsTabProps {
  teams: TeamWithMembers[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setSelectedTeam: (team: TeamWithMembers) => void;
  setShowDeleteTeamModal: (show: boolean) => void;
  fetchTeams: () => Promise<void>;
}

export const TeamsTab: React.FC<TeamsTabProps> = ({
  teams,
  searchTerm,
  setSearchTerm,
  setSelectedTeam,
  setShowDeleteTeamModal,
  fetchTeams,
}) => {
  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-750 border-gray-700 focus:border-blue-500 text-white"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold text-white">
          {teams.length} {teams.length === 1 ? "Team" : "Teams"}
        </h4>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-16 bg-gray-750 rounded-lg border border-gray-700">
          <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-400">
            No teams created yet
          </p>
          <p className="text-xs mt-1.5 text-gray-500">
            Teams will appear here once created
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              setSelectedTeam={setSelectedTeam}
              setShowDeleteTeamModal={setShowDeleteTeamModal}
              fetchTeams={fetchTeams}
            />
          ))}
        </div>
      )}
    </div>
  );
};