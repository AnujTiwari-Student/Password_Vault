// utils/vault-helpers.ts

import {
  MemberRole,
  User,
  Vault,
  Membership,
  VaultPermissions,
} from "@/types/vault";
import { Permission, ROLE_PERMISSIONS } from "@/constants/permission";

/* ---------------------------------- */
/* Shared helper type                  */
/* ---------------------------------- */
export type UserWithMemberships = User & {
  member?: Membership | Membership[];
};

/* ---------------------------------- */
/* Helpers                             */
/* ---------------------------------- */
function normalizeMemberships(
  member?: Membership | Membership[]
): Membership[] {
  if (!member) return [];
  return Array.isArray(member) ? member : [member];
}

/* ---------------------------------- */
/* ⏱️ Session helper (FIX)             */
/* ---------------------------------- */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "00:00";

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

/* ---------------------------------- */
/* Membership helpers                  */
/* ---------------------------------- */
export function getMembershipForOrg(
  user: UserWithMemberships | null,
  orgId: string
): Membership | null {
  if (!user) return null;

  const memberships = normalizeMemberships(user.member);
  return memberships.find((m) => m.org_id === orgId) ?? null;
}

/* ---------------------------------- */
/* Vault Role                          */
/* ---------------------------------- */
export function getUserRoleInVault(
  user: UserWithMemberships | null,
  vault: Vault | null
): MemberRole | null {
  if (!user || !vault) return null;

  if (vault.type === "personal") {
    return vault.user_id === user.id ? "owner" : null;
  }

  if (vault.type === "org" && vault.org_id) {
    const membership = getMembershipForOrg(user, vault.org_id);
    if (membership) return membership.role;

    if (
      user.org?.owner_user_id === user.id &&
      user.org.id === vault.org_id
    ) {
      return "owner";
    }
  }

  return null;
}

/* ---------------------------------- */
/* Permission checks                   */
/* ---------------------------------- */
function hasPermission(
  role: MemberRole | null,
  permission: Permission
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const canUserDecrypt = (role: MemberRole | null) =>
  hasPermission(role, "decrypt");

export const canUserEdit = (role: MemberRole | null) =>
  hasPermission(role, "edit");

export const canUserManage = (role: MemberRole | null) =>
  hasPermission(role, "manage");

export const canUserShare = (role: MemberRole | null) =>
  hasPermission(role, "share");

export function getUserPermissions(
  role: MemberRole | null
): VaultPermissions {
  return {
    canView: hasPermission(role, "view"),
    canEdit: hasPermission(role, "edit"),
    canDecrypt: hasPermission(role, "decrypt"),
    canManage: hasPermission(role, "manage"),
    canShare: hasPermission(role, "share"),
  };
}

/* ---------------------------------- */
/* Org / Admin helpers                 */
/* ---------------------------------- */
export function isAdmin(user: UserWithMemberships | null): boolean {
  if (!user) return false;

  if (user.org?.owner_user_id === user.id) return true;

  return normalizeMemberships(user.member).some(
    (m) => m.role === "admin" || m.role === "owner"
  );
}

export function isOrgOwner(user: User | null): boolean {
  if (!user) return false;
  return user.org?.owner_user_id === user.id;
}

export function getUserOrgRole(
  user: UserWithMemberships | null,
  orgId: string
): MemberRole | null {
  if (!user) return null;

  const membership = normalizeMemberships(user.member).find(
    (m) => m.org_id === orgId
  );

  return membership?.role ?? null;
}

export function canCreateOrg(user: UserWithMemberships | null): boolean {
  return isAdmin(user) || isOrgOwner(user);
}

export function canManageMembers(
  user: UserWithMemberships | null,
  orgId: string
): boolean {
  const role = getUserOrgRole(user, orgId);
  return role === "owner" || role === "admin";
}

/* ---------------------------------- */
/* ⏱️ Time formatting                  */
/* ---------------------------------- */
export function formatTimestamp(
  timestamp: string | Date
): string {
  if (!timestamp) return "N/A";
  
  const date = typeof timestamp === "string"
    ? new Date(timestamp)
    : timestamp;

  // Check for invalid date
  if (isNaN(date.getTime())) return "Invalid Date";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------------------------------- */
/* 🎨 UI helpers (Updated for Light Mode) */
/* ---------------------------------- */
export function getRoleBadgeColor(
  role: MemberRole | null | undefined
): string {
  switch (role) {
    case "owner":
      // Gold/Amber for Owner
      return "bg-amber-50 text-amber-700 border-amber-200 border";
    case "admin":
      // Blue for Admin
      return "bg-blue-50 text-blue-700 border-blue-200 border";
    case "member":
      // Green/Teal for Member
      return "bg-emerald-50 text-emerald-700 border-emerald-200 border";
    case "viewer":
      // Gray for Viewer
      return "bg-gray-50 text-gray-600 border-gray-200 border";
    default:
      return "bg-gray-50 text-gray-500 border-gray-200 border";
  }
}

export function getMultiTypeColor(types: string[]): string {
  if (!types || types.length === 0) return "bg-gray-50 text-gray-600 border-gray-200";

  // Priority based coloring
  if (types.includes("login") || types.includes("password")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (types.includes("note")) {
    return "bg-purple-50 text-purple-700 border-purple-200";
  }
  if (types.includes("totp")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (types.includes("card") || types.includes("financial")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  
  return "bg-gray-50 text-gray-600 border-gray-200";
}