import React from 'react';
import { Copy, Eye, EyeOff, Lock, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ItemFieldProps {
  label: string;
  value: string | React.ReactNode;
  isEncrypted?: boolean;
  isPassword?: boolean;
  isTotp?: boolean;
  isNote?: boolean;
  isArray?: boolean;
  copyable?: boolean;
  showPassword?: boolean;
  showTotp?: boolean;
  decrypted?: boolean;
  onToggle?: () => void;
  onCopy?: () => void;
  onViewSensitive?: () => void;
  isDisabled?: boolean;
  copyDisabled?: boolean;
}

export const ItemField: React.FC<ItemFieldProps> = ({
  label,
  value,
  isEncrypted = false,
  isPassword = false,
  isTotp = false,
  isNote = false,
  isArray = false,
  copyable = false,
  showPassword = false,
  showTotp = false,
  decrypted = false,
  onToggle,
  onCopy,
  onViewSensitive,
  isDisabled = false,
  copyDisabled = false,
}) => {
  // Use state to show temporary checkmark on copy
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (copyable && typeof value === 'string') {
      navigator.clipboard.writeText(value);
      toast.success(`${label} copied to clipboard`);
      setCopied(true);
    } else if (onCopy) {
      onCopy();
      setCopied(true);
    }
    
    setTimeout(() => setCopied(false), 2000);
  };

  const renderValue = () => {
    if (isArray) {
      return <div className="flex flex-wrap gap-2">{value}</div>;
    }

    if (isNote) {
      return (
        <div className={`
          relative rounded-xl p-4 text-sm min-h-25 whitespace-pre-wrap transition-all border
          ${decrypted 
            ? 'bg-yellow-50 border-yellow-200 text-gray-800' 
            : 'bg-gray-50 border-gray-200 text-gray-400 flex items-center justify-center'
          }
        `}>
          {decrypted ? (
            value
          ) : (
             <div className="text-center">
               <Lock className="w-6 h-6 mx-auto mb-2 opacity-30" />
               <span className="font-medium text-xs uppercase tracking-wider opacity-60">
                 Secure Note Locked
               </span>
             </div>
          )}
          
          {!decrypted && onViewSensitive && (
            <button
              onClick={onViewSensitive}
              className="absolute inset-0 w-full h-full bg-transparent cursor-pointer"
              disabled={isDisabled}
              aria-label="Unlock note"
            />
          )}
        </div>
      );
    }

    if (isEncrypted) {
      const displayValue = (() => {
        if (!decrypted) return '•••• •••• •••• ••••';
        if (isPassword && !showPassword) return '••••••••••••••••';
        if (isTotp && !showTotp) return '•••• •••• •••• ••••';
        return value;
      })();

      return (
        <div className="flex items-center gap-2 group">
          <div className={`
            flex-1 rounded-xl px-4 py-3 text-sm font-mono border transition-all
            ${decrypted 
              ? 'bg-white border-gray-200 text-gray-900 shadow-sm' 
              : 'bg-gray-50 border-gray-200 text-gray-400 select-none'
            }
          `}>
            {displayValue}
          </div>
          
          <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {(isPassword || isTotp) && onToggle && (
              <button
                onClick={onToggle}
                className="p-3 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600 rounded-xl transition-all shadow-sm"
                disabled={isDisabled}
                title={decrypted ? (isPassword && showPassword ? "Hide" : "Show") : "Locked"}
              >
                {decrypted ? (
                  (isPassword && showPassword) || (isTotp && showTotp) ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </button>
            )}
            
            <button
              onClick={handleCopy}
              className={`p-3 border rounded-xl transition-all shadow-sm ${
                copied 
                  ? 'bg-green-50 border-green-200 text-green-600'
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600'
              }`}
              disabled={copyDisabled || isDisabled}
              title="Copy"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 group">
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm break-all text-blue-600 font-medium">
          {value}
        </div>
        
        {copyable && (
          <button
            onClick={handleCopy}
            className={`p-3 border rounded-xl transition-all shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 ${
              copied 
                ? 'bg-green-50 border-green-200 text-green-600'
                : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600'
            }`}
            disabled={isDisabled}
            title="Copy"
          >
             {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
        {label}
      </label>
      {renderValue()}
    </div>
  );
};