import React from 'react';
import { User, Copy, Check, Mail } from 'lucide-react';

interface UsernameFieldProps {
  value: string;
  onCopy?: (value: string) => void;
  copied?: boolean;
  label?: string;
}

export const UsernameField: React.FC<UsernameFieldProps> = ({ 
  value, 
  onCopy, 
  copied = false,
  label = "Username" 
}) => {
  const isEmail = value.includes('@');
  const Icon = isEmail ? Mail : User;

  return (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-300">
        <Icon className="w-4 h-4 mr-2" />
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          readOnly
          className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
        />
        {onCopy && (
          <button
            onClick={() => onCopy(value)}
            className="p-2.5 sm:p-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-700/80 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            title={`Copy ${label.toLowerCase()}`}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
