export type MemberRole = "owner" | "admin" | "member" | "viewer";

export interface Membership {
  id: string;
  org_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
  updated_at: string;
}

export type ItemType = "login" | "note" | "totp";

export type VaultType = "personal" | "org";

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;

  org?: {
    id: string;
    owner_user_id: string;
  } | null;

  member?: Membership | Membership[];

  vault?: {
    id: string;
    type: "personal" | "org";
  } | null;
}


export interface Vault {
  id: string;
  name: string;
  type: "personal" | "org";
  user_id?: string;
  org_id?: string;
  // Add other vault properties
}

export interface VaultPermissions {
  canView: boolean;
  canEdit: boolean;
  canDecrypt: boolean;
  canManage: boolean;
  canShare: boolean;
}



export interface APIVaultItem {
  id: string;
  vault_id: string; // ✅ ADD THIS
  name: string;
  type: string[];

  url?: string | null;

  username_ct?: string | null;
  password_ct?: string | null;
  totp_seed_ct?: string | null;
  note_ct?: string | null;

  tags?: string[];

  created_at: string;
  updated_at: string;
}



export interface DecryptedData {
  username?: string;
  password?: string;
  totp_seed?: string;
  note?: string;
}

export interface DecryptedItemData {
  username?: string;
  password?: string;
  totp_seed?: string;
  note?: string;
}


export function isValidDecryptedData(data: unknown): data is DecryptedItemData {
  if (!data || typeof data !== 'object') return false;
  
  const d = data as Record<string, unknown>;
  
  const validKeys = ['username', 'password', 'totp_seed', 'note'];
  
  return Object.keys(d).every(key => {
    if (!validKeys.includes(key)) return false;
    return typeof d[key] === 'string' || d[key] === undefined;
  });
}

