"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { APIVaultItem } from "@/types/vault";
import { MasterPassphraseModal } from "./PassphraseModal";
import { useUserMasterKey } from "@/hooks/useUserMasterKey";
import { useVaultOVK } from "@/hooks/useVaultOvk";
import { useDecryption } from "@/hooks/useDecryption";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  DeleteConfirmDialog,
  EditItemDialog,
  ItemViewDialog,
} from "../vaults/view-items";

interface ViewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: APIVaultItem | null;
  canEdit: boolean;
  vaultType: "personal" | "org";
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [hasAttemptedDecrypt, setHasAttemptedDecrypt] = useState(false);

  const toastShownRef = useRef<Set<string>>(new Set());

  const vaultId = vaultType === "personal" ? user?.vault?.id : item?.vault_id || null;

  const { umkCryptoKey, privateKeyBase64 } = useUserMasterKey(masterPassphrase);
  const { ovkCryptoKey } = useVaultOVK(umkCryptoKey, vaultId as string, vaultType, privateKeyBase64, orgId);
  const { decryptItem, getDecryptedItem, isDecrypting } = useDecryption(ovkCryptoKey);

  const decryptedData = item ? getDecryptedItem(item.id) : null;
  const isCurrentlyDecrypting = item ? isDecrypting(item.id) : false;

  const showToastOnce = useCallback((key: string, type: 'success' | 'error', message: string) => {
    if (!toastShownRef.current.has(key)) {
      toastShownRef.current.add(key);
      if (type === 'success') {
        toast.success(message);
      } else {
        toast.error(message);
      }
      setTimeout(() => {
        toastShownRef.current.delete(key);
      }, 3000);
    }
  }, []);

  useEffect(() => {
    const attemptDecryption = async () => {
      if (item && ovkCryptoKey && masterPassphrase && !decryptedData && !isCurrentlyDecrypting && !hasAttemptedDecrypt) {
        setHasAttemptedDecrypt(true);
        try {
          await decryptItem(item);
          showToastOnce(`decrypt-success-${item.id}`, 'success', 'Item decrypted successfully');
        } catch (error) {
          console.error('Failed to decrypt item:', error);
          showToastOnce(`decrypt-error-${item.id}`, 'error', 'Failed to decrypt item - invalid passphrase');
          setMasterPassphrase(null);
        }
      }
    };

    attemptDecryption();
  }, [item, ovkCryptoKey, masterPassphrase, decryptedData, isCurrentlyDecrypting, hasAttemptedDecrypt, decryptItem, showToastOnce]);

  useEffect(() => {
    if (!isOpen) {
      setHasAttemptedDecrypt(false);
    }
  }, [isOpen]);

  if (!item) return null;

  const handleVerifyPassphrase = async (passphrase: string): Promise<boolean> => {
    setMasterPassphrase(passphrase);
    setHasAttemptedDecrypt(false);
    return true;
  };

  const handleViewSensitive = () => {
    if (!masterPassphrase) {
      setShowMasterPassphraseModal(true);
    }
  };

  const handleCopySensitive = (field: string) => {
    if (!decryptedData) {
      setShowMasterPassphraseModal(true);
      return;
    }

    const data = decryptedData as unknown as Record<string, string>;
    const value = data[field] || '';
    if (value) {
      navigator.clipboard.writeText(value);
      showToastOnce(`copy-${field}`, 'success', `${field} copied to clipboard`);
    }
  };

  const handleModalClose = () => {
    setShowPassword(false);
    setShowTotp(false);
    setMasterPassphrase(null);
    setHasAttemptedDecrypt(false);
    toastShownRef.current.clear();
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/items?id=${item.id}`, { method: "DELETE" });
      if (response.ok) {
        showToastOnce('delete-success', 'success', 'Item deleted successfully');
        onClose();
      } else {
        showToastOnce('delete-error', 'error', 'Failed to delete item');
      }
    } catch {
      showToastOnce('delete-network-error', 'error', 'Network error');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleEditClick = () => {
    if (!decryptedData) {
      setShowMasterPassphraseModal(true);
      showToastOnce('edit-locked', 'error', "Please unlock the item first to edit");
      return;
    }
    setShowEditDialog(true);
  };

  const handleEditSave = async (updatedData: Record<string, string>) => {
    if (!ovkCryptoKey || !decryptedData) {
      showToastOnce('edit-no-keys', 'error', "Missing encryption keys");
      return;
    }

    setIsEditing(true);
    setIsPending(true);
    try {
      const response = await fetch("/api/items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          item_name: updatedData.name || item.name,
          item_url: updatedData.url !== undefined ? (updatedData.url || null) : item.url || null,
          type: item.type,
          tags: Array.isArray(item.tags) ? JSON.stringify(item.tags) : null,
          item_key_wrapped: "temp-placeholder",
          item_key_version: Date.now().toString(),
          username_ct: "temp-encrypted-username",
          password_ct: "temp-encrypted-password", 
          note_ct: "temp-encrypted-note",
        }),
      });

      if (response.ok) {
        showToastOnce('edit-success', 'success', "Item updated successfully!");
        setShowEditDialog(false);
        onClose();
      } else {
        const errorData = await response.json();
        showToastOnce('edit-error', 'error', errorData.message || "Failed to update");
      }
    } catch {
      showToastOnce('edit-network-error', 'error', "Update failed");
    } finally {
      setIsEditing(false);
      setIsPending(false);
    }
  };

  const handleTogglePassword = () => {
    if (decryptedData) {
      setShowPassword(!showPassword);
    } else {
      handleViewSensitive();
    }
  };

  const handleToggleTotp = () => {
    if (decryptedData) {
      setShowTotp(!showTotp);
    } else {
      handleViewSensitive();
    }
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
        onTogglePassword={handleTogglePassword}
        onToggleTotp={handleToggleTotp}
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
        // @ts-expect-error onSave is a required prop
        onSave={handleEditSave}
        item={item}
        // @ts-expect-error decryptedData is ensured to be present before opening the edit dialog
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