"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Check,
  Lock,
  Copy,
  ShieldCheck,
  EyeOff,
  Eye,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Shield,
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center text-center space-y-2">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Secure Your Vault</h1>
        <p className="text-sm text-gray-500 max-w-md">
          End-to-end encryption setup. This Master Key is the only way to unlock your data.
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</div>
              Setup Details
            </div>
            <AccountTypeValidation
              setOrgName={setOrgName}
              setAccountType={setAccountType}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">2</div>
                Save Your Master Key
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                  disabled={!isReady || isProcessing}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    isCopied
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
                  }`}
                  disabled={!isReady || isProcessing}
                >
                  {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {isCopied ? "Copied" : "Copy Key"}
                </button>
              </div>
            </div>

            <div className="relative group">
              <div className={`
                grid grid-cols-3 sm:grid-cols-4 gap-2 transition-all duration-300
                ${showKey ? "opacity-100 blur-0" : "opacity-40 blur-md select-none"}
              `}>
                {mnemonic ? (
                  mnemonic.split(" ").map((word, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-2 rounded-lg">
                      <span className="text-[10px] font-mono text-gray-400 select-none w-4">{index + 1}</span>
                      <span className="text-sm font-medium text-gray-700 font-mono">{word}</span>
                    </div>
                  ))
                ) : (
                  Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
                  ))
                )}
              </div>

              {!showKey && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <button 
                    onClick={() => setShowKey(true)}
                    className="flex flex-col items-center gap-2 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-xl border border-gray-200 shadow-sm hover:scale-105 transition-transform"
                  >
                    <Lock className="w-6 h-6 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-600">Click to Reveal Key</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <span className="font-bold">Warning:</span> Store this safely. We cannot recover your account if you lose this key.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
            <h3 className="font-semibold text-gray-900 mb-4">Setup Progress</h3>
            
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className={`p-1 rounded-full transition-colors ${mnemonic ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {mnemonic ? <Check className="w-3 h-3" /> : <div className="w-3 h-3" />}
                </div>
                <span className={`text-sm ${mnemonic ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  Generate Keys
                </span>
              </div>
               
              <div className="flex items-center gap-3">
                <div className={`p-1 rounded-full transition-colors ${isCopied ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {isCopied ? <Check className="w-3 h-3" /> : <div className="w-3 h-3" />}
                </div>
                <span className={`text-sm ${isCopied ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  Copy to clipboard
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className={`p-1 rounded-full transition-colors ${ovkWrapped ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {ovkWrapped ? <Check className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                </div>
                <span className={`text-sm ${ovkWrapped ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  Encryption Ready
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={handleConfirmAndStore}
                disabled={!canProceed}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Finalizing...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Setup</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              
              {!isCopied && isReady && (
                <p className="mt-3 text-xs text-center text-red-500 font-medium">
                  Please copy your master key to proceed
                </p>
              )}
              
              {status && (
                <div className="mt-4 p-2 bg-gray-50 border border-gray-100 rounded text-center">
                  <p className="text-[10px] text-gray-400">{status}</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm">
          <Shield className="w-3 h-3 text-emerald-500 fill-emerald-500" />
          <span className="text-xs text-gray-600 font-mono">Zero-Knowledge Architecture Verified</span>
        </div>
      </div>
    </div>
  );
};

export default MasterPassphraseSetup;