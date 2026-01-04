"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Check,
  Lock,
  KeyRound,
  Copy,
  AlertCircle,
  Shield,
  EyeOff,
  Eye,
} from "lucide-react";
import {
  bufferToBase64,
  deriveUMKData,
  generateMnemonicPassphrase,
  generateRandomBytes,
  generateRSAKeyPair,
  wrapKey,
  encryptWithRSA,
} from "@/utils/client-crypto";
import { useClipboard } from "@/hooks/useClipboard";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import AccountTypeValidation from "@/components/ui/account-type-validation";
import { useUserMasterKey } from "@/hooks/useUserMasterKey";
import { useVaultOVK } from "@/hooks/useVaultOvk";
import { useSession } from "next-auth/react";

const MasterPassphraseSetup: React.FC = () => {
  const router = useRouter();
  const { data: session, update } = useSession();
  const user = session?.user;

  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [salt, setSalt] = useState<string | null>(null);
  const [verifier, setVerifier] = useState<string | null>(null);
  const [ovkWrapped, setOvkWrapped] = useState<string | null>(null);
  const [ovkRaw, setOvkRaw] = useState<string | null>(null);
  const [ovkWrappedForOrg, setOvkWrappedForOrg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [status, setStatus] = useState("");
  const [showKey, setShowKey] = useState(true);
  const [accountType, setAccountType] = useState("org");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [wrappedPrivateKey, setWrappedPrivateKey] = useState<string | null>(null);

  const { isCopied, copy } = useClipboard({ successDuration: 100000 });

  const { umkCryptoKey } = useUserMasterKey(mnemonic);
  const ovkResult = useVaultOVK(
    umkCryptoKey,
    user?.vault?.ovk_id || null,
    user?.account_type
  );

  const ovkCryptoKey = ovkResult?.ovkCryptoKey || null;

  const runSetup = useCallback(async () => {
    setStatus("Generating Master Key...");
    const generatedMnemonic = generateMnemonicPassphrase();
    setMnemonic(generatedMnemonic);
    try {
      setStatus("Deriving Encryption Keys...");
      const umkData = await deriveUMKData(generatedMnemonic);
      setSalt(umkData.umk_salt);
      setVerifier(umkData.master_passphrase_verifier);

      setStatus("Generating RSA key");
      const { publicKey, privateKey } = await generateRSAKeyPair();
      const wrappedPrivateKey = await wrapKey(privateKey, umkData.umkCryptoKey);

      const ovkRaw = generateRandomBytes(32);
      const ovkRawBase64 = bufferToBase64(ovkRaw);

      const wrappedOVKForPersonal = await wrapKey(ovkRawBase64, umkData.umkCryptoKey);
      const wrappedOVKForOrg = await encryptWithRSA(ovkRawBase64, publicKey);

      setOvkWrapped(wrappedOVKForPersonal);
      setOvkRaw(ovkRawBase64);
      setOvkWrappedForOrg(wrappedOVKForOrg);
      setPublicKey(publicKey);
      setWrappedPrivateKey(wrappedPrivateKey);

      setStatus("Ready. Please copy your Master Key.");
    } catch (error) {
      setStatus("Error during key derivation. Check console.");
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (!mnemonic) {
      runSetup();
    }
    return () => {};
  }, [mnemonic, runSetup]);

  useEffect(() => {
    if (user && user.masterPassphraseSetupComplete) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleCopy = () => {
    if (mnemonic) copy(mnemonic);
  };

  const handleConfirmAndStore = async () => {
    if (!mnemonic || !salt || !verifier || isProcessing) return;
    if (accountType === "org" && !orgName.trim()) return;

    let ovkToSend = ovkWrapped;
    let ovkForOrgToSend = ovkWrappedForOrg;
    let ovkRawToSend = ovkRaw;

    if (!ovkToSend) {
      if (ovkCryptoKey && umkCryptoKey) {
        try {
          const exportedRaw = await window.crypto.subtle.exportKey("raw", ovkCryptoKey);
          const rawBase64 = bufferToBase64(exportedRaw);
          ovkToSend = await wrapKey(rawBase64, umkCryptoKey);
          ovkRawToSend = rawBase64;
          if (publicKey) {
            ovkForOrgToSend = await encryptWithRSA(rawBase64, publicKey);
          }
        } catch (error) {
          setStatus("Error wrapping OVK for submission.");
          console.error(error);
          return;
        }
      } else {
        setStatus("Vault key is not ready yet.");
        return;
      }
    }

    const body =
      accountType === "org"
        ? {
            umk_salt: salt,
            master_passphrase_verifier: verifier,
            ovk_wrapped_for_user: ovkToSend,
            ovk_raw: ovkRawToSend,
            ovk_wrapped_for_org: ovkForOrgToSend,
            org_name: orgName || null,
            account_type: accountType,
            public_key: publicKey,
            wrapped_private_key: wrappedPrivateKey
          }
        : {
            umk_salt: salt,
            master_passphrase_verifier: verifier,
            ovk_wrapped_for_user: ovkToSend,
            account_type: accountType,
            public_key: publicKey,
            wrapped_private_key: wrappedPrivateKey
          };

    setIsProcessing(true);
    setStatus("Sending secrets metadata and creating organization...");

    try {
      const response = await fetch("/api/setup/passphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        const successMessage = `Success! Org created: ${data.orgId}. Redirecting in 5 seconds...`;
        setStatus(successMessage);
        toast.success("Organization created successfully!");
        setIsProcessing(false);
        await update();
        router.push("/dashboard");
      } else {
        const errorData = await response.json();
        setStatus(`API Error: ${errorData.error || response.statusText}`);
        setIsProcessing(false);
      }
    } catch (error) {
      setStatus("Network or client-side error during API call.");
      console.error("API call failed:", error);
      setIsProcessing(false);
    }
  };

  const isReady = Boolean(
    mnemonic && salt && verifier && (ovkWrapped || ovkCryptoKey)
  );
  const canProceed =
    isReady &&
    !isProcessing &&
    isCopied &&
    (accountType === "personal" || orgName.trim().length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-gray-900 shadow-2xl rounded-2xl p-6 sm:p-10 border border-gray-700 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Shield className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Zero-Knowledge Setup</h1>
              <p className="text-xs text-gray-400 mt-0.5">End-to-end encrypted security</p>
            </div>
          </div>
          <div className="mb-8 bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-gray-300 leading-relaxed">
                  Your account is secure, but you must first generate your{" "}
                  <strong className="text-white">Master Key</strong>. This
                  24-word phrase is the{" "}
                  <strong className="text-white">only</strong> way to decrypt
                  your organizations secrets.
                </p>
                <p className="text-red-400 font-semibold mt-3 flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Copy and store it safely. We never store this key.
                </p>
              </div>
            </div>
          </div>
          <div className="mb-8">
            <AccountTypeValidation
              setOrgName={setOrgName}
              setAccountType={setAccountType}
            />
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold text-blue-400 flex items-center">
                <KeyRound className="w-5 h-5 mr-2" />
                Your 24-Word Master Key
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
                  disabled={!isReady || isProcessing}
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center transition-all duration-200 ${
                    isCopied
                      ? "bg-green-600 text-white shadow-lg"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                  }`}
                  disabled={!isReady || isProcessing}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Key
                    </>
                  )}
                </button>
              </div>
            </div>
            <div
              className={`font-mono text-sm break-words p-4 bg-gray-950 border border-gray-700 rounded-lg transition-all duration-200 ${
                showKey
                  ? "text-gray-200 select-all"
                  : "text-transparent select-none blur-sm"
              }`}
            >
              {mnemonic || "Generating your secure master key..."}
            </div>
            {!showKey && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                Click the eye icon to reveal your key
              </p>
            )}
          </div>
          <button
            onClick={handleConfirmAndStore}
            disabled={!canProceed}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating Organization...
              </span>
            ) : (
              "I have copied the key. Confirm & Create Organization"
            )}
          </button>
          {!isCopied && isReady && (
            <p className="mt-4 text-sm text-center text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              You must copy your master key before proceeding
            </p>
          )}
          <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              🔒 Your master key is generated locally and never transmitted to
              our servers. Store it in a secure password manager or offline
              location.
            </p>
          </div>
          {status && (
            <div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-lg">
              <p className="text-xs text-gray-300 text-center">{status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterPassphraseSetup;
