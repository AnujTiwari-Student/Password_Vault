import React from 'react';
import { Users, Calendar, Check, Briefcase } from 'lucide-react';
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
      className={`relative group p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-blue-50/60 border-blue-200 ring-1 ring-blue-100 shadow-sm'
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Team Icon Container */}
          <div className={`p-2.5 rounded-xl border transition-colors flex-shrink-0 ${
            isSelected 
              ? 'bg-blue-100 border-blue-200 text-blue-700' 
              : 'bg-gray-50 border-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100'
          }`}>
            <Briefcase className="w-5 h-5" />
          </div>
          
          <div className="min-w-0">
            <h4 className={`font-bold text-base truncate transition-colors ${
              isSelected ? 'text-blue-900' : 'text-gray-900 group-hover:text-blue-700'
            }`}>
              {team.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Users className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>
        </div>

        {/* Selected Indicator */}
        {isSelected && (
          <div className="bg-blue-600 rounded-full p-1 shadow-sm animate-in fade-in zoom-in duration-200 flex-shrink-0">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      
      {/* Description */}
      {team.description && (
        <p className={`text-sm mb-4 line-clamp-2 leading-relaxed ${
          isSelected ? 'text-blue-900/70' : 'text-gray-500'
        }`}>
          {team.description}
        </p>
      )}
      
      {/* Footer */}
      <div className={`flex items-center justify-between text-xs pt-3 border-t transition-colors ${
        isSelected ? 'border-blue-200 text-blue-600/80' : 'border-gray-100 text-gray-400 group-hover:border-gray-100'
      }`}>
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Created {new Date(team.created_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>
    </div>
  );
};