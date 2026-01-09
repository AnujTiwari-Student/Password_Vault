"use client";
import React, { useState, useCallback } from "react";
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
} from "@/utils/client-crypto";
import { useSession } from "next-auth/react";

interface ChangeMasterPassphraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangeMasterPassphraseModal: React.FC<ChangeMasterPassphraseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { update } = useSession();
  const [step, setStep] = useState<"alert" | "otp" | "newkey" | "success">("alert");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [salt, setSalt] = useState<string | null>(null);
  const [verifier, setVerifier] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [showKey, setShowKey] = useState(true);
  const {isCopied, copy} = useClipboard({ successDuration: 100000 });

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
    } catch (error) {
      setStatus("Error generating new key");
      console.error(error);
    }
  }, []);

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    setIsVerifyingOtp(true);
    setOtpError("");
    
    try {
      const response = await fetch("/api/auth/verify-change-passphrase-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otp.trim() }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        await runGenerateNewKey();
        setStep("newkey");
      } else {
        setOtpError(data.error || "Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setOtpError("Network error. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleCopyKey = () => {
    if (mnemonic) {
      copy(mnemonic);
      toast.success("Master Key copied!");
    }
  };

  const handleConfirmNewKey = async () => {
    if (!mnemonic || !salt || !verifier || isProcessing || !isCopied) return;

    setIsProcessing(true);
    setStatus("Updating your account with new Master Key...");

    try {
      const response = await fetch("/api/auth/change-master-passphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          umk_salt: salt,
          master_passphrase_verifier: verifier,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("Master Passphrase changed successfully!");
        toast.success("Master Passphrase updated successfully!");
        await update();
        onSuccess();
        setTimeout(() => onClose(), 2000);
      } else {
        setStatus(data.error || "Failed to update passphrase");
        toast.error(data.error || "Failed to update passphrase");
      }
    } catch (error) {
      console.error("Error updating passphrase:", error);
      setStatus("Network error during update");
      toast.error("Update failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep("alert");
    setOtp("");
    setOtpError("");
    setMnemonic(null);
    setSalt(null);
    setVerifier(null);
    setStatus("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-white p-0">
        <DialogHeader className="p-6 border-b border-gray-700">
          <DialogTitle className="text-2xl font-bold">
            {step === "alert" && "Change Master Passphrase"}
            {step === "otp" && "Verify Identity"}
            {step === "newkey" && "New Master Key Generated"}
            {step === "success" && "Success!"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {step === "alert" && "This will generate a completely new Master Key. Your existing encrypted data will need to be re-encrypted."}
            {step === "otp" && "Enter the 6-digit code sent to your email to continue."}
            {step === "newkey" && "Copy and securely store your new Master Key. This is the ONLY way to access your encrypted data."}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {step === "alert" && (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <p className="text-gray-300 text-lg font-semibold mb-2">
                ⚠️ Warning: Irreversible Action
              </p>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                This will invalidate all your current encryption keys. You will need to re-encrypt all vault items with the new Master Key.
              </p>
              <div className="flex gap-3 mt-6 justify-center">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="border-gray-600 hover:bg-gray-800 hover:text-white bg-red-600 rounded-md"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => setStep("otp")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-gray-300 text-sm">Check your email for verification code</p>
              </div>
              
              {otpError && (
                <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 mb-4">
                  <p className="text-red-300 text-sm">{otpError}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-300 mb-2 block">
                    Enter 6-digit OTP
                  </Label>
                  <Input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="bg-gray-800 border-gray-600 text-white focus:border-blue-500 text-lg text-center tracking-widest h-14 font-mono"
                    placeholder="000000"
                  />
                </div>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={!otp || otp.length !== 6 || isVerifyingOtp}
                  className="w-full bg-blue-600 hover:bg-blue-700"
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

          {step === "newkey" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-bold text-amber-400 flex items-center">
                    <KeyRound className="w-6 h-6 mr-2" />
                    New Master Key
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
                      disabled={isProcessing}
                    >
                      {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={handleCopyKey}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center transition-all duration-200 ${
                        isCopied
                          ? "bg-green-600 text-white shadow-lg"
                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
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
                  className={`font-mono text-sm break-words p-4 bg-gray-950 border border-gray-700 rounded-lg transition-all duration-200 select-all ${
                    showKey
                      ? "text-gray-200"
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

              {!isCopied && (
                <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
                  <p className="text-amber-300 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    You must copy your new master key before proceeding
                  </p>
                </div>
              )}

              <Button
                onClick={handleConfirmNewKey}
                disabled={!isCopied || isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-4 rounded-xl shadow-lg"
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

              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  🔒 Your new master key is generated locally. Store it securely in a password manager or offline location.
                </p>
              </div>

              {status && (
                <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-300 text-center">{status}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
