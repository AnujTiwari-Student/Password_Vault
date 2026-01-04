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
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-300">
        {Icon && <Icon className="w-4 h-4 mr-2" />}
        {label}
      </label>
      <div className="flex items-center gap-2">
        {children}
        {onCopy && copyValue && (
          <button
            onClick={() => onCopy(copyValue)}
            className="p-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-700/80 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
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
