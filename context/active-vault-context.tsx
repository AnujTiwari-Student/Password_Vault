"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface VaultContextType {
  currentVaultId: string | null;
  setCurrentVaultId: (id: string | null) => void;
  currentOrgId: string | null;
  setCurrentOrgId: (id: string | null) => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [currentVaultId, setCurrentVaultId] = useState<string | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  useEffect(() => {
    const orgId = searchParams.get('org');
    setCurrentOrgId(orgId);
  }, [searchParams]);

  useEffect(() => {
    const handleOrgChange = (event: CustomEvent) => {
      const { orgId, isPersonalWorkspace } = event.detail;
      setCurrentOrgId(isPersonalWorkspace ? null : orgId);
      setCurrentVaultId(null);
    };

    window.addEventListener('organizationChanged', handleOrgChange as EventListener);
    return () => {
      window.removeEventListener('organizationChanged', handleOrgChange as EventListener);
    };
  }, []);

  return (
    <VaultContext.Provider value={{ currentVaultId, setCurrentVaultId, currentOrgId, setCurrentOrgId }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
