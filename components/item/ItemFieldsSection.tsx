"use client";

import {
  ExternalLink,
  User,
  Lock,
  FileText,
  Shield,
} from "lucide-react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormLabel } from "../ui/form";
import { Input } from "@/components//ui/input";
import { TOTPGenerator } from './TOTPGenerator';
import { ItemTypeEnum } from "@/schema/zod-schema";
import { Textarea } from "../ui/textarea";

interface ItemFieldsSectionProps {
  selectedTypes: ItemTypeEnum[];
  totpProps: {
    totpSecret: string;
    totpOtpAuthUrl: string;
    totpQrUrl: string;
    isGeneratingTOTP: boolean;
    isRegeneratingQR: boolean;
    onGenerateNew: () => void;
    onRegenerateQR: () => void;
  };
}

export const ItemFieldsSection: React.FC<ItemFieldsSectionProps> = ({
  selectedTypes,
  totpProps,
}) => {
  const { control } = useFormContext();
  const hasMultipleTypes = selectedTypes.length > 1;
  const needsURL = selectedTypes.includes("login") || selectedTypes.includes("totp");
  const needsUsername = selectedTypes.length > 0;
  const needsPassword = selectedTypes.includes("login");
  const needsTOTP = selectedTypes.includes("totp");
  const needsNote = selectedTypes.includes("note");

  return (
    <div className="space-y-4 p-3 sm:p-4 bg-gray-800/30 rounded-lg border border-gray-600/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex -space-x-1">
          {selectedTypes.map((type) => {
            const Icon = type === "login" ? ExternalLink : 
                        type === "totp" ? Shield : FileText;
            return (
              <div
                key={type}
                className={`w-6 h-6 rounded-full border-2 border-gray-900 flex items-center justify-center text-xs ${
                  type === "login"
                    ? "bg-blue-600"
                    : type === "totp"
                    ? "bg-green-600"
                    : "bg-purple-600"
                }`}
              >
                <Icon className="w-3 h-3 text-white" />
              </div>
            );
          })}
        </div>
        <h3 className="text-white font-semibold text-sm sm:text-base">
          {hasMultipleTypes ? "Combined Item Information" : `Information`}
        </h3>
      </div>

      {needsURL && (
        <FormField
          control={control}
          name="item_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Website URL
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="https://example.com"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 text-sm"
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      {needsUsername && (
        <FormField
          control={control}
          name="username_ct"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                Username/Email/Account
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="username, email@example.com, or account identifier"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 text-sm"
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      {needsPassword && (
        <FormField
          control={control}
          name="password_ct"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="Enter password"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 text-sm"
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      {needsTOTP && (
        <FormField
          control={control}
          name="totp_seed_ct"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                2FA Secret Key
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || totpProps.totpSecret}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value);
                  }}
                  type="text"
                  placeholder="Enter TOTP secret key"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500 font-mono text-sm"
                />
              </FormControl>
              <p className="text-gray-400 text-xs mt-1">
                Auto-generated or enter your own secret key
              </p>
              <TOTPGenerator {...totpProps} />
            </FormItem>
          )}
        />
      )}

      {needsNote && (
        <FormField
          control={control}
          name="notes_ct"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Secure Note
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Recovery codes, backup information, additional context..."
                  rows={4}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 resize-none text-sm"
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
    </div>
  );
};
