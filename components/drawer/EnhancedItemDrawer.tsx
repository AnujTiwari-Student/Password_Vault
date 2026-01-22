"use client";

import React, { useEffect } from 'react';
import { 
  X, User, Lock, Shield, FileText, ExternalLink, Edit, 
  AlertTriangle, Copy, Globe, Unlock, Check, Trash2 
} from 'lucide-react';
import { APIVaultItem, DecryptedData, MemberRole } from '@/types/vault';
import { useItemActions } from '@/hooks/useItemActions';
import { getRoleBadgeColor, formatTimestamp } from '@/utils/vault-helpers';

interface EnhancedItemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: APIVaultItem | null;
  decryptedData?: DecryptedData | null;
  userRole: MemberRole | null;
  canDecrypt: boolean;
  canEdit: boolean;
  onEdit?: () => void;
  onUnlock?: () => void;
  onDelete?: () => void; 
}

export const EnhancedItemDrawer: React.FC<EnhancedItemDrawerProps> = ({ 
  isOpen, 
  onClose, 
  item, 
  decryptedData,
  userRole,
  canDecrypt,
  canEdit,
  onEdit,
  onUnlock,
  onDelete // Destructure onDelete
}) => {
  const { copiedField, copyToClipboard, copyEncrypted } = useItemActions();
  
  const isLocked = !decryptedData;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const isFieldDecrypted = (field: keyof DecryptedData) => {
    return !!(decryptedData && decryptedData[field] !== undefined);
  };

  const ReadOnlyField = ({ 
    label, 
    icon: Icon, 
    value, 
    isSecret = false, 
    isDecrypted = false,
    onCopy,
    onCopyEncrypted,
    copyStatus,
    encryptedCopyStatus 
  }: { 
    label: string; 
    icon: React.ElementType; 
    value: string; 
    isSecret?: boolean;
    isDecrypted?: boolean;
    onCopy: () => void;
    onCopyEncrypted?: () => void;
    copyStatus: boolean;
    encryptedCopyStatus?: boolean;
  }) => (
    <div className="group">
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      <div className="relative flex items-center">
        <div 
          onClick={() => {
            if (isSecret && !isDecrypted && onUnlock) {
              onUnlock();
            }
          }}
          className={`
          w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-900 
          transition-all
          ${isSecret && !isDecrypted 
            ? 'text-gray-400 font-mono cursor-pointer hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 select-none' 
            : 'select-text'}
          ${isSecret && isDecrypted 
            ? 'font-mono text-green-700 bg-green-50 border-green-300' 
            : ''}
        `}>
          <span className="block truncate pr-24"> 
            {value}
          </span>
        </div>
        
        <div className="absolute right-2 flex items-center gap-1.5 bg-transparent">
          {onCopyEncrypted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopyEncrypted();
              }}
              className={`p-2 rounded-lg transition-all ${
                encryptedCopyStatus 
                  ? 'text-green-600 bg-green-100 border border-green-200' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
              title="Copy Encrypted Ciphertext"
            >
              {encryptedCopyStatus ? (
                <Check className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            disabled={!isDecrypted && isSecret}
            className={`
              p-2 rounded-lg transition-all border
              ${copyStatus 
                ? 'text-green-600 bg-green-100 border-green-200' 
                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 border-gray-300 hover:border-blue-400'}
              ${!isDecrypted && isSecret ? 'opacity-0 pointer-events-none' : ''}
            `}
            title="Copy Value"
          >
            {copyStatus ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white sm:rounded-2xl shadow-2xl w-full max-w-125 h-full sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden border-2 border-gray-200">
        
        {/* Header */}
        <div className="px-6 py-6 border-b-2 border-gray-200 bg-white flex items-start justify-between shrink-0">
          <div className="space-y-2 pr-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-snug wrap-break-words">
              {item.name}
            </h2>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border-2 ${getRoleBadgeColor(userRole)}`}>
                {userRole}
              </span>
              <span className="text-gray-300 font-bold">•</span>
              <span className="text-xs text-gray-600 font-semibold">
                Updated {formatTimestamp(item.updated_at)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          
          {isLocked && (
            <div 
              onClick={onUnlock}
              className="bg-blue-50 border-2 border-blue-300 rounded-xl p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-blue-100 hover:border-blue-400 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors border-2 border-blue-200">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Item is Locked</h4>
                  <p className="text-sm text-blue-700 mt-0.5 font-medium">
                    Tap to enter passphrase and view data.
                  </p>
                </div>
              </div>
              <Unlock className="w-5 h-5 text-blue-500 group-hover:text-blue-700" />
            </div>
          )}

          {!isLocked && !canDecrypt && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-5 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-orange-900">Restricted Access</h4>
                <p className="text-sm text-orange-700 mt-1 leading-relaxed font-medium">
                  You have view-only permissions.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5">
            {item.url && (
              <div className="group">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      readOnly 
                      value={item.url} 
                      className="w-full pl-4 pr-12 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-blue-600 font-semibold focus:outline-none cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all"
                      onClick={() => window.open(item.url!, '_blank')}
                    />
                    <ExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <button
                    onClick={() => copyToClipboard(item.url!, 'URL')}
                    className="px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-all"
                  >
                    {copiedField === 'URL' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {item.username_ct && (
              <ReadOnlyField
                label="Username"
                icon={User}
                value={isFieldDecrypted('username') ? decryptedData!.username! : 'Tap to unlock'}
                isSecret={true}
                isDecrypted={isFieldDecrypted('username')}
                onCopy={() => copyToClipboard(decryptedData?.username || '', 'username')}
                onCopyEncrypted={() => copyEncrypted(item.username_ct!, 'username_enc')}
                copyStatus={copiedField === 'username'}
                encryptedCopyStatus={copiedField === 'username_enc'}
              />
            )}

            {item.password_ct && (
              <ReadOnlyField
                label="Password"
                icon={Lock}
                value={isFieldDecrypted('password') ? decryptedData!.password! : '••••••••••••••••'}
                isSecret={true}
                isDecrypted={isFieldDecrypted('password')}
                onCopy={() => copyToClipboard(decryptedData?.password || '', 'password')}
                onCopyEncrypted={() => copyEncrypted(item.password_ct!, 'password_enc')}
                copyStatus={copiedField === 'password'}
                encryptedCopyStatus={copiedField === 'password_enc'}
              />
            )}

            {item.totp_seed_ct && (
              <ReadOnlyField
                label="TOTP Secret"
                icon={Shield}
                value={isFieldDecrypted('totp_seed') ? decryptedData!.totp_seed! : '•••• •••• •••• ••••'}
                isSecret={true}
                isDecrypted={isFieldDecrypted('totp_seed')}
                onCopy={() => copyToClipboard(decryptedData?.totp_seed || '', 'TOTP Secret')}
                onCopyEncrypted={() => copyEncrypted(item.totp_seed_ct!, 'totp_enc')}
                copyStatus={copiedField === 'TOTP Secret'}
                encryptedCopyStatus={copiedField === 'totp_enc'}
              />
            )}
            
            {item.note_ct && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Secure Note
                  </label>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyEncrypted(item.note_ct!, 'note_enc')}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-bold border-2 ${
                        copiedField === 'note_enc' 
                          ? 'bg-green-100 text-green-700 border-green-300' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-300'
                      }`}
                    >
                        {copiedField === 'note_enc' ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        {copiedField === 'note_enc' ? 'Copied' : 'Copy Encrypted'}
                    </button>

                    {isFieldDecrypted('note') && (
                      <button
                        onClick={() => copyToClipboard(decryptedData!.note!, 'Note')}
                        className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 transition-all ${
                          copiedField === 'Note' ? 'text-green-700 bg-green-100 border-green-300' : 'text-blue-600 hover:text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        {copiedField === 'Note' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedField === 'Note' ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>

                <div 
                  className={`
                    w-full p-5 rounded-lg border-2 text-sm leading-relaxed transition-all min-h-30 whitespace-pre-wrap font-medium
                    ${isFieldDecrypted('note') 
                      ? 'bg-yellow-50 border-yellow-300 text-gray-800' 
                      : 'bg-gray-50 border-gray-300 text-gray-400 flex items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600'}
                  `}
                  onClick={() => {
                    if (!isFieldDecrypted('note') && onUnlock) {
                      onUnlock();
                    }
                  }}
                >
                  {isFieldDecrypted('note') ? (
                     decryptedData!.note
                  ) : (
                    <div className="text-center">
                      <Lock className="w-7 h-7 mx-auto mb-2 opacity-50" />
                      <p className="font-bold">
                        Tap to decrypt note
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t-2 border-gray-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="text-xs text-gray-500 font-mono font-semibold">
            ID: <span className="select-all">{item.id.substring(0, 8)}...</span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm flex-1 sm:flex-none"
            >
              Close
            </button>
            
            {/* UNLOCK BUTTON - Shows ONLY when locked */}
            {isLocked && onUnlock && (
               <button
                onClick={onUnlock}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 flex-1 sm:flex-none"
               >
                 <Unlock className="w-4 h-4" />
                 Unlock
               </button>
            )}
            
            {/* DELETE BUTTON - Shows ONLY when unlocked and permissions allowed */}
            {!isLocked && canEdit && onDelete && (
              <button
                onClick={onDelete}
                className="px-5 py-2.5 bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100 hover:border-red-200 text-sm font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 flex-1 sm:flex-none"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}

            {/* EDIT BUTTON - Shows ONLY when unlocked */}
            {!isLocked && canEdit && onEdit && (
              <button 
                onClick={onEdit}
                className="px-5 py-2.5 bg-gray-900 border-2 border-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 shadow-sm transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};