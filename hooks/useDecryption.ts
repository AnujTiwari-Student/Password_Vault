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


      const itemKey = await unwrapKey(itemKeyWrapped as string, ovkCryptoKey);
      
      const decrypted: DecryptedData = {};


      if ('username_ct' in item && item.username_ct) {
        try {
          decrypted.username = await decryptData(item.username_ct as string, itemKey);
        } catch (error) {
          console.error('Failed to decrypt username:', error);
        }
      }


      if ('password_ct' in item && item.password_ct) {
        try {
          decrypted.password = await decryptData(item.password_ct as string, itemKey);
        } catch (error) {
          console.error('Failed to decrypt password:', error);
        }
      }


      if ('totp_seed_ct' in item && item.totp_seed_ct) {
        try {
          decrypted.totp_seed = await decryptData(item.totp_seed_ct as string, itemKey);
        } catch (error) {
          console.error('Failed to decrypt TOTP seed:', error);
        }
      }


      if ('note_ct' in item && item.note_ct) {
        try {
          decrypted.note = await decryptData(item.note_ct as string, itemKey);
        } catch (error) {
          console.error('Failed to decrypt note:', error);
        }
      }


      setDecryptedItems(prev => ({ ...prev, [item.id]: decrypted }));
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
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
