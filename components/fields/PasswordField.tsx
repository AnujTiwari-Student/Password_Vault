import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Copy, Check } from 'lucide-react';

interface PasswordFieldProps {
  label?: string;
  value: string;
  onCopy: (value: string) => void;
  copied: boolean;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({ 
  label = 'Password', 
  value, 
  onCopy, 
  copied 
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div className="group space-y-2">
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5 ml-1 select-none">
        <Lock className="w-3.5 h-3.5 text-gray-400" />
        {label}
      </label>
      
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={showPassword ? 'text' : 'password'}
            value={value}
            readOnly
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 font-medium font-mono focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 shadow-sm pr-12 cursor-default"
          />
          {/* Internal Eye Button for cleaner look */}
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors"
            title={showPassword ? 'Hide password' : 'Show password'}
            type="button"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <button
          onClick={() => onCopy(value)}
          className={`
            shrink-0 p-3 rounded-xl border transition-all duration-200 shadow-sm
            ${copied 
              ? 'bg-green-50 border-green-200 text-green-600' 
              : 'bg-white border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md active:scale-95'
            }
          `}
          title="Copy password"
          type="button"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};