import React from 'react';
import { X, KeyRound, ShieldCheck, FileText, Layers } from 'lucide-react';

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

const getTypeConfig = (types: string[]) => {
  if (types.length > 1) {
    return {
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Layers
    };
  }
  
  switch (types[0]) {
    case 'login':
      return {
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: KeyRound
      };
    case 'totp':
      return {
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: ShieldCheck
      };
    case 'note':
      return {
        className: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: FileText
      };
    default:
      return {
        className: 'bg-gray-50 text-gray-700 border-gray-200',
        icon: Layers
      };
  }
};

const getTypeDisplayString = (types: string[]): string => {
  if (types.length > 1) return 'Combined Item';
  return types[0].charAt(0).toUpperCase() + types[0].slice(1);
};

export const ItemDrawerHeader: React.FC<ItemDrawerHeaderProps> = ({ item, onClose }) => {
  const config = getTypeConfig(item.type);
  const Icon = config.icon;

  return (
    <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-white">
      <div className="flex-1 min-w-0 pr-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 truncate tracking-tight leading-snug">
          {item.name}
        </h2>
        
        <div className="flex flex-wrap gap-2">
          {/* Main Type Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md border uppercase tracking-wide ${config.className}`}>
            <Icon className="w-3.5 h-3.5" />
            {getTypeDisplayString(item.type)}
          </span>

          {/* Individual type tags for combined items */}
          {item.type.length > 1 && (
            <div className="flex items-center gap-1">
              <span className="text-gray-300 text-xs">|</span>
              {item.type.map((type, idx) => (
                <span key={idx} className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded capitalize">
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <button
        onClick={onClose}
        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors shrink-0"
        title="Close"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};