import { MemberRole } from "@prisma/client";
import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      email: string;
      id?: string;
      masterPassphraseSetupComplete?: boolean;
      master_passphrase_verifier?: string | null;
      umk_salt?: string;
      auth_provider?: string;
      twofa_enabled?: boolean;
      public_key?: string | null;
      created_at?: Date;
      last_login?: Date | null;
      auth_hash?: string;
      org?: {
        id: string;
        name: string;
      };
      account_type?: "org" | "personal";
      vault: {
        id: string;
        name: string;
        ovk_id: string;
        type: "org" | "personal";
      },
      member?: {
        id: string;
        role: MemberRole;
        org_id?: string;
        user_id?: string;
        created_at: Date;
        ovk_wrapped_for_user: string;
      } | null;
    } & DefaultSession["user"];
  }

  interface JWT {
    user: {
      email: string;
      id?: string;
      masterPassphraseSetupComplete?: boolean;
      master_passphrase_verifier?: string | null;
      umk_salt?: string;
      auth_provider?: string;
      twofa_enabled?: boolean;
      public_key?: string | null;
      created_at?: Date;
      last_login?: Date | null;
      auth_hash?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    _id: string;
    masterPassphraseSetupComplete?: boolean;
    master_passphrase_verifier?: string | null;
    umk_salt?: string;
    auth_provider?: string;
    twofa_enabled?: boolean;
    public_key?: string | null;
    created_at?: Date;
    last_login?: Date | null;
    auth_hash?: string;
    email?: string;
  }
}
