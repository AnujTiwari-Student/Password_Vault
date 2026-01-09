"use client";
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { APIVaultItem, DecryptedItemData } from "@/types/vault";
import { ItemHeader } from "./ItemHeader";
import { ItemContent } from "./ItemContent";
import { ItemActions } from "./ItemActions";

interface ExtendedDecryptedItemData extends DecryptedItemData {
  name?: string;
  url?: string | null;
}

interface ItemViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: APIVaultItem;
  canEdit: boolean;
  showPassword: boolean;
  showTotp: boolean;
  masterPassphrase: string | null;
  decryptedData: ExtendedDecryptedItemData | null;
  isCurrentlyDecrypting: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  isPending: boolean;
  onTogglePassword: () => void;
  onToggleTotp: () => void;
  onCopySensitive: (field: string) => void;
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
  onEdit,
}) => {
  const [localDeleting, setLocalDeleting] = useState(false);

  const handleDelete = async () => {
    setLocalDeleting(true);
    try {
      const response = await fetch(`/api/items?id=${item.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        onClose();
      }
    } finally {
      setLocalDeleting(false);
    }
  };

  const finalIsDeleting = isDeleting || localDeleting;
  const finalIsEditing = isEditing;

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
          isPending={isPending}
          onTogglePassword={onTogglePassword}
          onToggleTotp={onToggleTotp}
          onCopySensitive={onCopySensitive}
          onViewSensitive={onViewSensitive}
          onUnlockItem={onUnlockItem}
        />

        {canEdit && (
          <ItemActions
            isDeleting={finalIsDeleting}
            isEditing={finalIsEditing}
            isPending={isPending}
            isCurrentlyDecrypting={isCurrentlyDecrypting}
            onDelete={handleDelete}
            onEdit={onEdit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
