// File: ViewItemModal.tsx
// Path: src/components/vault/ViewItemModal.tsx

"use client"

import React, { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { APIVaultItem, DecryptedItemData } from '@/types/vault';
import { MasterPassphraseModal } from './PassphraseModal';
import { useUserMasterKey } from '@/hooks/useUserMasterKey';
import { useVaultOVK } from '@/hooks/useVaultOvk';
import { useDecryption } from '@/hooks/useDecryption';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { DeleteConfirmDialog, EditItemDialog, ItemViewDialog, useItemActions } from '../vaults/view-items';

interface ViewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: APIVaultItem | null;
  canEdit: boolean;
  vaultType: 'personal' | 'org';
  orgId?: string | null;
}

export const ViewItemModal: React.FC<ViewItemModalProps> = ({
  isOpen,
  onClose,
  item,
  canEdit,
  vaultType,
  orgId,
}) => {
  const user = useCurrentUser();
  const [showPassword, setShowPassword] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  const [showMasterPassphraseModal, setShowMasterPassphraseModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [masterPassphrase, setMasterPassphrase] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const vaultId = vaultType === 'personal' ? user?.vault?.id : item?.vault_id || null;

  const { umkCryptoKey, privateKeyBase64 } = useUserMasterKey(masterPassphrase);
  const { ovkCryptoKey } = useVaultOVK(
    umkCryptoKey,
    vaultId as string,
    vaultType,
    privateKeyBase64,
    orgId
  );

  const { decryptItem, getDecryptedItem, isDecrypting } = useDecryption(ovkCryptoKey);
  const { handleDelete, handleEdit, isDeleting, isEditing } = useItemActions(
    item,
    onClose,
    vaultId as string,
    vaultType,
    orgId
  );

  const decryptedData: DecryptedItemData | null = item ? getDecryptedItem(item.id) : null;
  const isCurrentlyDecrypting = item ? isDecrypting(item.id) : false;

  useEffect(() => {
    if (item && ovkCryptoKey && masterPassphrase && !decryptedData && !isCurrentlyDecrypting) {
      decryptItem(item);
    }
  }, [item, ovkCryptoKey, masterPassphrase, decryptedData, isCurrentlyDecrypting, decryptItem]);

  if (!item) return null;

  const handleVerifyPassphrase = async (passphrase: string): Promise<boolean> => {
    try {
      setMasterPassphrase(passphrase);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const handleViewSensitive = () => {
    if (!masterPassphrase) {
      setShowMasterPassphraseModal(true);
    }
  };

  const handleCopySensitive = (field: 'username' | 'password' | 'totp_seed') => {
    if (!decryptedData) {
      setShowMasterPassphraseModal(true);
      return;
    }

    const value = decryptedData[field];
    if (value) {
      navigator.clipboard.writeText(value);
      const label = field === 'totp_seed' ? 'TOTP' : field.charAt(0).toUpperCase() + field.slice(1);
      toast.success(`${label} copied to clipboard`);
    } else {
      toast.error('No data to copy');
    }
  };

  const handleModalClose = () => {
    setShowPassword(false);
    setShowTotp(false);
    setMasterPassphrase(null);
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    startTransition(async () => {
      await handleDelete();
      setShowDeleteDialog(false);
    });
  };

  const handleEditClick = () => {
    if (!decryptedData) {
      setShowMasterPassphraseModal(true);
      toast.error('Please unlock the item first to edit');
      return;
    }
    setShowEditDialog(true);
  };

  const handleEditSave = (updatedData: Partial<DecryptedItemData>) => {
    startTransition(async () => {
      await handleEdit(updatedData);
      setShowEditDialog(false);
    });
  };

  return (
    <>
      <ItemViewDialog
        isOpen={isOpen}
        onClose={handleModalClose}
        item={item}
        canEdit={canEdit}
        showPassword={showPassword}
        showTotp={showTotp}
        masterPassphrase={masterPassphrase}
        decryptedData={decryptedData}
        isCurrentlyDecrypting={isCurrentlyDecrypting}
        isDeleting={isDeleting}
        isEditing={isEditing}
        isPending={isPending}
        onTogglePassword={() => {
          if (decryptedData) {
            setShowPassword(!showPassword);
          } else {
            handleViewSensitive();
          }
        }}
        onToggleTotp={() => {
          if (decryptedData) {
            setShowTotp(!showTotp);
          } else {
            handleViewSensitive();
          }
        }}
        onCopySensitive={handleCopySensitive}
        onViewSensitive={handleViewSensitive}
        onUnlockItem={() => setShowMasterPassphraseModal(true)}
        onDelete={handleDeleteClick}
        onEdit={handleEditClick}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        itemName={item.name}
      />

      <EditItemDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSave={handleEditSave}
        item={item}
        decryptedData={decryptedData}
        isEditing={isEditing}
      />

      <MasterPassphraseModal
        isOpen={showMasterPassphraseModal}
        onClose={() => setShowMasterPassphraseModal(false)}
        onVerify={handleVerifyPassphrase}
        title="Decrypt Item"
        description="Enter your master passphrase to decrypt and view this item's sensitive data"
      />
    </>
  );
};