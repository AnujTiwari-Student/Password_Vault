import { useState } from "react";
import { toast } from "sonner";
import { APIVaultItem, DecryptedItemData } from "@/types/vault";

export const useItemActions = (
  item: APIVaultItem | null,
  onClose: () => void,
  vaultId: string,
  vaultType: "personal" | "org",
  orgId?: string | null
) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  console.log("useItemActions called with:", {
    item,
    vaultId,
    vaultType,
    orgId,
  });

  const handleDelete = async () => {
    if (!item) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/items?id=${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete item");
        return;
      }

      toast.success("Item deleted successfully");
      onClose();
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast.error("Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  };

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
}

  const handleEdit = async (updatedData: Partial<DecryptedItemData>) => {
    if (!item) return;

    setIsEditing(true);
    try {
      const updatePayload: UpdatePayload = {
    itemId: item.id,
    item_name: item.name,
    item_url: item.url || null,
    type: item.type,
    tags: item.tags ? JSON.stringify(item.tags) : null, // This is the problem!
  };

      if (updatedData.username !== undefined && item.username_ct) {
        updatePayload.username_ct = updatedData.username;
      }
      if (updatedData.password !== undefined && item.password_ct) {
        updatePayload.password_ct = updatedData.password;
      }
      if (updatedData.totp_seed !== undefined && item.totp_seed_ct) {
        updatePayload.totp_seed_ct = updatedData.totp_seed;
      }
      if (updatedData.note !== undefined && item.note_ct) {
        updatePayload.notes_ct = updatedData.note; 
      }

      const response = await fetch("/api/items", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update item");
        return;
      }

      toast.success("Item updated successfully");
    } catch (error) {
      console.error("Failed to update item:", error);
      toast.error("Failed to update item");
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
