"use client";

import React, { useState, useCallback, useTransition } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import {
  ItemCreationSchema,
  ItemCreationType,
} from "@/schema/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/auth/form-error";
import { FormSuccess } from "@/components/auth/form-success";
import { Textarea } from "@/components/ui/textarea";
import {
  generateRandomBytes,
  bufferToBase64,
  wrapKey,
} from "@/utils/client-crypto";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserMasterKey } from "@/hooks/useUserMasterKey";
import { useVaultOVK } from "@/hooks/useVaultOvk";
import { ItemTypeEnum } from "@/schema/zod-schema";
import { FormHeader } from "../item/FormHeader";
import { ItemTypeSelector } from "../item/ItemTypeSelector";
import { VaultKeyStatus } from "../item/VaultKeyStatus";
import { ItemFieldsSection } from "../item/ItemFieldsSection";
import { TagsInput } from "../item/TagsInput";
import { ItemCreationFormProps } from "../item/types";
import { useTags } from "../item/hooks";
import { useTOTP } from "../item/hooks";
import { Lock, Plus, RefreshCw } from "lucide-react";

interface TagsHookReturn {
  tagInput: string;
  setTagInput: React.Dispatch<React.SetStateAction<string>>;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  addTag: () => void;
  removeTag: (tagToRemove: string) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

function ItemCreationForm({ 
  vaultId: providedVaultId, 
  vaultType: providedVaultType = 'personal',
  orgId,
  onSuccess,
  onCancel
}: ItemCreationFormProps) {
  const user = useCurrentUser();
  const [mnemonic, setMnemonic] = useState<string>("");
  const [selectedTypes, setSelectedTypes] = useState<ItemTypeEnum[]>([]);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveVaultId = providedVaultId || user?.vault?.id || null;
  const effectiveVaultType = providedVaultType || 'personal';

  const { umkCryptoKey, privateKeyBase64 } = useUserMasterKey(mnemonic || null);
  const { ovkCryptoKey, error: ovkError } = useVaultOVK(
    umkCryptoKey,
    effectiveVaultId,
    effectiveVaultType,
    privateKeyBase64,
    orgId
  );

  const form = useForm<ItemCreationType>({
    resolver: zodResolver(ItemCreationSchema),
    defaultValues: {
      mnemonic: "",
      item_name: "",
      item_url: "",
      username_ct: "",
      password_ct: "",
      totp_seed_ct: "",
      vaultId: effectiveVaultId || "",
      item_key_wrapped: "",
      type: [],
      tags: [],
      notes_ct: "",
      created_by: user?.id || "",
    },
  });

  const totp = useTOTP(form.setValue);
  const tags: TagsHookReturn = useTags(form.setValue);

  const toggleItemType = useCallback(async (type: ItemTypeEnum) => {
    const isCurrentlySelected = selectedTypes.includes(type);
    const newTypes = isCurrentlySelected
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];

    setSelectedTypes(newTypes);
    form.setValue("type", newTypes);

    if (!isCurrentlySelected && type === "totp") {
      await totp.generateNewTOTP();
    }

    if (isCurrentlySelected && type === "totp") {
      form.setValue("totp_seed_ct", "");
      totp.generateNewTOTP();
    }
  }, [selectedTypes, form, totp]);

