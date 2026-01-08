export const ITEMS_PER_PAGE = 10;

export const SEVERITY_MAP: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
  LOGIN_FAILED: 'medium',
  PASSWORD_CHANGED: 'high',
  EMAIL_CHANGED: 'high',
  ACCOUNT_LOCKED: 'critical',
  SUSPICIOUS_ACTIVITY: 'critical',
  VAULT_ACCESSED: 'medium',
  ITEM_DELETED: 'high',
  MEMBER_REMOVED: 'high',
  PERMISSION_CHANGED: 'medium',
  ITEM_CREATED: 'low',
  ITEM_VIEWED: 'low',
  ITEM_SHARED: 'medium',
  PERSONAL_SETUP: 'low',
  STORE_PRIVATE_KEY: 'medium',
  ORG_CREATED: 'high',
  ORG_VIEWED: 'low',
  ORG_UPDATED: 'medium',
  ORG_DELETED: 'critical',
  MEMBER_ADDED: 'medium',
  MEMBER_INVITED: 'low',
  MEMBER_ROLE_CHANGED: 'high',
  VAULT_CREATED: 'medium',
  VAULT_SHARED: 'medium',
  UMK_SETUP: 'high',
  OVK_SETUP: 'high',
  INVITE_SENT: 'low',
  INVITE_ACCEPTED: 'medium',
  INVITE_REVOKED: 'medium',
};

export const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-900 text-green-300',
  medium: 'bg-blue-900 text-blue-300',
  high: 'bg-yellow-900 text-yellow-300',
  critical: 'bg-red-900 text-red-300',
};
