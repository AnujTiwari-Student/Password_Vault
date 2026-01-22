import React from 'react';
import { Loader2 } from 'lucide-react';
import { APIVaultItem, DecryptedData } from '@/types/vault';
import { ItemField } from './ItemField';
import { UnlockPrompt } from './UnlockPrompt';

interface ItemContentProps {
  item: APIVaultItem;
  showPassword: boolean;
  showTotp: boolean;
  masterPassphrase: string | null;
  decryptedData: DecryptedData | null;
  isCurrentlyDecrypting: boolean;
  isPending: boolean;
  onTogglePassword: () => void;
  onToggleTotp: () => void;
  onCopySensitive: (field: 'username' | 'password' | 'totp_seed') => void;
  onViewSensitive: () => void;
  onUnlockItem: () => void;
}

export const ItemContent: React.FC<ItemContentProps> = ({
  item,
  showPassword,
  showTotp,
  masterPassphrase,
  decryptedData,
  isCurrentlyDecrypting,
  isPending,
  onTogglePassword,
  onToggleTotp,
  onCopySensitive,
  onViewSensitive,
  onUnlockItem,
}) => {
  return (
    <div className="space-y-5 py-2">
      {!masterPassphrase && (
        <UnlockPrompt
          onUnlock={onUnlockItem}
          isDecrypting={isCurrentlyDecrypting}
        />
      )}

      {isCurrentlyDecrypting && (
        <div className="flex items-center gap-3 text-blue-700 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 shadow-sm animate-in fade-in zoom-in-95">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Decrypting item data...</span>
        </div>
      )}

      <ItemField
        label="Type"
        value={item.type.map((type, idx) => (
          <span
            key={idx}
            className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 uppercase tracking-wide"
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        ))}
        isArray
      />

      {item.url && (
        <ItemField
          label="Website"
          value={item.url}
          copyable
          isDisabled={isPending}
        />
      )}

      {item.username_ct && (
        <ItemField
          label="Username"
          value={decryptedData?.username ?? ''}
          isEncrypted
          decrypted={!!decryptedData}
          onCopy={() => onCopySensitive('username')}
          isDisabled={isCurrentlyDecrypting || !decryptedData || isPending}
        />
      )}

      {item.password_ct && (
        <ItemField
          label="Password"
          value={decryptedData?.password ?? ''}
          isEncrypted
          isPassword
          showPassword={showPassword}
          decrypted={!!decryptedData}
          onToggle={onTogglePassword}
          onCopy={() => onCopySensitive('password')}
          isDisabled={isCurrentlyDecrypting || isPending}
          copyDisabled={!decryptedData}
        />
      )}

      {item.totp_seed_ct && (
        <ItemField
          label="TOTP Code"
          value={decryptedData?.totp_seed ?? ''}
          isEncrypted
          isTotp
          showTotp={showTotp}
          decrypted={!!decryptedData}
          onToggle={onToggleTotp}
          onCopy={() => onCopySensitive('totp_seed')}
          isDisabled={isCurrentlyDecrypting || isPending}
          copyDisabled={!decryptedData}
        />
      )}

      {item.note_ct && (
        <ItemField
          label="Note"
          value={decryptedData?.note ?? ''}
          isEncrypted
          isNote
          decrypted={!!decryptedData}
          onViewSensitive={onViewSensitive}
          isDisabled={isCurrentlyDecrypting || isPending}
        />
      )}

      {item.tags && item.tags.length > 0 && (
        <ItemField
          label="Tags"
          value={item.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600"
            >
              #{tag}
            </span>
          ))}
          isArray
        />
      )}

      <div className="pt-5 mt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400 font-medium">
          Last updated: {new Date(item.updated_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
};