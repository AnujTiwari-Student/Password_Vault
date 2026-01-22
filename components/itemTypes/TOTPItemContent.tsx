import React from 'react';
import { ShieldCheck, Copy, Check, Lock } from 'lucide-react';

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
    <div className="space-y-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wide">
            Two-Factor Auth
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Time-based One-Time Password
          </p>
        </div>
      </div>
      
      {item.totp_seed_ct && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5 ml-1">
            <Lock className="w-3.5 h-3.5 text-gray-400" />
            TOTP Secret
          </label>
          
          <div className="relative group">
            <input
              type="text"
              value="[Encrypted Secret Key]"
              readOnly
              className="w-full pl-4 pr-12 py-3 bg-emerald-50/30 border border-emerald-100 rounded-xl text-sm text-emerald-800 font-medium cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all hover:bg-emerald-50 hover:border-emerald-200"
              onClick={() => handleCopy(item.totp_seed_ct!, 'totp')}
            />
            
            <button
              onClick={() => handleCopy(item.totp_seed_ct!, 'totp')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-600/70 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all"
              title="Copy encrypted TOTP secret"
            >
              {copiedField === 'totp' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          
          <p className="text-[10px] text-gray-400 pl-1 leading-relaxed">
            This secret key generates your 2FA codes. It is stored in encrypted format.
          </p>
        </div>
      )}
    </div>
  );
};