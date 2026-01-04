import { MemberRole } from '@/types/vault';

export type Permission = 'view' | 'edit' | 'share' | 'manage' | 'decrypt';

export const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  owner: ['view', 'edit', 'share', 'manage', 'decrypt'],
  admin: ['view', 'edit', 'share', 'manage', 'decrypt'],
  member: ['view', 'decrypt', 'share'],
  viewer: ['view', 'decrypt'],
} as const;

export const ROLE_HIERARCHY: Record<MemberRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
} as const;

export const ROLE_COLORS = {
  owner: 'bg-yellow-900/30 text-yellow-300 border-yellow-700/30',
  admin: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
  member: 'bg-green-900/30 text-green-300 border-green-700/30',
  viewer: 'bg-gray-900/30 text-gray-300 border-gray-700/30',
} as const;

export const ITEM_TYPE_COLORS = {
  login: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
  note: 'bg-purple-900/30 text-purple-300 border-purple-700/30',
  totp: 'bg-green-900/30 text-green-300 border-green-700/30',
  default: 'bg-gray-900/30 text-gray-300 border-gray-700/30',
} as const;
