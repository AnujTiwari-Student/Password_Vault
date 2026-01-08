import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Globe, FileText, Shield } from 'lucide-react';
import { APIVaultItem } from '@/types/vault';

interface ItemHeaderProps {
  item: APIVaultItem;
}

export const ItemHeader: React.FC<ItemHeaderProps> = ({ item }) => {
  const getTypeIcon = () => {
    if (item.type.includes('login')) return <Globe className="w-5 h-5" />;
    if (item.type.includes('totp')) return <Shield className="w-5 h-5" />;
    if (item.type.includes('note')) return <FileText className="w-5 h-5" />;
    return null;
  };

  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-3 text-2xl">
        {getTypeIcon()}
        {item.name}
      </DialogTitle>
      {item.url && (
        <DialogDescription className="text-gray-400">
          {item.url}
        </DialogDescription>
      )}
    </DialogHeader>
  );
};