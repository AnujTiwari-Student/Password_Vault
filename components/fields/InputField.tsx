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
    <div className="group space-y-2">
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5 ml-1 select-none">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
        {label}
      </label>
      
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`
            flex-1 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
            text-sm text-gray-900 font-medium placeholder:text-gray-400 
            focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 
            transition-all duration-200 shadow-sm
            ${readOnly ? 'cursor-default' : ''}
            ${className}
          `}
        />
        
        {onCopy && (
          <button
            onClick={() => onCopy(value)}
            className={`
              shrink-0 p-3 rounded-xl border transition-all duration-200 shadow-sm
              ${copied 
                ? 'bg-green-50 border-green-200 text-green-600' 
                : 'bg-white border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md active:scale-95'
              }
            `}
            title={copied ? "Copied" : `Copy ${label.toLowerCase()}`}
            type="button"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};