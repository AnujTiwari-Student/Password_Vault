import { DashboardTab } from '@/types/dashboard';

export interface TabConfig {
  id: DashboardTab;
  label: string;
  icon?: string;
  requiresOrg?: boolean;
  requiresVault?: boolean;
}

export const DASHBOARD_TABS: TabConfig[] = [
  { id: 'Dashboard', label: 'Dashboard' },
  { id: 'Items', label: 'My Items', requiresVault: true },
  { id: 'Org Items', label: 'Organization Items', requiresOrg: true },
  { id: 'Audits', label: 'Audit Logs' },
  { id: 'Security', label: 'Security Center' },
  { id: 'Settings', label: 'Vault Settings', requiresVault: true },
  { id: 'Members', label: 'Team Members', requiresVault: true },
  { id: 'Manage', label: 'Organization', requiresOrg: true },
  { id: 'Active', label: 'Notifications' },
];
