import React from 'react';
import { User, Lock, Eye, EyeOff, Copy, Check, KeyRound } from 'lucide-react';

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

interface LoginItemContentProps {
  item: APIVaultItem;
  copiedField: string | null;
  handleCopy: (text: string, field: string) => Promise<void>;
}

export const LoginItemContent: React.FC<LoginItemContentProps> = ({ item, copiedField, handleCopy }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="space-y-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
           <KeyRound className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wide">
            Login Credentials
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Encrypted cipher text
          </p>
        </div>
      </div>
      
      {/* Username Field */}
      {item.username_ct && (
        <div className="group space-y-2">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5 ml-1">
            <User className="w-3.5 h-3.5 text-gray-400" />
            Username
          </label>
          <div className="relative">
             <input
               type="text"
               value="[Encrypted Data]"
               readOnly
               className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 font-mono cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all hover:bg-white hover:border-gray-300 hover:shadow-sm"
               onClick={() => handleCopy(item.username_ct!, 'username')}
             />
             <button
                onClick={() => handleCopy(item.username_ct!, 'username')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Copy encrypted username"
             >
               {copiedField === 'username' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
             </button>
          </div>
        </div>
      )}

      {/* Password Field */}
      {item.password_ct && (
        <div className="group space-y-2">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5 ml-1">
            <Lock className="w-3.5 h-3.5 text-gray-400" />
            Password
          </label>
          <div className="relative">
             <input
               type={showPassword ? "text" : "password"}
               value={showPassword ? item.password_ct : "[Encrypted Data]"}
               readOnly
               className="w-full pl-4 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 font-mono cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all hover:bg-white hover:border-gray-300 hover:shadow-sm"
               onClick={() => handleCopy(item.password_ct!, 'password')}
             />
             
             <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword); }}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={showPassword ? "Hide ciphertext" : "Show ciphertext"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <div className="w-px h-4 bg-gray-300 mx-0.5"></div>
                <button
                    onClick={() => handleCopy(item.password_ct!, 'password')}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Copy encrypted password"
                >
                {copiedField === 'password' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
             </div>
          </div>
          <p className="text-[10px] text-gray-400 pl-1 leading-none">
            Raw encrypted string stored in vault.
          </p>
        </div>
      )}
    </div>
  );
};