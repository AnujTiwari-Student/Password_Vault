import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { APIVaultItem, DecryptedItemData } from "@/types/vault";

export const useItemActions = (
  item: APIVaultItem | null,
  onClose: () => void,
  vaultId: string,
  vaultType: "personal" | "org",
  orgId?: string | null,
  umkKey?: CryptoKey,
  ovkKey?: CryptoKey
) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const toastShownRef = useRef<Set<string>>(new Set());

  console.log('useItemActions - item:', item, 'vaultId:', vaultId, 'vaultType:', vaultType, 'orgId:', orgId, 'umkKey:', umkKey, 'ovkKey:', ovkKey);

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

  const handleDelete = async () => {
    if (!item) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/items?id=${item.id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        showToastOnce('delete-error', 'error', errorData.message || "Failed to delete item");
        return;
      }
      showToastOnce('delete-success', 'success', "Item deleted successfully");
      onClose();
    } catch {
      showToastOnce('delete-network-error', 'error', "Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async (updatedData: Partial<DecryptedItemData> & { 
    name?: string; 
    url?: string | null;
  }) => {
    if (!item) {
      showToastOnce('edit-no-item', 'error', "Item not found");
      return;
    }

    setIsEditing(true);
    try {
      const updatePayload = {
        itemId: item.id,
        item_name: updatedData.name !== undefined ? updatedData.name : item.name,
        item_url: updatedData.url !== undefined ? (updatedData.url || null) : item.url || null,
        type: item.type,
        tags: Array.isArray(item.tags) ? JSON.stringify(item.tags) : (item.tags || null),
      };

      const response = await fetch("/api/items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToastOnce('edit-error', 'error', errorData.message || "Failed to update item");
        return;
      }

      showToastOnce('edit-success', 'success', "Item updated successfully");
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Update failed";
      showToastOnce('edit-encrypt-error', 'error', errorMessage);
    } finally {
      setIsEditing(false);
    }
  };

  return {
    handleDelete,
    handleEdit,
    isDeleting,
    isEditing,
  };
};