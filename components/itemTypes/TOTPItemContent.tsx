import React from 'react';
import { Shield } from 'lucide-react';

interface APIVaultItem {
  id: string;
  name: string;
  url?: string;
  type: string[];
  tags: string[];
  item_key_wrapped: string;
  username_ct?: string;
  password_ct?: string;
  totp_seed_ct?: string;
  note_ct?: string;
  updated_at: string;
}

interface TOTPItemContentProps {
  item: APIVaultItem;
  copiedField: string | null;
  handleCopy: (text: string, field: string) => Promise<void>;
}

export const TOTPItemContent: React.FC<TOTPItemContentProps> = ({ item, copiedField, handleCopy }) => {
  return (
    <div className="space-y-4 p-4 bg-green-900/10 rounded-xl border border-green-700/30">
      <h3 className="text-green-300 font-semibold flex items-center gap-2 text-sm sm:text-base">
        <Shield className="w-4 h-4" />
        Two-Factor Authentication
      </h3>
      
      {item.totp_seed_ct && (
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-300">
            <Shield className="w-4 h-4 mr-2" />
            TOTP Secret (Encrypted)
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-900/30 to-blue-900/30 border-2 border-green-700/50 rounded-xl">
              <div className="flex items-center justify-between">
                <span 
                  className="text-green-300 font-mono text-sm cursor-pointer"
                  onClick={() => handleCopy(item.totp_seed_ct!, 'totp')}
                >
                  [Encrypted TOTP Secret - Click to Copy]
                </span>
              </div>
            </div>
            <button
              onClick={() => handleCopy(item.totp_seed_ct!, 'totp')}
              className="p-2.5 sm:p-3 bg-green-800/80 backdrop-blur-sm border border-green-700/50 hover:bg-green-700/80 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
              title="Copy encrypted TOTP secret"
            >
              {copiedField === 'totp' ? '✓' : '📋'}
            </button>
          </div>
          <p className="text-xs text-gray-500">Encrypted TOTP secret - decrypt to generate 2FA codes</p>
        </div>
      )}
    </div>
  );
};
