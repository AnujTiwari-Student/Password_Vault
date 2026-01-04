"use client"

import React, { useState } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';
import { CopyButton } from './CopyButton';

interface FieldDisplayProps {
  label: string;
  icon: LucideIcon;
  value: string;
  isEncrypted: boolean;
  canDecrypt: boolean;
  isPassword?: boolean;
  onCopy: () => void;
  onCopyEncrypted?: () => void;
  isCopied: boolean;
  className?: string;
}

export const FieldDisplay: React.FC<FieldDisplayProps> = ({
  label,
  icon: Icon,
  value,
  isEncrypted,
  canDecrypt,
  isPassword = false,
  onCopy,
  onCopyEncrypted,
  isCopied,
  className = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const displayValue = isEncrypted
    ? canDecrypt
      ? '[Locked - Click item to decrypt]'
      : '[Encrypted - contact vault owner]'
    : value;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="flex items-center text-sm font-medium text-gray-300">
        <Icon className="w-4 h-4 mr-2" />
        {label}
        {isEncrypted && <span className="ml-1 text-xs text-gray-500">(Encrypted)</span>}
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={isPassword && !showPassword ? 'password' : 'text'}
            value={displayValue}
            readOnly
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl text-white focus:outline-none text-sm sm:text-base cursor-pointer font-mono pr-10"
            onClick={onCopy}
          />
          {isPassword && !isEncrypted && (
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-700/30 rounded transition-colors"
              title={showPassword ? 'Hide' : 'Show'}
              type="button"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-gray-400" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400" />
              )}
            </button>
          )}
        </div>
        <CopyButton
          onClick={onCopy}
          isCopied={isCopied}
          title={isEncrypted ? 'Copy encrypted value' : `Copy ${label.toLowerCase()}`}
        />
        {isEncrypted && !canDecrypt && onCopyEncrypted && (
          <CopyButton
            onClick={onCopyEncrypted}
            isCopied={false}
            variant="encrypted"
            title="Copy encrypted value"
          />
        )}
      </div>
    </div>
  );
};
