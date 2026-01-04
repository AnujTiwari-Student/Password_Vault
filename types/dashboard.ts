

export interface DashboardStats {
  totalItems: number;
  sharedVaults: number;
  teamsJoined: number;
  securityScore: number;
  vaultType: 'personal' | 'org';
}

export interface RecentActivity {
  id: string;
  action: string;
  item: string;
  time: string;
  user: string;
  timestamp: Date;
  type: 'personal' | 'org';
}


export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  item: string;
  date: string;
}

export type DashboardTab = 
  | 'Dashboard'
  | 'Items'
  | 'Org Items'
  | 'Audits'
  | 'Security'
  | 'Settings'
  | 'Members'
  | 'Manage'
  | 'Active';
