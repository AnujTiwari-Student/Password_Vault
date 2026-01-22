"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { APIVaultItem, MemberRole } from "@/types/vault";
import { useUserMasterKey } from "@/hooks/useUserMasterKey";
import { useVaultOVK } from "@/hooks/useVaultOvk";
import { useDecryption } from "@/hooks/useDecryption";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { 
  DeleteConfirmDialog, 
  EditItemDialog 
} from "../vaults/view-items"; 
import { EnhancedItemDrawer } from "../drawer/EnhancedItemDrawer";
import { MasterPassphraseModal } from "./PassphraseModal";

interface ViewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: APIVaultItem | null;
  canEdit: boolean;
  vaultType: "personal" | "org";
  orgId?: string | null;
  userRole?: MemberRole; // Added userRole prop
  onDelete?: () => void; // Parent callback to refresh list after delete
}

export const ViewItemModal: React.FC<ViewItemModalProps> = ({
  isOpen,
  onClose,
  item,
  canEdit,
  vaultType,
  orgId,
  userRole,
  onDelete
}) => {
  const user = useCurrentUser();
  
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

  const activeDecryptedData = masterPassphrase ? decryptedData : null;

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
      console.log(isPending)
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
    // eslint-disable-next-line
  }, [item, ovkCryptoKey, masterPassphrase, decryptedData, isCurrentlyDecrypting, hasAttemptedDecrypt, decryptItem, showToastOnce]);

  useEffect(() => {
    if (!isOpen) {
      setHasAttemptedDecrypt(false);
      setMasterPassphrase(null);
    }
  }, [isOpen]);

  if (!item) return null;

  const handleVerifyPassphrase = async (passphrase: string): Promise<boolean> => {
    setMasterPassphrase(passphrase);
    setHasAttemptedDecrypt(false);
    return true; 
  };

  const handleModalClose = () => {
    setMasterPassphrase(null);
    setHasAttemptedDecrypt(false);
    toastShownRef.current.clear();
    onClose();
  };

  // UNCOMMENTED THIS!
  const handleDeleteClick = () => setShowDeleteDialog(true);
  
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/items?id=${item.id}`, { method: "DELETE" });
      if (response.ok) {
        showToastOnce('delete-success', 'success', 'Item deleted successfully');
        onDelete?.(); // Call parent refresh
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

  const handleUnlockClick = () => {
    setShowMasterPassphraseModal(true);
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
        onDelete?.(); // Refresh list to show updates (reusing onDelete prop for refresh)
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

  return (
    <>
      <EnhancedItemDrawer
        isOpen={isOpen}
        onClose={handleModalClose}
        item={item}
        decryptedData={activeDecryptedData}
        userRole={userRole || (vaultType === 'org' ? 'member' : 'owner')} 
        canDecrypt={!!ovkCryptoKey} 
        canEdit={!!canEdit}
        onEdit={handleEditClick}
        onUnlock={handleUnlockClick}
        onDelete={handleDeleteClick} 
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
        // @ts-expect-error legacy prop type mismatch
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