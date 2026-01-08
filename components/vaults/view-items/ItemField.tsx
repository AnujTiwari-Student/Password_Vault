import React from 'react';
import { Copy, Eye, EyeOff, Lock } from 'lucide-react';
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
  const handleCopy = () => {
    if (copyable && typeof value === 'string') {
      navigator.clipboard.writeText(value);
      toast.success(`${label} copied to clipboard`);
    } else if (onCopy) {
      onCopy();
    }
  };

  const renderValue = () => {
    if (isArray) {
      return <div className="flex flex-wrap gap-2">{value}</div>;
    }

    if (isNote) {
      return (
        <div className="relative bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 min-h-[100px] whitespace-pre-wrap">
          {decrypted ? value : '••••••••••••••••'}
          {!decrypted && onViewSensitive && (
            <button
              onClick={onViewSensitive}
              className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              disabled={isDisabled}
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (isEncrypted) {
      const displayValue = (() => {
        if (!decrypted) return '••••••••••••••••';
        if (isPassword && !showPassword) return '••••••••••••••••';
        if (isTotp && !showTotp) return '••••••••••••••••';
        return value;
      })();

      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm font-mono">
            {displayValue}
          </div>
          <div className="flex gap-2">
            {(isPassword || isTotp) && onToggle && (
              <button
                onClick={onToggle}
                className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                disabled={isDisabled}
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
              className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              disabled={copyDisabled || isDisabled}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm break-all">
          {value}
        </div>
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            disabled={isDisabled}
          >
            <Copy className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">
        {label}
      </label>
      {renderValue()}
    </div>
  );
};