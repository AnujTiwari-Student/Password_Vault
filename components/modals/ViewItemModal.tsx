"use client"

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy, Edit2, Trash2, Globe, FileText, Shield, Lock, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { APIVaultItem } from '@/types/vault';
import { MasterPassphraseModal } from './PassphraseModal';
import { useUserMasterKey } from '@/hooks/useUserMasterKey';
import { useVaultOVK } from '@/hooks/useVaultOvk';
import { useDecryption } from '@/hooks/useDecryption';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface ViewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: APIVaultItem | null;
  canEdit: boolean;
  vaultType: 'personal' | 'org';
  orgId?: string | null;
  onDelete?: (itemId: string) => void;
  onEdit?: (item: APIVaultItem) => void;
}

export const ViewItemModal: React.FC<ViewItemModalProps> = ({
  isOpen,
  onClose,
  item,
  canEdit,
  vaultType,
  orgId,
  onDelete,
  onEdit
}) => {
  const user = useCurrentUser();
  const [showPassword, setShowPassword] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  const [showMasterPassphraseModal, setShowMasterPassphraseModal] = useState(false);
  const [masterPassphrase, setMasterPassphrase] = useState<string | null>(null);

  const vaultId = vaultType === 'personal' 
    ? user?.vault?.id 
    : item?.vault_id || null;

  const { umkCryptoKey, privateKeyBase64 } = useUserMasterKey(masterPassphrase);
  const { ovkCryptoKey } = useVaultOVK(
    umkCryptoKey,
    vaultId as string,
    vaultType,
    privateKeyBase64,
    orgId
  );
  const { decryptItem, getDecryptedItem, isDecrypting } = useDecryption(ovkCryptoKey);

  const decryptedData = item ? getDecryptedItem(item.id) : null;
  const isCurrentlyDecrypting = item ? isDecrypting(item.id) : false;

  // Auto-decrypt when OVK is ready and we have a passphrase
  useEffect(() => {
    if (item && ovkCryptoKey && masterPassphrase && !decryptedData && !isCurrentlyDecrypting) {
      console.log('🔓 Auto-decrypting item...');
      decryptItem(item);
    }
  }, [item, ovkCryptoKey, masterPassphrase, decryptedData, isCurrentlyDecrypting, decryptItem]);

  if (!item) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getTypeIcon = () => {
    if (item.type.includes('login')) return <Globe className="w-5 h-5 text-blue-400" />;
    if (item.type.includes('totp')) return <Shield className="w-5 h-5 text-green-400" />;
    if (item.type.includes('note')) return <FileText className="w-5 h-5 text-purple-400" />;
    return null;
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this item?')) {
      onDelete?.(item.id);
      onClose();
    }
  };

  const handleVerifyPassphrase = async (passphrase: string): Promise<boolean> => {
    try {
      console.log('✅ Passphrase received, setting up decryption...');
      setMasterPassphrase(passphrase);
      return true;
    } catch (error: unknown) {
      console.error('❌ Passphrase verification error:', error);
      throw error;
    }
  };

  const handleViewSensitive = () => {
    if (!masterPassphrase) {
      setShowMasterPassphraseModal(true);
    }
  };

  const handleCopySensitive = (field: 'username' | 'password' | 'totp_seed') => {
    if (!decryptedData) {
      setShowMasterPassphraseModal(true);
      return;
    }

    const value = decryptedData[field];
    if (value) {
      copyToClipboard(value, field === 'totp_seed' ? 'TOTP' : field.charAt(0).toUpperCase() + field.slice(1));
    } else {
      toast.error('No data to copy');
    }
  };

  const handleModalClose = () => {
    setShowPassword(false);
    setShowTotp(false);
    setMasterPassphrase(null);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleModalClose}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-700/50 rounded-lg">
                  {getTypeIcon()}
                </div>
                <div>
                  <DialogTitle className="text-white text-xl">{item.name}</DialogTitle>
                  {item.url && (
                    <DialogDescription className="text-gray-400">
                      {item.url}
                    </DialogDescription>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            {/* Decryption Status */}
            {!masterPassphrase && (
              <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <p className="text-blue-300 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Enter your master passphrase to decrypt and view this item
                </p>
                <button
                  onClick={() => setShowMasterPassphraseModal(true)}
                  className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  Unlock Item
                </button>
              </div>
            )}

            {isCurrentlyDecrypting && (
              <div className="p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                <p className="text-purple-300 text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Decrypting item data...
                </p>
              </div>
            )}

            {/* Types */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
              <div className="flex flex-wrap gap-2">
                {item.type.map((type, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300"
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                ))}
              </div>
            </div>

            {/* URL (for login) */}
            {item.url && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Website</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.url}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(item.url!, 'URL')}
                    className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Username (encrypted) */}
            {item.username_ct && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={decryptedData?.username || "••••••••••••••"}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white"
                  />
                  <button
                    onClick={handleViewSensitive}
                    className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    disabled={isCurrentlyDecrypting}
                  >
                    {decryptedData ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleCopySensitive('username')}
                    className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    disabled={isCurrentlyDecrypting || !decryptedData}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Password (encrypted) */}
            {item.password_ct && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showPassword && decryptedData ? 'text' : 'password'}
                    value={decryptedData?.password || "••••••••••••••"}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white"
                  />
                  <button
                    onClick={() => {
                      if (decryptedData) {
                        setShowPassword(!showPassword);
                      } else {
                        handleViewSensitive();
                      }
                    }}
                    className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    disabled={isCurrentlyDecrypting}
                  >
                    {decryptedData ? (
                      showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleCopySensitive('password')}
                    className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    disabled={isCurrentlyDecrypting || !decryptedData}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TOTP (encrypted) */}
            {item.totp_seed_ct && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">TOTP Code</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showTotp && decryptedData ? 'text' : 'password'}
                    value={decryptedData?.totp_seed || "••••••"}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white font-mono text-xl tracking-wider"
                  />
                  <button
                    onClick={() => {
                      if (decryptedData) {
                        setShowTotp(!showTotp);
                      } else {
                        handleViewSensitive();
                      }
                    }}
                    className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    disabled={isCurrentlyDecrypting}
                  >
                    {decryptedData ? (
                      showTotp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleCopySensitive('totp_seed')}
                    className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    disabled={isCurrentlyDecrypting || !decryptedData}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Note (encrypted) */}
            {item.note_ct && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Note</label>
                <div className="relative">
                  <textarea
                    value={decryptedData?.note || "••••••••••••••"}
                    readOnly
                    rows={4}
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white resize-none"
                  />
                  {!decryptedData && (
                    <button
                      onClick={handleViewSensitive}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      disabled={isCurrentlyDecrypting}
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                Last updated: {new Date(item.updated_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={() => {
                  onEdit?.(item);
                  toast.info('Edit feature coming soon');
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Master Passphrase Modal */}
      <MasterPassphraseModal
        isOpen={showMasterPassphraseModal}
        onClose={() => setShowMasterPassphraseModal(false)}
        onVerify={handleVerifyPassphrase}
        title="Decrypt Item"
        description="Enter your master passphrase to decrypt and view this item's sensitive data"
      />
    </>
  );
};
