"use client"

import React from 'react';
import { BookCopy, Copy } from 'lucide-react';

interface CopyButtonProps {
  onClick: () => void;
  isCopied: boolean;
  title?: string;
  variant?: 'default' | 'encrypted';
  size?: number;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  onClick,
  isCopied,
  title = 'Copy',
  variant = 'default',
  size = 22,
}) => {
  const baseClasses = "p-2.5 sm:p-3 backdrop-blur-sm border rounded-xl transition-all duration-200 hover:scale-105 active:scale-95";
  
  const variantClasses = variant === 'encrypted'
    ? "bg-gray-700/50 border-gray-600/30 hover:bg-gray-600/50"
    : "bg-gray-800/50 border-gray-700/30 hover:bg-gray-700/50";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses}`}
      title={title}
      type="button"
    >
      {isCopied ? (
        <span className="text-green-400">✓</span>
      ) : variant === 'encrypted' ? (
        <Copy className="w-4 h-4 text-gray-400" />
      ) : (
        <BookCopy size={size} />
      )}
    </button>
  );
};
