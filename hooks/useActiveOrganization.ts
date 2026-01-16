// useActiveOrganization.ts
// Custom hook to manage and track the currently active organization

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Organization {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created_at: string;
  isOwner: boolean;
  vault?: {
    id: string;
    name: string;
    type: string;
  };
}

interface UseActiveOrganizationReturn {
  activeOrgId: string | null;
  activeOrg: Organization | null;
  isPersonalWorkspace: boolean;
  isLoading: boolean;
}

/**
 * Hook to get the currently active organization from URL and listen to changes
 * This ensures that all components use the same active organization
 */
export function useActiveOrganization(): UseActiveOrganizationReturn {
  const searchParams = useSearchParams();
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get orgId from URL
  useEffect(() => {
    const orgIdFromUrl = searchParams.get('org');
    setActiveOrgId(orgIdFromUrl);
    
    if (!orgIdFromUrl) {
      setActiveOrg(null);
      setIsLoading(false);
    }
  }, [searchParams]);

  // Listen for organization changes from TeamSwitcher
  useEffect(() => {
    const handleOrgChange = (event: CustomEvent) => {
      const { organization, orgId, isPersonalWorkspace } = event.detail;
      
      if (isPersonalWorkspace) {
        setActiveOrgId(null);
        setActiveOrg(null);
      } else {
        setActiveOrgId(orgId);
        setActiveOrg(organization);
      }
      
      setIsLoading(false);
    };

    window.addEventListener('organizationChanged', handleOrgChange as EventListener);
    
    // Initial load complete
    setIsLoading(false);
    
    return () => {
      window.removeEventListener('organizationChanged', handleOrgChange as EventListener);
    };
  }, []);

  return {
    activeOrgId,
    activeOrg,
    isPersonalWorkspace: activeOrgId === null,
    isLoading,
  };
}