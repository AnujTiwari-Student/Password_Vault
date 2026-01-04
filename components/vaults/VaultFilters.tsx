"use client"

import React from 'react';
import { X } from 'lucide-react';
import { ItemType } from '@/types/vault';

interface VaultFiltersProps {
  isOpen: boolean;
  selectedType: ItemType | 'all';
  selectedTag: string | null;
  availableTags: string[];
  onTypeChange: (type: ItemType | 'all') => void;
  onTagChange: (tag: string | null) => void;
  onClearFilters: () => void;
}

export const VaultFilters: React.FC<VaultFiltersProps> = ({
  isOpen,
  selectedType,
  selectedTag,
  availableTags,
  onTypeChange,
  onTagChange,
  onClearFilters,
}) => {
  if (!isOpen) return null;

  const types: Array<{ value: ItemType | 'all'; label: string; color: string }> = [
    { value: 'all', label: 'All Types', color: 'bg-gray-700/50' },
    { value: 'login', label: 'Logins', color: 'bg-blue-900/30' },
    { value: 'note', label: 'Notes', color: 'bg-purple-900/30' },
    { value: 'totp', label: 'TOTP', color: 'bg-green-900/30' },
  ];

  return (
    <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Filters</h3>
        <button
          onClick={onClearFilters}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
          <div className="flex flex-wrap gap-2">
            {types.map((type) => (
              <button
                key={type.value}
                onClick={() => onTypeChange(type.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedType === type.value
                    ? `${type.color} border border-gray-600/30 text-white`
                    : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {availableTags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagChange(tag === selectedTag ? null : tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                    selectedTag === tag
                      ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300'
                      : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  {tag}
                  {selectedTag === tag && <X className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
