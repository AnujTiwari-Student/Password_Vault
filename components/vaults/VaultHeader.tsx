"use client"

import React from 'react';
import { Search, Filter, Grid, List, Building, User } from 'lucide-react';
import { VaultType } from '@/types/vault';
import { SessionTimer } from '../common/SessionTimer';

interface VaultHeaderProps {
  vaultType: VaultType;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  totalItems: number;
}

export const VaultHeader: React.FC<VaultHeaderProps> = ({
  vaultType,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  totalItems,
}) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {vaultType === 'org' ? (
            <Building className="w-6 h-6 text-blue-400" />
          ) : (
            <User className="w-6 h-6 text-purple-400" />
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">
              {vaultType === 'org' ? 'Organization Vault' : 'Personal Vault'}
            </h2>
            <p className="text-sm text-gray-400">{totalItems} items</p>
          </div>
        </div>
        
        <SessionTimer />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search vault items..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              showFilters
                ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300'
                : 'bg-gray-800/50 border border-gray-700/30 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>

          <div className="flex bg-gray-800/50 border border-gray-700/30 rounded-xl overflow-hidden">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-3 py-2.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-3 py-2.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
