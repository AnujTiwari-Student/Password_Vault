import React from 'react';
import { X } from 'lucide-react';

interface APIVaultItem {
  id: string;
  name: string;
  url?: string;
  type: string[]; 
  tags: string[];
  item_key_wrapped: string;
  username_ct?: string;
  password_ct?: string;
  totp_seed_ct?: string;
  note_ct?: string;
  updated_at: string;
}

interface ItemDrawerHeaderProps {
  item: APIVaultItem;
  onClose: () => void;
}

const getTypeColor = (types: string[]) => {
  if (types.length === 1) {
    switch (types[0]) {
      case 'login':
        return 'bg-blue-900/50 text-blue-300 border-blue-700/50';
      case 'totp':
        return 'bg-green-900/50 text-green-300 border-green-700/50';
      case 'note':
        return 'bg-purple-900/50 text-purple-300 border-purple-700/50';
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-700/50';
    }
  }
  return 'bg-gradient-to-r from-blue-900/50 to-green-900/50 text-white border-blue-700/50';
};

const getTypeDisplayString = (types: string[]): string => {
  return types.map(type => type.charAt(0).toUpperCase() + type.slice(1)).join(' + ');
};

export const ItemDrawerHeader: React.FC<ItemDrawerHeaderProps> = ({ item, onClose }) => {
  return (
    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/80 to-gray-850/80 backdrop-blur-sm">
      <div className="flex-1 min-w-0 pr-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">{item.name}</h2>
        <div className="flex flex-wrap gap-1">
          {item.type.length === 1 ? (
            <span className={`inline-block px-2 sm:px-3 py-1 text-xs font-medium rounded-full border ${getTypeColor(item.type)}`}>
              {getTypeDisplayString(item.type)}
            </span>
          ) : (
            <span className={`inline-block px-2 sm:px-3 py-1 text-xs font-medium rounded-full border ${getTypeColor(item.type)}`}>
              {getTypeDisplayString(item.type)}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-gray-800/80 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 group flex-shrink-0"
        title="Close"
      >
        <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
      </button>
    </div>
  );
};
