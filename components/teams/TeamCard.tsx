import React from 'react';
import { Users, Calendar } from 'lucide-react';
import { Team } from '@/types/team';

interface TeamCardProps {
  team: Team;
  isSelected: boolean;
  onClick: () => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-gray-700/50 border-gray-600/50 ring-1 ring-gray-600/30'
          : 'bg-gray-700/30 border-gray-600/30 hover:bg-gray-700/40 hover:border-gray-600/40'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-white text-sm md:text-base truncate">{team.name}</h4>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Users className="w-3 h-3" />
          {team.member_count}
        </span>
      </div>
      
      {team.description && (
        <p className="text-xs md:text-sm text-gray-400 mb-3 line-clamp-2">
          {team.description}
        </p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(team.created_at).toLocaleDateString()}
        </span>
        {isSelected && (
          <span className="text-gray-400">Selected</span>
        )}
      </div>
    </div>
  );
};
