"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Check,
  KeyRound,
  Copy,
  AlertCircle,
  Shield,
  EyeOff,
  Eye,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useClipboard } from "@/hooks/useClipboard";
import {
  deriveUMKData,
  generateMnemonicPassphrase,
  unwrapKey,
  wrapKey,
  bufferToBase64,
} from "@/utils/client-crypto";
import { useSession } from "next-auth/react";
import { 
  sendChangePassphraseOtp, 
  verifyChangePassphraseOtp,
  changeMasterPassphrase 
} from "@/actions/change-master-passphrase";

interface ChangeMasterPassphraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalStep = "alert" | "otp" | "verify_old" | "newkey" | "processing";

export const ChangeMasterPassphraseModal: React.FC<ChangeMasterPassphraseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { update } = useSession();
  const [step, setStep] = useState<ModalStep>("alert");
  const [otp, setOtp] = useState("");
  const [oldMnemonic, setOldMnemonic] = useState("");
  const [otpError, setOtpError] = useState("");
  const [oldMnemonicError, setOldMnemonicError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isVerifyingOldMnemonic, setIsVerifyingOldMnemonic] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [salt, setSalt] = useState<string | null>(null);
  const [verifier, setVerifier] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [showKey, setShowKey] = useState(true);
  const [oldWrappedPrivateKey, setOldWrappedPrivateKey] = useState<string | null>(null);
  const [oldUmkSalt, setOldUmkSalt] = useState<string | null>(null);
  const { isCopied, copy } = useClipboard({ successDuration: 100000 });
  
  const toastShownRef = useRef<Set<string>>(new Set());

  const showToastOnce = useCallback((key: string, type: 'success' | 'error', message: string) => {
    if (!toastShownRef.current.has(key)) {
      toastShownRef.current.add(key);
      if (type === 'success') {
        toast.success(message);
      } else {
        toast.error(message);
      }
      setTimeout(() => {
        toastShownRef.current.delete(key);
      }, 3000);
    }
  }, []);

  const runGenerateNewKey = useCallback(async () => {
    setStatus("Generating new Master Key...");
    const generatedMnemonic = generateMnemonicPassphrase();
    setMnemonic(generatedMnemonic);
    try {
      setStatus("Deriving new encryption keys...");
      const umkData = await deriveUMKData(generatedMnemonic);
      setSalt(umkData.umk_salt);
      setVerifier(umkData.master_passphrase_verifier);
      setStatus("New Master Key ready. Please copy it securely.");
    } catch {
      setStatus("Error generating new key");
      showToastOnce('gen-key-error', 'error', "Failed to generate new master key");
    }
  }, [showToastOnce]);

  const handleSendOtp = useCallback(async () => {
    setIsVerifyingOtp(true);
    setOtpError("");
    
    try {
      const result = await sendChangePassphraseOtp();
      
      if (result.success) {
        setStep("otp");
        showToastOnce('otp-sent', 'success', "OTP sent to your email");
      } else {
        setOtpError(result.error || "Failed to send OTP");
        showToastOnce('otp-send-error', 'error', result.error || "Failed to send OTP");
      }
    } catch {
      setOtpError("Network error. Please try again.");
      showToastOnce('otp-network-error', 'error', "Network error. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }, [showToastOnce]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otp.trim()) return;
    setIsVerifyingOtp(true);
    setOtpError("");
    
    try {
      const data = await verifyChangePassphraseOtp(otp.trim());
      
      if (data.success) {
        setOldWrappedPrivateKey(data.oldWrappedPrivateKey || null);
        setOldUmkSalt(data.oldUmkSalt || null);
        setStep("verify_old");
        showToastOnce('otp-verified', 'success', "OTP verified successfully");
      } else {
        setOtpError(data.error || "Invalid OTP");
      }
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }, [otp, showToastOnce]);

  const handleVerifyOldMnemonic = useCallback(async () => {
    if (!oldMnemonic.trim()) return;
    if (!oldUmkSalt || !oldWrappedPrivateKey) {
      setOldMnemonicError("Missing old encryption data");
      return;
    }

    setIsVerifyingOldMnemonic(true);
    setOldMnemonicError("");

    try {
      const oldUmkData = await deriveUMKData(oldMnemonic.trim(), oldUmkSalt);
      
      await unwrapKey(oldWrappedPrivateKey, oldUmkData.umkCryptoKey);
      
      await runGenerateNewKey();
      setStep("newkey");
      showToastOnce('old-verified', 'success', "Old passphrase verified successfully");
    } catch {
      setOldMnemonicError("Invalid master passphrase");
      showToastOnce('old-invalid', 'error', "Invalid master passphrase");
    } finally {
      setIsVerifyingOldMnemonic(false);
    }
  }, [oldMnemonic, oldUmkSalt, oldWrappedPrivateKey, runGenerateNewKey, showToastOnce]);

  const handleCopyKey = useCallback(() => {
    if (mnemonic) {
      copy(mnemonic);
      showToastOnce('key-copied', 'success', "Master Key copied!");
    }
  }, [mnemonic, copy, showToastOnce]);

  const handleConfirmNewKey = useCallback(async () => {
    if (!mnemonic || !salt || !verifier || isProcessing || !isCopied) return;
    if (!oldMnemonic || !oldUmkSalt || !oldWrappedPrivateKey) {
      showToastOnce('missing-data', 'error', "Missing old passphrase data");
      return;
    }

    setIsProcessing(true);
    setStatus("Re-encrypting your private key...");
    setStep("processing");

    try {
      const oldUmkData = await deriveUMKData(oldMnemonic.trim(), oldUmkSalt);
      const privateKeyCrypto = await unwrapKey(oldWrappedPrivateKey, oldUmkData.umkCryptoKey);
      
      const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", privateKeyCrypto);
      const privateKeyBase64 = bufferToBase64(privateKeyBuffer);

      const newUmkData = await deriveUMKData(mnemonic, salt);
      const newWrappedPrivateKey = await wrapKey(privateKeyBase64, newUmkData.umkCryptoKey);

      setStatus("Updating your account...");
      const result = await changeMasterPassphrase(salt, verifier, newWrappedPrivateKey);

      if (result.success) {
        setStatus("Master Passphrase changed successfully!");
        showToastOnce('passphrase-changed', 'success', "Master Passphrase updated successfully!");
        await update();
        onSuccess();
        setTimeout(() => onClose(), 2000);
      } else {
        setStatus(result.error || "Failed to update passphrase");
        showToastOnce('passphrase-error', 'error', result.error || "Failed to update passphrase");
        setStep("newkey");
      }
    } catch {
      setStatus("Failed to re-encrypt private key");
      showToastOnce('reencrypt-error', 'error', "Update failed");
      setStep("newkey");
    } finally {
      setIsProcessing(false);
    }
  }, [mnemonic, salt, verifier, isProcessing, isCopied, oldMnemonic, oldUmkSalt, oldWrappedPrivateKey, update, onSuccess, onClose, showToastOnce]);

  const handleClose = useCallback(() => {
    setStep("alert");
    setOtp("");
    setOldMnemonic("");
    setOtpError("");
    setOldMnemonicError("");
    setMnemonic(null);
    setSalt(null);
    setVerifier(null);
    setStatus("");
    setOldWrappedPrivateKey(null);
    setOldUmkSalt(null);
    toastShownRef.current.clear();
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white border-gray-200 text-gray-900 p-0">
        <DialogHeader className="p-6 border-b border-gray-200 bg-gray-50">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {step === "alert" && "Change Master Passphrase"}
            {step === "otp" && "Verify Identity"}
            {step === "verify_old" && "Verify Old Master Key"}
            {step === "newkey" && "New Master Key Generated"}
            {step === "processing" && "Processing..."}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {step === "alert" && "This will generate a completely new Master Key. Your private key will be re-encrypted."}
            {step === "otp" && "Enter the 6-digit code sent to your email to continue."}
            {step === "verify_old" && "Enter your current master passphrase to decrypt your private key."}
            {step === "newkey" && "Copy and securely store your new Master Key. This is the ONLY way to access your encrypted data."}
            {step === "processing" && "Please wait while we update your account..."}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {step === "alert" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-orange-200">
                <AlertCircle className="w-10 h-10 text-orange-600" />
              </div>
              <p className="text-gray-900 text-lg font-bold mb-2">
                ⚠️ Warning: Secure Process
              </p>
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                We will verify your identity, then re-encrypt your private key with the new master passphrase. Your vault data remains secure throughout this process.
              </p>
              <div className="flex gap-3 mt-6 justify-center">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="border-gray-300 hover:bg-gray-100 hover:text-gray-900 bg-white rounded-lg font-semibold"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendOtp}
                  disabled={isVerifyingOtp}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-blue-200">
                  <Shield className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-gray-700 text-sm font-medium">Check your email for verification code</p>
              </div>
              
              {otpError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 text-sm font-semibold">{otpError}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-bold text-gray-900 mb-2 block">
                    Enter 6-digit OTP
                  </Label>
                  <Input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-lg text-center tracking-widest h-14 font-mono"
                    placeholder="000000"
                  />
                </div>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={!otp || otp.length !== 6 || isVerifyingOtp}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === "verify_old" && (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-blue-200">
                  <KeyRound className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-gray-700 text-sm font-medium">Enter your current master passphrase</p>
              </div>
              
              {oldMnemonicError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 text-sm font-semibold">{oldMnemonicError}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-bold text-gray-900 mb-2 block">
                    Current Master Passphrase (24 words)
                  </Label>
                  <textarea
                    value={oldMnemonic}
                    onChange={(e) => setOldMnemonic(e.target.value)}
                    className="w-full bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg p-4 font-mono text-sm min-h-[120px] resize-none"
                    placeholder="Enter your 24-word master passphrase..."
                  />
                </div>
                <Button
                  onClick={handleVerifyOldMnemonic}
                  disabled={!oldMnemonic.trim() || isVerifyingOldMnemonic}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  {isVerifyingOldMnemonic ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Generate New Key"
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === "newkey" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-bold text-orange-700 flex items-center">
                    <KeyRound className="w-6 h-6 mr-2" />
                    New Master Key
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-white border border-gray-300"
                      disabled={isProcessing}
                    >
                      {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={handleCopyKey}
                      className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center transition-all duration-200 shadow-sm ${
                        isCopied
                          ? "bg-green-600 text-white"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                      disabled={isProcessing}
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
                  className={`font-mono text-sm break-words p-4 bg-white border-2 border-gray-300 rounded-lg transition-all duration-200 select-all ${
                    showKey
                      ? "text-gray-900"
                      : "text-transparent select-none blur-sm"
                  }`}
                >
                  {mnemonic || "Generating your secure master key..."}
                </div>
                {!showKey && (
                  <p className="text-xs text-gray-600 mt-2 text-center font-medium">
                    Click the eye icon to reveal your key
                  </p>
                )}
              </div>

              {!isCopied && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-800 text-sm font-semibold flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    You must copy your new master key before proceeding
                  </p>
                </div>
              )}

              <Button
                onClick={handleConfirmNewKey}
                disabled={!isCopied || isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Updating Account...
                  </>
                ) : (
                  "Confirm & Update Master Passphrase"
                )}
              </Button>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900 text-center leading-relaxed font-medium">
                  🔒 Your new master key is generated locally. Store it securely in a password manager or offline location.
                </p>
              </div>

              {status && (
                <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
                  <p className="text-xs text-gray-700 text-center font-medium">{status}</p>
                </div>
              )}
            </div>
          )}

          {step === "processing" && (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-900 text-lg font-bold mb-2">
                {status || "Processing your request..."}
              </p>
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                Please do not close this window
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};