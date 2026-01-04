import { MemberRole } from "./vault";

export interface SessionState {
  isActive: boolean;
  expiresAt: number | null;
  remainingTime: number;
  isWarning: boolean;
}

export interface SessionManager {
  startSession: () => void;
  endSession: () => void;
  extendSession: () => void;
  getSessionState: () => SessionState;
  isSessionValid: () => boolean;
  getRemainingTime: () => number;
}

export interface DecryptionSession {
  itemId: string;
  decryptedAt: number;
  expiresAt: number;
}

export interface SessionOrg {
  id: string;
  name: string;
}

export interface SessionMembership {
  id: string;
  role: MemberRole;
  ovk_wrapped_for_user: string;
  created_at: Date;
}

export interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  org?: SessionOrg | null;
  member?: SessionMembership | SessionMembership[];
  vault?: {
    id: string;
    type: "personal" | "org";
  } | null;
}
