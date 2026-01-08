"use client";

import { AlertCircle, RefreshCw, Check } from "lucide-react";

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
    <div className="space-y-2">
      {ovkError && (
        <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
          <p className="text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Vault key error: {ovkError}</span>
          </p>
        </div>
      )}
      
      {!ovkError && !ovkCryptoKey && (
        <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <p className="text-blue-300 text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
            <span>Loading vault encryption key...</span>
          </p>
        </div>
      )}
      
      {ovkCryptoKey && !ovkError && (
        <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
          <p className="text-green-300 text-sm flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>Vault ready - You can now create items</span>
          </p>
        </div>
      )}
    </div>
  );
};
