"use client";

import QRCode from "react-qr-code";
import { Smartphone, RefreshCw, Shield, ScanLine } from "lucide-react";
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
    <div className="mt-4 p-5 bg-white rounded-xl border border-emerald-100 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
          <ScanLine className="w-4 h-4 text-emerald-600" />
          <span>Scan QR Code</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md">
          <Smartphone className="w-3.5 h-3.5" />
          Authenticator App
        </div>
      </div>

      <div className="flex justify-center">
        <div className="p-3 bg-white rounded-xl border-2 border-dashed border-gray-200 shadow-sm relative group hover:border-emerald-300 transition-colors">
          <QRCode 
            value={totpOtpAuthUrl} 
            size={180}
            level="H"
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox={`0 0 256 256`}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-center text-xs text-gray-500 leading-relaxed max-w-70 mx-auto">
          Scan this code with Google Authenticator, Authy, 1Password, or any compatible TOTP app to generate codes.
        </p>
        
        <div className="flex gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRegenerateQR}
            disabled={isRegeneratingQR}
            className="flex-1 h-9 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-xs font-medium rounded-lg"
          >
            {isRegeneratingQR ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Refresh QR
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerateNew}
            disabled={isGeneratingTOTP}
            className="flex-1 h-9 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 text-xs font-medium rounded-lg"
          >
            {isGeneratingTOTP ? (
              <>
                <Shield className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                New Secret
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};