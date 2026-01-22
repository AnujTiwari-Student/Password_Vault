import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Globe, FileText, Shield, Lock } from 'lucide-react';
import { APIVaultItem } from '@/types/vault';

interface ItemHeaderProps {
  item: APIVaultItem;
}

export const ItemHeader: React.FC<ItemHeaderProps> = ({ item }) => {
  const getTypeIcon = () => {
    if (item.type.includes('login')) return <Globe className="w-6 h-6 text-blue-600" />;
    if (item.type.includes('totp')) return <Shield className="w-6 h-6 text-emerald-600" />;
    if (item.type.includes('note')) return <FileText className="w-6 h-6 text-purple-600" />;
    return <Lock className="w-6 h-6 text-gray-400" />;
  };

  const getIconBg = () => {
    if (item.type.includes('login')) return "bg-blue-50 border-blue-100";
    if (item.type.includes('totp')) return "bg-emerald-50 border-emerald-100";
    if (item.type.includes('note')) return "bg-purple-50 border-purple-100";
    return "bg-gray-50 border-gray-100";
  };

  return (
    <DialogHeader className="space-y-0">
      <div className="flex items-start gap-4">
        {/* Icon Container */}
        <div className={`p-3 rounded-xl border shadow-sm shrink-0 ${getIconBg()}`}>
          {getTypeIcon()}
        </div>
        
        {/* Text Content */}
        <div className="space-y-1 pt-0.5">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
            {item.name}
          </DialogTitle>
          
          {item.url && (
            <DialogDescription className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.url}
              </a>
            </DialogDescription>
          )}
          {!item.url && (
            <DialogDescription className="text-sm text-gray-500">
              Secure Item
            </DialogDescription>
          )}
        </div>
      </div>
    </DialogHeader>
  );
};