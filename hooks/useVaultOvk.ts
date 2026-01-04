import axios, { AxiosError } from 'axios';
import { unwrapKey } from '@/utils/client-crypto';
import { useState, useEffect } from 'react';

type VaultType = 'org' | 'personal' | undefined;

interface OrgVaultResponse {
  ovk_wrapped_for_user: string;
  org_id: string;
}

interface PersonalVaultResponse {
  ovk_cipher: string;
}

export function useVaultOVK(
  umkCryptoKey: CryptoKey | null,
  id: string | null,
  vaultType: VaultType,
  privateKeyBase64?: string | null,
  orgId?: string | null
) {
  const [ovkCryptoKey, setOvkCryptoKey] = useState<CryptoKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state if required params are missing
    if (!id || !umkCryptoKey || !vaultType) {
      setOvkCryptoKey(null);
      setError(null);
      return;
    }

    async function fetchAndUnwrap(): Promise<void> {
      try {
        setError(null);

        if (vaultType === 'org') {
          // Validate required params for org vault
          if (!privateKeyBase64) {
            throw new Error('Private key required for org vault');
          }

          if (!orgId) {
            throw new Error('Organization ID required for org vault');
          }

          console.log('🔐 Fetching org vault OVK:', { vaultId: id, orgId });

          const response = await axios.get<OrgVaultResponse>(`/api/vaults/org`, {
            params: { id, org_id: orgId },
          });

          const { ovk_wrapped_for_user, org_id: responseOrgId } = response.data;
          
          if (!ovk_wrapped_for_user) {
            throw new Error('OVK wrapped for user missing in response');
          }

          // Just log a warning instead of throwing error
          if (responseOrgId !== orgId) {
            console.warn('⚠️ Org ID mismatch - Expected:', orgId, 'Got:', responseOrgId);
          }

          console.log('🔓 Unwrapping org vault OVK...');
          const unwrappedKey = await unwrapKey(ovk_wrapped_for_user, privateKeyBase64);
          setOvkCryptoKey(unwrappedKey);
          console.log('✅ Org vault OVK unwrapped successfully');

        } else if (vaultType === 'personal') {
          console.log('🔐 Fetching personal vault OVK:', { vaultId: id });

          const response = await axios.get<PersonalVaultResponse>(`/api/vaults/personal`, {
            params: { id },
          });

          const { ovk_cipher } = response.data;
          if (!ovk_cipher) {
            throw new Error('OVK cipher missing in response');
          }

          console.log('🔓 Unwrapping personal vault OVK...');
          const unwrappedKey = await unwrapKey(ovk_cipher, umkCryptoKey!);
          setOvkCryptoKey(unwrappedKey);
          console.log('✅ Personal vault OVK unwrapped successfully');
        } else {
          throw new Error(`Invalid vault type: ${vaultType}`);
        }

      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<{
            error?: string;
            message?: string;
            status?: number;
          }>;
          
          const errorMsg = 
            axiosError.response?.data?.error || 
            axiosError.response?.data?.message || 
            axiosError.message ||
            'No error message from server';
          
          const statusCode = axiosError.response?.status;
          
          setError(errorMsg);
          console.error(
            `❌ Failed to fetch OVK (${statusCode || 'unknown'}):`,
            errorMsg,
            {
              vaultId: id,
              vaultType,
              orgId,
              hasPrivateKey: !!privateKeyBase64,
              hasUmk: !!umkCryptoKey
            }
          );
        } else {
          const err = error as Error;
          setError(err.message);
          console.error(`❌ Error during OVK unwrapping:`, err.message, err);
        }
        setOvkCryptoKey(null);
      }
    }

    fetchAndUnwrap();
  }, [id, vaultType, umkCryptoKey, privateKeyBase64, orgId]);

  return { ovkCryptoKey, error };
}
