// types/ItemTypes.ts
export interface BaseItemData {
  id: string;
  name: string;
  tags?: string[];
  updated_at?: string;
}

export interface LoginItem extends BaseItemData {
  type: 'Login';
  url?: string;
  username_ct?: string;
  password_ct?: string;
  totp_seed_ct?: string;
}

export interface TOTPItem extends BaseItemData {
  type: 'TOTP';
  totp_seed_ct: string;
}

export interface SecureNoteItem extends BaseItemData {
  type: 'Secure Note';
  note_ct: string;
}

export type VaultItem = LoginItem | TOTPItem | SecureNoteItem;
