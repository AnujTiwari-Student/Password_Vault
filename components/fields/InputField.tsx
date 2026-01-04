import React from 'react';
import { Copy, Check } from 'lucide-react';

interface InputFieldProps {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  value: string;
  onCopy?: (value: string) => void;
  copied?: boolean;
  type?: string;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  icon: Icon, 
  value, 
  onCopy, 
  copied = false, 
  type = 'text',
  readOnly = true,
  className = '',
  placeholder = ''
}) => {
  return (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-300">
        {Icon && <Icon className="w-4 h-4 mr-2" />}
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-all duration-200 text-sm sm:text-base ${className}`}
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
