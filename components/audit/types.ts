export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  item: string;
  date: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string | null;
  org_name: string | null;
}

export interface FilterState {
  action: string;
  subject_type: string;
  date: string;
}
