"use client"

import React, { useEffect } from 'react';
import { X, User, Lock, Shield, FileText, ExternalLink, Edit } from 'lucide-react';
import { APIVaultItem, DecryptedData, MemberRole } from '@/types/vault';
import { CopyButton } from '@/components/common/CopyButton';
import { FieldDisplay } from '@/components/common/FieldDisplay';
import { useItemActions } from '@/hooks/useItemActions';
import { getRoleBadgeColor, getMultiTypeColor, formatTimestamp } from '@/utils/vault-helpers';

interface EnhancedItemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: APIVaultItem | null;
  decryptedData?: DecryptedData | null;
  userRole: MemberRole | null;
  canDecrypt: boolean;
  canEdit: boolean;
  onEdit?: () => void;
}

export const EnhancedItemDrawer: React.FC<EnhancedItemDrawerProps> = ({ 
  isOpen, 
  onClose, 
  item, 
  decryptedData,
  userRole,
  canDecrypt,
  canEdit,
  onEdit 
}) => {
  const { copiedField, copyToClipboard, copyEncrypted } = useItemActions();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const isFieldDecrypted = (field: keyof DecryptedData) => {
    return canDecrypt && decryptedData && decryptedData[field] !== undefined;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700/30 bg-gray-800/30 backdrop-blur-sm">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">{item.name}</h2>
            <div className="flex flex-wrap gap-1 items-center">
              {item.type.map((type, index) => (
                <span 
                  key={index}
                  className={`inline-block px-2 sm:px-3 py-1 text-xs font-medium rounded-full border ${getMultiTypeColor([type])}`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              ))}
              <span className={`px-2 py-0.5 rounded text-xs border ${getRoleBadgeColor(userRole)}`}>
                {userRole}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800/50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 group flex-shrink-0"
            title="Close"
            type="button"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto minimal-scrollbar p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-900/50 backdrop-blur-sm">
          
          {!canDecrypt && (
            <div className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-gray-400" />
                <h3 className="text-gray-300 font-medium text-sm">View-Only Access</h3>
              </div>
              <p className="text-gray-400 text-sm">
                You can view metadata and copy encrypted values, but cannot decrypt sensitive data. 
                Contact vault owner for decrypted values if needed.
              </p>
            </div>
          )}

          {item.url && (
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-300">
                <ExternalLink className="w-4 h-4 mr-2" />
                Website URL
              </label>
              <div className="flex items-center gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl text-gray-300 hover:text-gray-200 hover:bg-gray-700/50 transition-all duration-200 truncate hover:scale-[1.01] text-sm sm:text-base"
                >
                  {item.url}
                </a>
                <CopyButton
                  onClick={() => copyToClipboard(item.url!, 'URL')}
                  isCopied={copiedField === 'URL'}
                  title="Copy URL"
                />
              </div>
            </div>
          )}

          {item.username_ct && (
            <FieldDisplay
              label="Username/Email"
              icon={User}
              value={decryptedData?.username || ''}
              isEncrypted={!isFieldDecrypted('username')}
              canDecrypt={canDecrypt}
              onCopy={() => copyToClipboard(decryptedData?.username || '', 'username')}
              onCopyEncrypted={!canDecrypt ? () => copyEncrypted(item.username_ct!, 'username') : undefined}
              isCopied={copiedField === 'username'}
            />
          )}

          {item.password_ct && (
            <FieldDisplay
              label="Password"
              icon={Lock}
              value={decryptedData?.password || ''}
              isEncrypted={!isFieldDecrypted('password')}
              canDecrypt={canDecrypt}
              isPassword={true}
              onCopy={() => copyToClipboard(decryptedData?.password || '', 'password')}
              onCopyEncrypted={!canDecrypt ? () => copyEncrypted(item.password_ct!, 'password') : undefined}
              isCopied={copiedField === 'password'}
            />
          )}

          {item.totp_seed_ct && (
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-300">
                <Shield className="w-4 h-4 mr-2" />
                TOTP Secret
                {!isFieldDecrypted('totp_seed') && <span className="ml-1 text-xs text-gray-500">(Encrypted)</span>}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/30 rounded-xl">
                  <span 
                    className="text-green-300 font-mono text-sm cursor-pointer"
                    onClick={() => {
                      if (decryptedData?.totp_seed) {
                        copyToClipboard(decryptedData.totp_seed, 'TOTP secret');
                      }
                    }}
                  >
                    {isFieldDecrypted('totp_seed')
                      ? decryptedData!.totp_seed
                      : canDecrypt
                      ? '[Locked - Click item to decrypt]'
                      : '[Encrypted - contact vault owner]'}
                  </span>
                </div>
                <CopyButton
                  onClick={() => {
                    if (decryptedData?.totp_seed) {
                      copyToClipboard(decryptedData.totp_seed, 'TOTP secret');
                    }
                  }}
                  isCopied={copiedField === 'TOTP secret'}
                  title="Copy TOTP secret"
                />
                {!canDecrypt && (
                  <CopyButton
                    onClick={() => copyEncrypted(item.totp_seed_ct!, 'TOTP secret')}
                    isCopied={false}
                    variant="encrypted"
                    title="Copy encrypted value"
                  />
                )}
              </div>
            </div>
          )}

          {item.note_ct && (
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-300">
                <FileText className="w-4 h-4 mr-2" />
                Secure Note
                {!isFieldDecrypted('note') && <span className="ml-1 text-xs text-gray-500">(Encrypted)</span>}
              </label>
              <div 
                className="px-3 sm:px-4 py-3 sm:py-4 bg-purple-900/10 backdrop-blur-sm border border-purple-700/30 rounded-xl text-purple-300 text-sm sm:text-base cursor-pointer hover:bg-purple-900/20 transition-colors min-h-[100px]"
                onClick={() => {
                  if (decryptedData?.note) {
                    copyToClipboard(decryptedData.note, 'note');
                  }
                }}
              >
                <p className="whitespace-pre-wrap">
                  {isFieldDecrypted('note')
                    ? decryptedData!.note
                    : canDecrypt
                    ? '[Locked - Click item to decrypt]'
                    : '[Encrypted - contact vault owner]'}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    if (decryptedData?.note) {
                      copyToClipboard(decryptedData.note, 'note');
                    }
                  }}
                  className="text-xs bg-purple-800/50 hover:bg-purple-700/50 px-3 py-1 rounded-lg transition-colors"
                  type="button"
                  disabled={!decryptedData?.note}
                >
                  {copiedField === 'note' ? 'Copied!' : 'Copy'}
                </button>
                {!canDecrypt && (
                  <button
                    onClick={() => copyEncrypted(item.note_ct!, 'note')}
                    className="text-xs bg-gray-700/50 hover:bg-gray-600/50 px-3 py-1 rounded-lg transition-colors"
                    type="button"
                  >
                    Copy Encrypted
                  </button>
                )}
              </div>
            </div>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-300">
                🏷️ Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-sm rounded-full border backdrop-blur-sm transition-all hover:scale-105 bg-gray-700/30 text-gray-300 border-gray-600/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-700/30">
            <div className="grid grid-cols-1 gap-2 sm:gap-3 text-xs text-gray-500">
              <div className="flex justify-between items-center">
                <span>Item ID:</span>
                <span className="font-mono text-gray-400 text-right break-all">{item.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Last Updated:</span>
                <span className="text-gray-400">{formatTimestamp(item.updated_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Item Types:</span>
                <span className="text-gray-400">{item.type.length} type{item.type.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Access Level:</span>
                <span className={`text-sm ${canDecrypt ? 'text-green-400' : 'text-gray-400'}`}>
                  {canDecrypt ? 'Full Access' : 'View Only'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-700/30 bg-gray-800/20 backdrop-blur-sm">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 text-gray-300 rounded-xl hover:bg-gray-700/50 transition-all duration-200 hover:scale-105 active:scale-95"
              type="button"
            >
              <X className="w-4 h-4" />
              Close
            </button>
            {canEdit && onEdit && (
              <button 
                onClick={onEdit}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600/80 backdrop-blur-sm border border-blue-500/30 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 hover:scale-105 active:scale-95"
                type="button"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
          
          <div className="mt-3 p-3 bg-gray-800/20 border border-gray-700/30 rounded-lg">
            <p className="text-gray-400 text-xs">
              <strong>Note:</strong> {
                canDecrypt 
                  ? (decryptedData ? "Data has been decrypted and is ready to use." : "Click the item to decrypt and view sensitive data.")
                  : "You have view-only access. You can copy encrypted values but cannot decrypt them."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
