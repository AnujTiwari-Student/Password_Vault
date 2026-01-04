"use client"

import React from 'react';
import { Lock, Globe, Shield, FileText } from 'lucide-react';
import { APIVaultItem, MemberRole } from '@/types/vault';
import { getRoleBadgeColor, getMultiTypeColor, formatTimestamp } from '@/utils/vault-helpers';

interface VaultCardProps {
  item: APIVaultItem;
  userRole: MemberRole | null;
  isDecrypted: boolean;
  onClick: () => void;
}

export const VaultCard: React.FC<VaultCardProps> = ({
  item,
  userRole,
  isDecrypted,
  onClick,
}) => {
  const getItemIcon = () => {
    if (item.type.includes('login')) return <Globe className="w-5 h-5" />;
    if (item.type.includes('totp')) return <Shield className="w-5 h-5" />;
    if (item.type.includes('note')) return <FileText className="w-5 h-5" />;
    return <Lock className="w-5 h-5" />;
  };

  return (
    <div
      onClick={onClick}
      className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-4 hover:bg-gray-700/30 hover:border-gray-600/50 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-gray-700/50 rounded-lg group-hover:bg-gray-600/50 transition-colors">
            {getItemIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{item.name}</h3>
            <p className="text-xs text-gray-400 truncate">{item.url || 'No URL'}</p>
          </div>
        </div>
        {isDecrypted && (
          <div className="flex-shrink-0 ml-2">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Decrypted" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {item.type.map((type, index) => (
          <span
            key={index}
            className={`px-2 py-0.5 text-xs rounded-full ${getMultiTypeColor([type])} border`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        ))}
        <span className={`px-2 py-0.5 text-xs rounded-full border ${getRoleBadgeColor(userRole)}`}>
          {userRole}
        </span>
      </div>

      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-xs rounded bg-gray-700/30 text-gray-400"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded bg-gray-700/30 text-gray-400">
              +{item.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500">
        Updated {formatTimestamp(item.updated_at)}
      </div>
    </div>
  );
};
