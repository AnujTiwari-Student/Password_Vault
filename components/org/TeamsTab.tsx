import React, { useMemo } from "react";
import { Search, Users, SearchX, Briefcase } from "lucide-react";
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
  // Filter teams based on search term
  const filteredTeams = useMemo(() => {
    return teams.filter((team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teams, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
            <Search className="w-5 h-5" />
          </div>
          <Input
            placeholder="Search teams by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 w-full pl-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all shadow-sm hover:border-gray-300"
          />
        </div>
      </div>

      {/* Header Count */}
      <div className="flex items-center justify-between px-1">
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-gray-500" />
          {filteredTeams.length} {filteredTeams.length === 1 ? "Team" : "Teams"}
        </h4>
      </div>

      {/* Content */}
      {filteredTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 mb-4">
            {searchTerm ? (
              <SearchX className="w-8 h-8 text-gray-400" />
            ) : (
              <Users className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-gray-900 font-bold text-lg mb-1">
            {searchTerm ? "No teams found" : "No teams created yet"}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm">
            {searchTerm
              ? `We couldn't find any teams matching "${searchTerm}".`
              : "Create teams to organize your members and manage access efficiently."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTeams.map((team) => (
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