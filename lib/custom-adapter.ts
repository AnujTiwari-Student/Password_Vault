import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient, User, AuthProvider } from "@prisma/client";
import { AdapterUser } from "@auth/core/adapters";

interface ExtendedAdapterUser extends AdapterUser {
  account_type?: string;
}

export const CustomOAuthAdapter = (db: PrismaClient) => {
  const baseAdapter = PrismaAdapter(db);

  return {
    ...baseAdapter,

    async createUser(user: User): Promise<ExtendedAdapterUser> {
      try {
        const data = {
          name: user.name ?? undefined,
          email: user.email,
          email_verified: user.email_verified ?? undefined,
          image: user.image ?? undefined,
          auth_provider: AuthProvider.oauth,
          umk_salt: user.umk_salt ?? undefined,
          master_passphrase_verifier: user.master_passphrase_verifier ?? undefined,
          twofa_enabled: false,
          public_key: user.public_key ?? undefined,
          last_login: user.last_login ?? undefined,
          auth_hash: undefined,
          account_type: "personal",
        };

        const newUser = await db.user.create({ data });

        return {
          _id: newUser.id,
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          image: newUser.image,
          emailVerified: newUser.email_verified ?? null,
          auth_hash: newUser.auth_hash ?? null,
          auth_provider: newUser.auth_provider,
          umk_salt: newUser.umk_salt ?? null,
          master_passphrase_verifier: newUser.master_passphrase_verifier ?? null,
          twofa_enabled: newUser.twofa_enabled,
          public_key: newUser.public_key ?? null,
          last_login: newUser.last_login ?? null,
          masterPassphraseSetupComplete: !!newUser.master_passphrase_verifier,
          account_type: newUser.account_type,
        } as ExtendedAdapterUser;
      } catch (error) {
        console.error(`Error creating user via OAuth for ${user.email}:`, error);
        throw error;
      }
    },

    async getUser(id: string) {
      const user = await db.user.findUnique({
        where: { id }
      });

      if (!user) return null;

      return {
        _id: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.email_verified ?? null,
        auth_hash: user.auth_hash ?? null,
        auth_provider: user.auth_provider,
        umk_salt: user.umk_salt ?? null,
        master_passphrase_verifier: user.master_passphrase_verifier ?? null,
        twofa_enabled: user.twofa_enabled,
        public_key: user.public_key ?? null,
        last_login: user.last_login ?? null,
        masterPassphraseSetupComplete: !!user.master_passphrase_verifier,
        account_type: user.account_type,
      } as ExtendedAdapterUser;
    },

    async getUserByEmail(email: string) {
      const user = await db.user.findUnique({
        where: { email }
      });

      if (!user) return null;

      return {
        _id: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.email_verified ?? null,
        auth_hash: user.auth_hash ?? null,
        auth_provider: user.auth_provider,
        umk_salt: user.umk_salt ?? null,
        master_passphrase_verifier: user.master_passphrase_verifier ?? null,
        twofa_enabled: user.twofa_enabled,
        public_key: user.public_key ?? null,
        last_login: user.last_login ?? null,
        masterPassphraseSetupComplete: !!user.master_passphrase_verifier,
        account_type: user.account_type,
      } as ExtendedAdapterUser;
    },
  };
};
