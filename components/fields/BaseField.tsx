import React from 'react';
import { Copy, Check } from 'lucide-react';

interface BaseFieldProps {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onCopy?: (value: string) => void;
  copied?: boolean;
  copyValue?: string;
}

export const BaseField: React.FC<BaseFieldProps> = ({ 
  label, 
  icon: Icon, 
  children, 
  onCopy, 
  copied = false,
  copyValue 
}) => {
  return (
    <div className="group space-y-2">
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5 ml-1 select-none">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
        {label}
      </label>
      
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          {children}
        </div>
        
        {onCopy && copyValue && (
          <button
            onClick={() => onCopy(copyValue)}
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