import React from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

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
    <div className="space-y-4 p-4 bg-blue-900/10 rounded-xl border border-blue-700/30">
      <h3 className="text-blue-300 font-semibold flex items-center gap-2 text-sm sm:text-base">
        <Lock className="w-4 h-4" />
        Login Information
      </h3>
      
      {/* Username Field */}
      {item.username_ct && (
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-300">
            <User className="w-4 h-4 mr-2" />
            Username/Email (Encrypted)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value="[Encrypted Data - Click to Copy]"
              readOnly
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl text-gray-400 focus:outline-none text-sm sm:text-base cursor-pointer"
              onClick={() => handleCopy(item.username_ct!, 'username')}
            />
            <button
              onClick={() => handleCopy(item.username_ct!, 'username')}
              className="p-2.5 sm:p-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-700/80 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
              title="Copy encrypted username"
            >
              {copiedField === 'username' ? '✓' : '📋'}
            </button>
          </div>
          <p className="text-xs text-gray-500">Encrypted data - decrypt with your master key to view</p>
        </div>
      )}

      {/* Password Field */}
      {item.password_ct && (
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-300">
            <Lock className="w-4 h-4 mr-2" />
            Password (Encrypted)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showPassword ? "text" : "password"}
                value="[Encrypted Data - Click to Copy]"
                readOnly
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl text-gray-400 focus:outline-none text-sm sm:text-base cursor-pointer font-mono pr-10"
                onClick={() => handleCopy(item.password_ct!, 'password')}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-700/50 rounded transition-colors"
                title={showPassword ? "Hide" : "Show"}
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            <button
              onClick={() => handleCopy(item.password_ct!, 'password')}
              className="p-2.5 sm:p-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-700/80 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
              title="Copy encrypted password"
            >
              {copiedField === 'password' ? '✓' : '📋'}
            </button>
          </div>
          <p className="text-xs text-gray-500">Encrypted data - decrypt with your master key to view</p>
        </div>
      )}
    </div>
  );
};
