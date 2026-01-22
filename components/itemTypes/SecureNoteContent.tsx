import React from 'react';
import { FileText, Copy, Check, Lock } from 'lucide-react';

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
    <div className="space-y-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
          <FileText className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wide">
            Secure Note
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Encrypted text content
          </p>
        </div>
      </div>
      
      {item.note_ct && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5 ml-1">
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              Note Content
            </label>
            <button
              onClick={() => handleCopy(item.note_ct!, 'note')}
              className={`text-xs font-medium px-2 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                copiedField === 'note' 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              {copiedField === 'note' ? (
                <>
                  <Check className="w-3 h-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy Encrypted
                </>
              )}
            </button>
          </div>

          <div 
            className="group relative w-full p-4 min-h-25 bg-purple-50/30 border border-purple-100 rounded-xl cursor-pointer hover:bg-purple-50/60 hover:border-purple-200 transition-all"
            onClick={() => handleCopy(item.note_ct!, 'note')}
          >
             <div className="flex flex-col items-center justify-center h-full text-center py-4">
               <Lock className="w-6 h-6 text-purple-300 mb-2 group-hover:text-purple-400 transition-colors" />
               <p className="text-sm font-medium text-purple-900">
                 [Content Encrypted]
               </p>
               <p className="text-xs text-purple-600 mt-1">
                 Click to copy cipher text
               </p>
             </div>
          </div>
          
          <p className="text-[10px] text-gray-400 pl-1">
            Note content is fully encrypted. Decrypt with your master key to view.
          </p>
        </div>
      )}
    </div>
  );
};