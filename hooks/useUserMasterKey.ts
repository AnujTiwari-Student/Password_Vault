import { useState, useEffect } from "react";
import { bufferToBase64, deriveUMKData, unwrapKey } from "@/utils/client-crypto";

export function useUserMasterKey(mnemonic: string | null) {
  const [umkCryptoKey, setUmkCryptoKey] = useState<CryptoKey | null>(null);
  const [privateKeyBase64, setPrivateKeyBase64] = useState<string | null>(null);

  useEffect(() => {
    if (!mnemonic) {
      setUmkCryptoKey(null);
      setPrivateKeyBase64(null);
      return;
    }

    async function derive() {
      try {
        const response = await fetch('/api/user/umk-salt');
        if (!response.ok) throw new Error('Failed to fetch UMK salt');
        
        const { umk_salt, wrapped_private_key } = await response.json();
        
        const { umkCryptoKey } = await deriveUMKData(mnemonic!, umk_salt);
        setUmkCryptoKey(umkCryptoKey);

        if (wrapped_private_key) {
          const privateKeyCrypto = await unwrapKey(wrapped_private_key, umkCryptoKey);
          
          const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", privateKeyCrypto);
          const privateKeyBase64 = bufferToBase64(privateKeyBuffer);
          setPrivateKeyBase64(privateKeyBase64);
        }

      } catch {
        setUmkCryptoKey(null);
        setPrivateKeyBase64(null);
      }
    }

    derive();
  }, [mnemonic]);

  return { umkCryptoKey, privateKeyBase64 };
}