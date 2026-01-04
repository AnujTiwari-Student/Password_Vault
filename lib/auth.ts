import { getVaultByOrgId, getVaultByUserId } from "@/data/vault-data";
import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { prisma } from "@/db";
import { getUserById, updateUser } from "@/data/users-data";
import { CustomOAuthAdapter } from "./custom-adapter";
import { Membership, Org, Vault } from "@prisma/client";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  events: {
    async linkAccount({ user, account }) {
      console.log(`Account linked: ${account.provider} to user ${user.email}`);
      await updateUser(user.id as string);
    },
  },
  callbacks: {
    async signIn({ user, account, credentials }) {
      if (account?.provider !== "credentials") {
        return true;
      }
      
      const existingUser = await getUserById(user.id as string);
      
      if (!existingUser) {
        return false;
      }

      if (existingUser.twofa_enabled === true && 
          !credentials?.twoFactorVerified && 
          !credentials?.skipPasswordCheck) {
        return false;
      }
      
      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.email = token.email as string;
        session.user.masterPassphraseSetupComplete =
          !!token.masterPassphraseSetupComplete;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        session.user.twofa_enabled = token.twofa_enabled as boolean;
        session.user.org = token.org as Org;
        session.user.account_type = token.account_type as "org" | "personal";
        session.user.vault = token.vault as Vault;
        session.user.public_key = token.public_key as string;

        if (token.member) {
          // @ts-expect-error TS2322
          session.user.member = token.member as Membership | Membership[];
        } else {
          session.user.member = null;
        }
      }

      return session;
    },
    async jwt({ token, trigger, session, user }) {
      if (!token.sub) return token;

      if (trigger === "update" && session?.twoFactorVerified) {
        token.twoFactorVerified = true;
      }

      if (trigger === "signIn" && user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      const dbUser = await getUserById(token.sub as string);
      if (!dbUser) return token;

      const personalVault = await getVaultByUserId(dbUser.id as string);
      
      const memberships = await prisma.membership.findMany({
        where: { user_id: dbUser.id },
        include: {
          org: {
            include: {
              vaults: {
                where: { type: 'org' },
                take: 1
              }
            }
          }
        }
      });

      const org = memberships.length > 0 ? memberships[0].org : null;

      if (org) {
        token.org = org;
      }

      if (memberships && memberships.length > 0) {
        token.member = memberships;
      } else {
        token.member = null;
      }

      token.email = dbUser?.email as string;
      token.masterPassphraseSetupComplete = !!dbUser?.master_passphrase_verifier;
      token.twofa_enabled = dbUser?.twofa_enabled || false;
      token.name = dbUser?.name as string;
      token.account_type = dbUser?.account_type;
      token.public_key = dbUser?.public_key as string;

      if (dbUser.account_type === "personal") {
        token.vault = personalVault;
      } else if (dbUser.account_type === "org" && org) {
        const orgVault = await getVaultByOrgId(org.id);
        token.vault = orgVault;
      }

      return {
        ...token,
        user: dbUser,
      };
    },
  },
  // @ts-expect-error TS2345
  adapter: CustomOAuthAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
  },
});
