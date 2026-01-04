import { Prisma } from "@prisma/client";

export const userWithRelations = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: {
    vaults: true,
    orgs: {
      include: {
        vaults: true,
      },
    },
    memberships: {
      include: {
        org: true,
      },
    },
  },
});

export type UserWithRelations = Prisma.UserGetPayload<
  typeof userWithRelations
>;

export type OrgWithVault = {
  id: string;
  name: string;
  vault_id?: string | null;
  owner_user_id: string;
  vaults?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
};

export type MemberWithOrg = {
  id: string;
  org_id: string;
  user_id: string;
  role: string;
  org: {
    id: string;
    name: string;
  };
};

export type ExtendedUser = {
  id: string;
  name: string | null;
  email: string;
  account_type: string | null;
  masterPassphraseSetupComplete: boolean;
  vault?: {
    id: string;
    name: string;
    type: string;
  } | null;
  org?: OrgWithVault | null;
  member?: MemberWithOrg | MemberWithOrg[] | null;
};
