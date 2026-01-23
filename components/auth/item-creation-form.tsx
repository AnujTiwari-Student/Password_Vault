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
// Replaced FormError with Shadcn Alert below
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Lock, Plus, RefreshCw, KeyRound, Type, AlertCircle } from "lucide-react";

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
        const itemKey = await crypto.subtle.generateKey(
          { name: "AES-GCM", length: 256 },
          true,
          ["encrypt", "decrypt"]
        );

        const encryptField = async (value: string): Promise<string> => {
          const iv = generateRandomBytes(12);
          const buffer = new TextEncoder().encode(value);
          const ciphertextBuffer = await crypto.subtle.encrypt(
            // @ts-expect-error -- FIX: iv.buffer converts Uint8Array to ArrayBuffer
            { name: "AES-GCM", iv: iv },
            itemKey,
            buffer
          );
          const ivAndCiphertext = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
          ivAndCiphertext.set(iv, 0);
          ivAndCiphertext.set(new Uint8Array(ciphertextBuffer), iv.length);
          return bufferToBase64(ivAndCiphertext);
        };

        const encryptedFields: Record<string, string> = {};

        if (data.username_ct) {
          encryptedFields.username_ct = await encryptField(data.username_ct);
        }
        if (data.password_ct) {
          encryptedFields.password_ct = await encryptField(data.password_ct);
        }
        if (data.totp_seed_ct) {
          encryptedFields.totp_seed_ct = await encryptField(data.totp_seed_ct);
        }
        if (data.notes_ct) {
          encryptedFields.notes_ct = await encryptField(data.notes_ct);
        }

        const itemKeyRaw = await crypto.subtle.exportKey("raw", itemKey);
        const itemKeyBase64 = bufferToBase64(itemKeyRaw);
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

        const responseData = await response.json();

        if (!response.ok) {
          // Captures "Plan limit exceeded..." or other specific API errors
          throw new Error(responseData.message || "Failed to create item.");
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
    //  eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ovkCryptoKey, form, selectedTypes, tags.tags, mnemonic, effectiveVaultId, onSuccess, tags.setTagInput, tags.setTags]);

  return (
    <div className="flex flex-col h-full max-h-[65vh]">
      <FormHeader effectiveVaultType={effectiveVaultType} />

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-6 pb-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Master Passphrase Section */}
              <FormField
                control={form.control}
                name="mnemonic"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-gray-400" />
                      Master Passphrase
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        value={mnemonic}
                        onChange={(e) => {
                          const value = e.target.value;
                          setMnemonic(value);
                          form.setValue("mnemonic", value);
                        }}
                        placeholder="Enter your 24-word master passphrase to unlock encryption..."
                        rows={3}
                        className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-mono text-sm resize-none rounded-xl shadow-sm transition-all"
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

              {/* Item Name Section */}
              <FormField
                control={form.control}
                name="item_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                      <Type className="w-4 h-4 text-gray-400" />
                      Item Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="e.g., Personal GitHub, Chase Bank, AWS Root"
                        className="h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all shadow-sm"
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
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
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
                </div>
              )}

              <div className="w-full space-y-2">
                {error && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 shadow-sm animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <div className="ml-2">
                      <AlertTitle className="text-red-800 font-semibold tracking-tight text-sm">
                        Creation Failed
                      </AlertTitle>
                      <AlertDescription className="text-red-700 mt-1 text-xs leading-relaxed font-medium">
                        {error}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
                <FormSuccess message={success} />
              </div>
            </form>
          </Form>
        </div>
      </div>

      <div className="shrink-0 pt-5 border-t border-gray-100 mt-4 flex gap-3 bg-white z-10">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="flex-1 bg-white border-gray-200 hover:bg-gray-50 text-gray-700 font-medium h-11 text-sm rounded-xl shadow-sm transition-all"
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          onClick={form.handleSubmit(onSubmit)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 text-sm rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          disabled={isPending || !ovkCryptoKey || selectedTypes.length === 0 || !mnemonic.trim()}
        >
          {isPending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : !mnemonic.trim() ? (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Unlock to Create
            </>
          ) : !ovkCryptoKey ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Syncing Keys...
            </>
          ) : selectedTypes.length === 0 ? (
            "Select Type to Continue"
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create Secure Item
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default ItemCreationForm;