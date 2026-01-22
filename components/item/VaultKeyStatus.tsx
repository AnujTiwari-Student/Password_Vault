"use client";

import { AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";

interface VaultKeyStatusProps {
  mnemonic: string;
  ovkError: string | null;
  ovkCryptoKey: CryptoKey | null;
}

export const VaultKeyStatus: React.FC<VaultKeyStatusProps> = ({
  mnemonic,
  ovkError,
  ovkCryptoKey,
}) => {
  if (!mnemonic) return null;

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {ovkError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-red-900 font-semibold text-sm">Vault Key Error</p>
            <p className="text-red-700 text-xs">{ovkError}</p>
          </div>
        </div>
      )}
      
      {!ovkError && !ovkCryptoKey && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 shadow-sm">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
          <span className="text-blue-900 text-sm font-medium">Initializing encryption keys...</span>
        </div>
      )}
      
      {ovkCryptoKey && !ovkError && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-emerald-900 text-sm font-medium">Encryption Active - Vault Ready</span>
        </div>
      )}
    </div>
  );
};