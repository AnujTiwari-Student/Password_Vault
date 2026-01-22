"use client";

import React from "react";
import { Key, Shield, Info, Loader2, BrickWallShield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { useState as useStateHook, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { toggle2FA } from "@/actions/toggle-2fa";
import { ChangeMasterPassphraseModal } from "./ChangeMasterPassphraseModal";
import { sendChangePassphraseOtp } from "@/actions/change-master-passphrase";

export const SecurityCenter: React.FC = () => {
  const { data: session, update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [is2FAEnabled, setIs2FAEnabled] = useStateHook(false);
  const [showChangePassphrase, setShowChangePassphrase] = useStateHook(false);
  const [isLoadingPassphrase, setIsLoadingPassphrase] = useStateHook(false);

  useEffect(() => {
    if (session?.user?.twofa_enabled !== undefined) {
      setIs2FAEnabled(session.user.twofa_enabled);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.twofa_enabled]);

  const handleToggle2FA = async (checked: boolean) => {
    startTransition(async () => {
      try {
        const result = await toggle2FA(checked);
        if (result.success) {
          setIs2FAEnabled(checked);
          await update();
          toast.success(result.message);
        } else {
          setIs2FAEnabled(!checked);
          toast.error(result.error || "Failed to update 2FA settings");
        }
      } catch {
        setIs2FAEnabled(!checked);
        toast.error("An unexpected error occurred");
      }
    });
  };

  const handleChangePassphraseClick = async () => {
    setIsLoadingPassphrase(true);
    try {
      const result = await sendChangePassphraseOtp();
      if (result.success) {
        setShowChangePassphrase(true);
      } else {
        toast.error(result.error || "Failed to initiate passphrase change");
      }
    } catch {
      toast.error("Failed to send verification code");
    } finally {
      setIsLoadingPassphrase(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="gap-4 flex items-center">
          <div className="p-3 bg-blue-100 rounded-lg">
            <BrickWallShield size={22} className="text-blue-600" />
          </div>
          <div className="">
            <h2 className="text-3xl lg:text-2xl font-bold text-gray-900">
              Security Center
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage your account security and authentication settings
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Key className="text-blue-600" size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Master Passphrase
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Your primary security credential
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-5">
              <div className="flex items-start gap-2.5 mb-3">
                <Info
                  size={16}
                  className="text-gray-400 mt-0.5 shrink-0"
                />
                <div>
                  <p className="text-gray-700 text-sm">
                    Last changed{" "}
                    <span className="font-bold text-gray-900">45 days ago</span>
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    We recommend changing your passphrase every 90 days
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleChangePassphraseClick}
              disabled={isLoadingPassphrase}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-sm font-semibold text-sm"
            >
              {isLoadingPassphrase ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                "Change Master Passphrase"
              )}
            </button>
            <ChangeMasterPassphraseModal
              isOpen={showChangePassphrase}
              onClose={() => setShowChangePassphrase(false)}
              onSuccess={() => update()}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-lg transition-colors ${
                  "bg-emerald-500/15"
                }`}
              >
                <Shield
                  className={`${
                    "text-emerald-500 "
                  }`}
                  size={22}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Two-Factor Authentication
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Add an extra layer of security
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-600 text-sm font-medium">
                  Status:
                </span>
                <span
                  className={`font-bold text-sm ${
                    is2FAEnabled ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {is2FAEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>

              {is2FAEnabled ? (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <p className="text-green-800 text-sm font-semibold">
                    ✓ Protected via Email code
                  </p>
                  <p className="text-green-700 text-xs mt-1">
                    You will receive a verification code on each login
                  </p>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                  <p className="text-orange-800 text-sm font-semibold">
                    ⚠ Account is not fully protected
                  </p>
                  <p className="text-orange-700 text-xs mt-1">
                    Enable 2FA to secure your account
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
              <Label
                htmlFor="2fa-toggle"
                className="text-sm font-semibold text-gray-900 cursor-pointer"
              >
                Enable 2FA
              </Label>
              <Switch
                id="2fa-toggle"
                checked={is2FAEnabled}
                onCheckedChange={handleToggle2FA}
                disabled={isPending}
                className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-400"
              />
            </div>

            {isPending && (
              <div className="mt-3 flex items-center gap-2 text-blue-600 text-sm font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating 2FA settings...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all overflow-hidden p-6">
        <h4 className="text-gray-900 font-bold text-base mb-4 flex items-center gap-2">
          <Shield size={18} className="text-emerald-500 " />
          Security Best Practices
        </h4>
        <ul className="space-y-3 text-gray-700 text-sm">
          <li className="flex items-start gap-3">
            <span className="text-black mt-0.5 font-bold">•</span>
            <span>
              Use a unique, strong master passphrase that you do not use
              anywhere else
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-black mt-0.5 font-bold">•</span>
            <span>
              Enable two-factor authentication for enhanced account security
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-black mt-0.5 font-bold">•</span>
            <span>
              Never share your master passphrase or 2FA codes with anyone
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-black mt-0.5 font-bold">•</span>
            <span>
              Regularly review your security logs for suspicious activity
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
