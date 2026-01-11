import { useState, useCallback, useEffect } from 'react';
import { unwrapKey, decryptData } from '@/utils/client-crypto';
import { APIVaultItem, DecryptedData } from '@/types/vault';
import { useSessionTimeout } from './useSessionTimeout';

export function useDecryption(ovkCryptoKey: CryptoKey | null) {
  const [decryptedItems, setDecryptedItems] = useState<Record<string, DecryptedData>>({});
  const [decrypting, setDecrypting] = useState<Record<string, boolean>>({});
  const { isActive } = useSessionTimeout();

  useEffect(() => {
    if (!isActive) {
      setDecryptedItems({});
    }
  }, [isActive]);

  const decryptItem = useCallback(async (item: APIVaultItem): Promise<DecryptedData | null> => {
    const itemKeyWrapped = 'item_key_wrapped' in item ? item.item_key_wrapped : null;
    
    if (!ovkCryptoKey || !itemKeyWrapped) {
      return null;
    }

    try {
      setDecrypting(prev => ({ ...prev, [item.id]: true }));

      let itemKey: CryptoKey;
      try {
        itemKey = await unwrapKey(itemKeyWrapped as string, ovkCryptoKey);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('atob') || error.message.includes('decode')) {
            throw new Error('This item was created with an older version and cannot be decrypted. Please delete and recreate it.');
          }
          if (error.message.includes('OperationError') || error.message.includes('decrypt')) {
            throw new Error('Wrong passphrase - unable to decrypt item key');
          }
        }
        throw new Error('Failed to decrypt item - invalid passphrase or corrupted data');
      }
      
      const decrypted: DecryptedData = {};
      let hasDecryptedData = false;
      const errors: string[] = [];

      if ('username_ct' in item && item.username_ct) {
        try {
          decrypted.username = await decryptData(item.username_ct as string, itemKey);
          hasDecryptedData = true;
        } catch (error) {
          errors.push('username');
        }
      }

      if ('password_ct' in item && item.password_ct) {
        try {
          decrypted.password = await decryptData(item.password_ct as string, itemKey);
          hasDecryptedData = true;
        } catch (error) {
          errors.push('password');
        }
      }

      if ('totp_seed_ct' in item && item.totp_seed_ct) {
        try {
          decrypted.totp_seed = await decryptData(item.totp_seed_ct as string, itemKey);
          hasDecryptedData = true;
        } catch (error) {
          errors.push('TOTP seed');
        }
      }

      if ('note_ct' in item && item.note_ct) {
        try {
          decrypted.note = await decryptData(item.note_ct as string, itemKey);
          hasDecryptedData = true;
        } catch (error) {
          errors.push('note');
        }
      }

      if (!hasDecryptedData) {
        if (errors.length > 0) {
          throw new Error(`Failed to decrypt fields: ${errors.join(', ')}. Item may be corrupted.`);
        }
        throw new Error('No encrypted data found in item');
      }

      setDecryptedItems(prev => ({ ...prev, [item.id]: decrypted }));
      
      return decrypted;
    } catch (error) {
      setDecryptedItems(prev => {
        const updated = { ...prev };
        delete updated[item.id];
        return updated;
      });
      throw error;
    } finally {
      setDecrypting(prev => ({ ...prev, [item.id]: false }));
    }
  }, [ovkCryptoKey]);

  const getDecryptedItem = useCallback((itemId: string): DecryptedData | null => {
    return decryptedItems[itemId] || null;
  }, [decryptedItems]);

  const isDecrypting = useCallback((itemId: string): boolean => {
    return decrypting[itemId] || false;
  }, [decrypting]);

  const clearDecryptedData = useCallback(() => {
    setDecryptedItems({});
  }, []);

  return {
    decryptItem,
    getDecryptedItem,
    isDecrypting,
    decryptedItems,
    clearDecryptedData,
  };
}