import React from 'react';
import { FileText } from 'lucide-react';

interface APIVaultItem {
  id: string;
  name: string;
  url?: string;
  type: string[];
  tags: string[];
  item_key_wrapped: string;
  username_ct?: string;
  password_ct?: string;
  totp_seed_ct?: string;
  note_ct?: string;
  updated_at: string;
}

interface SecureNoteContentProps {
  item: APIVaultItem;
  copiedField: string | null;
  handleCopy: (text: string, field: string) => Promise<void>;
}

export const SecureNoteContent: React.FC<SecureNoteContentProps> = ({ item, copiedField, handleCopy }) => {
  return (
    <div className="space-y-4 p-4 bg-purple-900/10 rounded-xl border border-purple-700/30">
      <h3 className="text-purple-300 font-semibold flex items-center gap-2 text-sm sm:text-base">
        <FileText className="w-4 h-4" />
        Secure Note
      </h3>
      
      {item.note_ct && (
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-300">
            <FileText className="w-4 h-4 mr-2" />
            Note Content (Encrypted)
          </label>
          <div className="px-3 sm:px-4 py-3 sm:py-4 bg-purple-900/20 backdrop-blur-sm border border-purple-700/50 rounded-xl text-purple-300 text-sm sm:text-base cursor-pointer hover:bg-purple-900/30 transition-colors"
            onClick={() => handleCopy(item.note_ct!, 'note')}
          >
            <p className="whitespace-pre-wrap">[Encrypted Note Content - Click to Copy]</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Encrypted note - decrypt with your master key to view</p>
            <button
              onClick={() => handleCopy(item.note_ct!, 'note')}
              className="text-xs bg-purple-800/80 hover:bg-purple-700/80 px-3 py-1 rounded-lg transition-colors"
            >
              {copiedField === 'note' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
