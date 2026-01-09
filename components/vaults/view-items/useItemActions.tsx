import { useState } from "react";
import { toast } from "sonner";
import { APIVaultItem, DecryptedItemData } from "@/types/vault";
import { generateRandomBytes, bufferToBase64, wrapKey } from "@/utils/client-crypto";

interface UpdatePayload {
  itemId: string;
  item_name: string;
  item_url: string | null;
  type: string[];
  tags: string | null;
  username_ct?: string;
  password_ct?: string;
  totp_seed_ct?: string;
  notes_ct?: string;
  item_key_wrapped: string;
  item_key_version: number;
}

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

  const handleDelete = async () => {
    if (!item) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/items?id=${item.id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete item");
        return;
      }
      toast.success("Item deleted successfully");
      onClose();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  };

  const encryptField = async (data: string, key: CryptoKey): Promise<string> => {
    const encoder = new TextEncoder();
    const iv = generateRandomBytes(12);
    const encryptedData = await crypto.subtle.encrypt(
      // @ts-expect-error -- FIX: iv.buffer converts Uint8Array to ArrayBuffer
      { name: "AES-GCM", iv: iv.buffer },
      key,
      encoder.encode(data)
    );
    
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);
    return bufferToBase64(combined.buffer);
  };

  const handleEdit = async (updatedData: Partial<DecryptedItemData> & { 
    name?: string; 
    url?: string | null;
    username?: string;
    password?: string;
    note?: string;
    totp_seed?: string;
  }) => {
    if (!item || !umkKey || !ovkKey) {
      toast.error("Missing encryption keys. Please refresh.");
      return;
    }

    setIsEditing(true);
    try {
      const itemKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );

      const encryptedFields: Record<string, string> = {};
      
      if (updatedData.username !== undefined) {
        encryptedFields.username_ct = await encryptField(updatedData.username, itemKey);
      }
      if (updatedData.password !== undefined) {
        encryptedFields.password_ct = await encryptField(updatedData.password, itemKey);
      }
      if (updatedData.totp_seed !== undefined) {
        encryptedFields.totp_seed_ct = await encryptField(updatedData.totp_seed, itemKey);
      }
      if (updatedData.note !== undefined) {
        encryptedFields.notes_ct = await encryptField(updatedData.note, itemKey);
      }

      const itemKeyRaw = await crypto.subtle.exportKey("raw", itemKey);
      const item_key_wrapped = await wrapKey(bufferToBase64(itemKeyRaw), ovkKey);

      const updatePayload: UpdatePayload = {
        itemId: item.id,
        item_name: updatedData.name || item.name,
        item_url: updatedData.url !== undefined ? (updatedData.url || null) : item.url || null,
        type: item.type,
        tags: Array.isArray(item.tags) ? JSON.stringify(item.tags) : item.tags || null,
        item_key_wrapped,
        item_key_version: Date.now(),
        ...encryptedFields,
      };

      const response = await fetch("/api/items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update item");
        return;
      }

      toast.success("Item updated successfully");
      onClose();
    } catch (error) {
      console.error("Edit failed:", error);
      toast.error("Encryption failed. Please try again.");
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
