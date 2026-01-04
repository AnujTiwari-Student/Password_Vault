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
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-300">
        <Lock className="w-4 h-4 mr-2" />
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          readOnly
          className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm sm:text-base transition-all duration-200"
        />
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="p-2.5 sm:p-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-700/80 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 text-gray-400" />
          ) : (
            <Eye className="w-4 h-4 text-gray-400" />
          )}
        </button>
        <button
          onClick={() => onCopy(value)}
          className="p-2.5 sm:p-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-700/80 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          title="Copy password"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
};
