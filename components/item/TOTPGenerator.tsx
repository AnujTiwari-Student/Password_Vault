"use client";

import QRCode from "react-qr-code";
import { Smartphone, RefreshCw, Shield } from "lucide-react";
import { Button } from "../ui/button";

interface TOTPGeneratorProps {
  totpSecret: string;
  totpOtpAuthUrl: string;
  totpQrUrl: string;
  isGeneratingTOTP: boolean;
  isRegeneratingQR: boolean;
  onGenerateNew: () => void;
  onRegenerateQR: () => void;
}

export const TOTPGenerator: React.FC<TOTPGeneratorProps> = ({
  totpSecret,
  totpOtpAuthUrl,
  totpQrUrl,
  isGeneratingTOTP,
  isRegeneratingQR,
  onGenerateNew,
  onRegenerateQR,
}) => {
  if (!totpSecret || !totpQrUrl) return null;

  return (
    <div className="mt-4 space-y-3 p-3 bg-gray-900/50 rounded-lg border border-green-700/30">
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <Smartphone className="w-4 h-4" />
        <span className="font-medium">Scan with Authenticator App</span>
      </div>

      <div className="flex justify-center p-4 bg-white rounded-lg">
        <QRCode 
          value={totpOtpAuthUrl} 
          size={200}
          level="H"
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-400">
          Scan this QR code with Google Authenticator, Authy, 1Password, or any TOTP app
        </p>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRegenerateQR}
            disabled={isRegeneratingQR}
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 text-xs"
          >
            {isRegeneratingQR ? (
              <>
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-1" />
                Regenerate QR
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerateNew}
            disabled={isGeneratingTOTP}
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 text-xs"
          >
            {isGeneratingTOTP ? (
              <>
                <Shield className="w-3 h-3 mr-1 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <Shield className="w-3 h-3 mr-1" />
                New Secret
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
