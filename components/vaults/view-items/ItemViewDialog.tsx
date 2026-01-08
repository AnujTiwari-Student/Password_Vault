import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { APIVaultItem, DecryptedItemData } from '@/types/vault';
import { ItemHeader } from './ItemHeader';
import { ItemContent } from './ItemContent';
import { ItemActions } from './ItemActions';

interface ItemViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: APIVaultItem;
  canEdit: boolean;
  showPassword: boolean;
  showTotp: boolean;
  masterPassphrase: string | null;
  decryptedData: DecryptedItemData | null;
  isCurrentlyDecrypting: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  isPending: boolean;
  onTogglePassword: () => void;
  onToggleTotp: () => void;
  onCopySensitive: (field: 'username' | 'password' | 'totp_seed') => void;
  onViewSensitive: () => void;
  onUnlockItem: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export const ItemViewDialog: React.FC<ItemViewDialogProps> = ({
  isOpen,
  onClose,
  item,
  canEdit,
  showPassword,
  showTotp,
  masterPassphrase,
  decryptedData,
  isCurrentlyDecrypting,
  isDeleting,
  isEditing,
  isPending,
  onTogglePassword,
  onToggleTotp,
  onCopySensitive,
  onViewSensitive,
  onUnlockItem,
  onDelete,
  onEdit,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-hide bg-gray-800 border-gray-700 text-white">
        <ItemHeader item={item} />
        
        <ItemContent
          item={item}
          showPassword={showPassword}
          showTotp={showTotp}
          masterPassphrase={masterPassphrase}
          decryptedData={decryptedData}
          isCurrentlyDecrypting={isCurrentlyDecrypting}
          isDeleting={isDeleting}
          isPending={isPending}
          onTogglePassword={onTogglePassword}
          onToggleTotp={onToggleTotp}
          onCopySensitive={onCopySensitive}
          onViewSensitive={onViewSensitive}
          onUnlockItem={onUnlockItem}
        />

        {canEdit && (
          <ItemActions
            isDeleting={isDeleting}
            isEditing={isEditing}
            isPending={isPending}
            isCurrentlyDecrypting={isCurrentlyDecrypting}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};