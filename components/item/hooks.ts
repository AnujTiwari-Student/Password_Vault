"use client";

import { useCallback, useState } from "react";
import { UseFormSetValue } from "react-hook-form";
import { generateVaultItemTOTP, regenerateQRCode } from "@/actions/totp-vault-item";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ItemCreationType } from "@/schema/zod-schema";

// ✅ Proper typing for TOTP hook
export const useTOTP = (
  setValue: UseFormSetValue<ItemCreationType>
) => {
  const [totpSecret, setTotpSecret] = useState<string>("");
  const [totpOtpAuthUrl, setTotpOtpAuthUrl] = useState<string>("");
  const [totpQrUrl, setTotpQrUrl] = useState<string>("");
  const [isGeneratingTOTP, setIsGeneratingTOTP] = useState(false);
  const [isRegeneratingQR, setIsRegeneratingQR] = useState(false);
  const user = useCurrentUser();

  const generateNewTOTP = useCallback(async () => {
    if (!user?.email) {
      throw new Error("User email not found");
    }

    setIsGeneratingTOTP(true);
    try {
      const totpData = await generateVaultItemTOTP(user.email);
      setTotpSecret(totpData.secret);
      setTotpOtpAuthUrl(totpData.otpAuthUrl);
      setTotpQrUrl(totpData.qrCodeUrl);
      setValue("totp_seed_ct" as const, totpData.secret);
    } finally {
      setIsGeneratingTOTP(false);
    }
  }, [user?.email, setValue]);

  const handleRegenerateQR = useCallback(async () => {
    if (!totpSecret || !user?.email) {
      throw new Error("Secret or email not available");
    }

    setIsRegeneratingQR(true);
    try {
      const newQrUrl = await regenerateQRCode(totpSecret, user.email);
      setTotpQrUrl(newQrUrl);
    } finally {
      setIsRegeneratingQR(false);
    }
  }, [totpSecret, user?.email]);

  return {
    totpSecret,
    totpOtpAuthUrl,
    totpQrUrl,
    isGeneratingTOTP,
    isRegeneratingQR,
    generateNewTOTP,
    handleRegenerateQR,
  };
};

// ✅ Proper typing for Tags hook
export interface TagsHookReturn {
  tagInput: string;
  setTagInput: React.Dispatch<React.SetStateAction<string>>;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  addTag: () => void;
  removeTag: (tagToRemove: string) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const useTags = (
  setValue: UseFormSetValue<ItemCreationType>
): TagsHookReturn => {
  const [tagInput, setTagInput] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);

  const addTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setValue("tags" as const, newTags);
      setTagInput("");
    }
  }, [tagInput, tags, setValue]);

  const removeTag = useCallback((tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    setValue("tags" as const, newTags);
  }, [tags, setValue]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  }, [addTag]);

  return {
    tagInput,
    setTagInput,
    tags,
    setTags,
    addTag,
    removeTag,
    handleKeyPress,
  };
};