  const onSubmit = useCallback((data: ItemCreationType) => {
    setError(null);
    setSuccess(null);

    if (!ovkCryptoKey) {
      setError("Vault key not loaded yet. Please enter your master passphrase and wait for the vault key to load.");
      return;
    }

    if (!mnemonic.trim()) {
      setError("Master passphrase is required for encryption.");
      return;
    }

    if (!effectiveVaultId) {
      setError("Vault ID is missing.");
      return;
    }

    startTransition(async () => {
      try {
        const itemKeyRaw = new Uint8Array(generateRandomBytes(32));
        const itemKeyBase64 = bufferToBase64(itemKeyRaw);

        const itemKey = await crypto.subtle.importKey(
          "raw",
          itemKeyRaw,
          "AES-GCM",
          false,
          ["encrypt"]
        );

        const secretsToEncrypt: Array<{
          field: string;
          value: string | undefined;
        }> = [
          { field: "username_ct", value: data.username_ct },
          { field: "password_ct", value: data.password_ct },
          { field: "totp_seed_ct", value: data.totp_seed_ct },
          { field: "notes_ct", value: data.notes_ct },
        ];
        const encryptedFields: Record<string, string> = {};

        for (const secret of secretsToEncrypt) {
          if (secret.value) {
            const rawValue = secret.value;
            const iv = new Uint8Array(generateRandomBytes(12));
            const buffer = new TextEncoder().encode(rawValue);
            const ciphertextBuffer = await crypto.subtle.encrypt(
              { name: "AES-GCM", iv: iv },
              itemKey,
              buffer
            );
            const ivAndCiphertext = new Uint8Array(
              iv.length + ciphertextBuffer.byteLength
            );
            ivAndCiphertext.set(iv, 0);
            ivAndCiphertext.set(new Uint8Array(ciphertextBuffer), iv.length);
            encryptedFields[secret.field] = bufferToBase64(ivAndCiphertext);
          }
        }

        const itemKeyWrapped = await wrapKey(itemKeyBase64, ovkCryptoKey);

        const payload = {
          item_name: data.item_name,
          item_url: data.item_url,
          vaultId: effectiveVaultId,
          type: selectedTypes,
          tags: tags.tags,
          item_key_wrapped: itemKeyWrapped,
          created_by: data.created_by,
          ...encryptedFields,
        };

        const response = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create item on server.");
        }

        setSuccess("Item created and encrypted successfully!");
        onSuccess?.();
        form.reset();
        setMnemonic("");
        setSelectedTypes([]);
        tags.setTagInput("");
        tags.setTags([]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred during item creation.";
        setError(errorMessage);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ovkCryptoKey, form, selectedTypes, tags.tags, mnemonic, effectiveVaultId, onSuccess, tags.setTagInput, tags.setTags]);

  return (
    <div className="flex flex-col h-full max-h-[65vh]">
      <FormHeader effectiveVaultType={effectiveVaultType} />

      <div className="flex-1 overflow-y-auto pr-2 minimal-scrollbar">
        <div className="space-y-4 sm:space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="mnemonic"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-white">Master Passphrase</FormLabel>
                    <FormControl>
                      <Textarea
                        value={mnemonic}
                        onChange={(e) => {
                          const value = e.target.value;
                          setMnemonic(value);
                          form.setValue("mnemonic", value);
                        }}
                        placeholder="Your 24 word master passphrase"
                        rows={3}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 font-mono text-sm resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <VaultKeyStatus
                mnemonic={mnemonic}
                ovkError={ovkError}
                ovkCryptoKey={ovkCryptoKey}
              />

              <FormField
                control={form.control}
                name="item_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Item Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="e.g., GitHub Account, Bank 2FA + Recovery, Server Access Notes"
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ItemTypeSelector
                selectedTypes={selectedTypes}
                onToggleType={toggleItemType}
              />

              {selectedTypes.length > 0 && (
                <>
                  <ItemFieldsSection
                    selectedTypes={selectedTypes}
                    totpProps={{
                      totpSecret: totp.totpSecret,
                      totpOtpAuthUrl: totp.totpOtpAuthUrl,
                      totpQrUrl: totp.totpQrUrl,
                      isGeneratingTOTP: totp.isGeneratingTOTP,
                      isRegeneratingQR: totp.isRegeneratingQR,
                      onGenerateNew: totp.generateNewTOTP,
                      onRegenerateQR: totp.handleRegenerateQR,
                    }}
                  />

                  <TagsInput
                    tagInput={tags.tagInput}
                    tags={tags.tags}
                    onTagInputChange={tags.setTagInput}
                    onKeyPress={tags.handleKeyPress}
                    onAddTag={tags.addTag}
                    onRemoveTag={tags.removeTag}
                  />
                </>
              )}

              <div className="w-full">
                <FormError message={error} />
                <FormSuccess message={success} />
              </div>
            </form>
          </Form>
        </div>
      </div>

      <div className="flex-shrink-0 pt-4 border-t border-gray-700/50 mt-4 flex gap-2">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="flex-1 bg-gray-800 border-gray-700 hover:bg-gray-700 text-white h-10 sm:h-11 text-sm sm:text-base"
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          onClick={form.handleSubmit(onSubmit)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed h-10 sm:h-11 text-sm sm:text-base"
          disabled={isPending || !ovkCryptoKey || selectedTypes.length === 0 || !mnemonic.trim()}
        >
          {isPending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : !mnemonic.trim() ? (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Enter Passphrase
            </>
          ) : !ovkCryptoKey ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Loading Key...
            </>
          ) : selectedTypes.length === 0 ? (
            "Select Item Type"
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default ItemCreationForm;
