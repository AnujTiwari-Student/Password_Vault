import React from 'react';
import { Shield } from 'lucide-react';

interface UnlockPromptProps {
  onUnlock: () => void;
  isDecrypting: boolean;
}

export const UnlockPrompt: React.FC<UnlockPromptProps> = ({
  onUnlock,
  isDecrypting,
}) => {
  return (
    <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white mb-1">
            Item Locked
          </h3>
          <p className="text-sm text-gray-300 mb-3">
            Enter your master passphrase to decrypt and view this item
          </p>
          <button
            onClick={onUnlock}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            disabled={isDecrypting}
          >
            Unlock Item
          </button>
        </div>
      </div>
    </div>
  );
};