"use client";

import {
  ExternalLink,
  User,
  FileText,
  Shield,
  KeyRound,
  Globe
} from "lucide-react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormLabel } from "../ui/form";
import { Input } from "@/components/ui/input";
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
    <div className="space-y-6 p-5 sm:p-6 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
        <div className="flex -space-x-2">
          {selectedTypes.map((type) => {
            const Icon = type === "login" ? ExternalLink : 
                        type === "totp" ? Shield : FileText;
            const bgClass = type === "login" ? "bg-blue-600" : 
                           type === "totp" ? "bg-emerald-600" : "bg-purple-600";
            return (
              <div
                key={type}
                className={`w-8 h-8 rounded-full ring-2 ring-white flex items-center justify-center shadow-sm ${bgClass}`}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
            );
          })}
        </div>
        <div>
          <h3 className="text-gray-900 font-bold text-base">
            {hasMultipleTypes ? "Combined Item Details" : "Item Information"}
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            Fill in the required credentials below
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {needsURL && (
          <FormField
            control={control}
            name="item_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-semibold text-sm flex items-center gap-2 mb-1.5">
                  <Globe className="w-4 h-4 text-gray-400" />
                  Website URL
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="https://example.com"
                    className="h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all shadow-sm"
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
                <FormLabel className="text-gray-700 font-semibold text-sm flex items-center gap-2 mb-1.5">
                  <User className="w-4 h-4 text-gray-400" />
                  Username / Email
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="username, email@example.com, or ID"
                    className="h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all shadow-sm"
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
                <FormLabel className="text-gray-700 font-semibold text-sm flex items-center gap-2 mb-1.5">
                  <KeyRound className="w-4 h-4 text-gray-400" />
                  Password
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Enter secure password"
                    className="h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all shadow-sm"
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
              <FormItem className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <FormLabel className="text-emerald-900 font-bold text-sm flex items-center gap-2 mb-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" />
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
                    className="h-11 bg-white border-emerald-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-mono text-sm rounded-xl shadow-sm"
                  />
                </FormControl>
                <p className="text-emerald-700 text-xs mt-1.5 font-medium">
                  Use the generated key below or paste one from your service provider.
                </p>
                <div className="mt-4 pt-4 border-t border-emerald-100">
                  <TOTPGenerator {...totpProps} />
                </div>
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
                <FormLabel className="text-gray-700 font-semibold text-sm flex items-center gap-2 mb-1.5">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Secure Note
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Recovery codes, backup information, additional context..."
                    rows={4}
                    className="min-h-30 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-xl resize-y shadow-sm p-3"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
};