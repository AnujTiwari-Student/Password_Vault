import React, { createContext, useContext, useState } from 'react';

interface OrganizationContextType {
  currentOrgId: string | null;
  setCurrentOrgId: (id: string | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode; initialOrgId: string }> = ({ 
  children, 
  initialOrgId 
}) => {
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(initialOrgId);

  return (
    <OrganizationContext.Provider value={{ currentOrgId, setCurrentOrgId }}>
      {children}
    </OrganizationContext.Provider>
  );
};