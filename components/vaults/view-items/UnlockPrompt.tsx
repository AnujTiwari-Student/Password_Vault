import React from 'react';
import { Shield, Lock } from 'lucide-react';

interface UnlockPromptProps {
  onUnlock: () => void;
  isDecrypting: boolean;
}

export const UnlockPrompt: React.FC<UnlockPromptProps> = ({
  onUnlock,
  isDecrypting,
}) => {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <div className="flex-1 pt-0.5">
          <h3 className="text-sm font-bold text-blue-900 mb-1">
            Encrypted Content Locked
          </h3>
          <p className="text-sm text-blue-700 mb-4 leading-relaxed">
            This item contains sensitive data encrypted with your master key. Please unlock to view details.
          </p>
          <button
            onClick={onUnlock}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            disabled={isDecrypting}
          >
            <Lock className="w-4 h-4" />
            {isDecrypting ? 'Decrypting...' : 'Unlock Item'}
          </button>
        </div>
      </div>
    </div>
  );
};