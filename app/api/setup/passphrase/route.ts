import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { currentUser } from "@/lib/current-user";

export async function POST(request: Request) {
  const user = await currentUser();

  if (!user || !user.id || !user.email) {
    return NextResponse.json(
      { error: "Unauthorized or missing session data" },
      { status: 401 }
    );
  }

  const userId = user.id;

  const body = await request.json();
  const {
    umk_salt,
    master_passphrase_verifier,
    ovk_wrapped_for_user,
    ovk_raw,
    ovk_wrapped_for_org,
    org_name,
    account_type,
    public_key,
    wrapped_private_key,
  } = body;

  if (
    !umk_salt ||
    !master_passphrase_verifier ||
    !ovk_wrapped_for_user ||
    !account_type ||
    !public_key ||
    !wrapped_private_key
  ) {
    return NextResponse.json(
      { error: "Missing required client-side generated key materials." },
      { status: 400 }
    );
  }

  if (
    account_type === "org" &&
    (!org_name || !ovk_raw || !ovk_wrapped_for_org)
  ) {
    return NextResponse.json(
      {
        error:
          "Organization setup requires org_name, ovk_raw, and ovk_wrapped_for_org.",
      },
      { status: 400 }
    );
  }

  try {
    console.log("=== Starting cleanup for user:", userId);
    
    const userSubscriptions = await prisma.subscription.deleteMany({
      where: { user_id: userId }
    });
    console.log("Deleted subscriptions:", userSubscriptions.count);

    const userVaults = await prisma.vault.findMany({
      where: {
        OR: [
          { user_id: userId },
          { created_by: userId }
        ]
      },
      select: { id: true, org_id: true, name: true, type: true }
    });

    console.log("Found user vaults to delete:", userVaults.length);

    for (const vault of userVaults) {
      try {
        await prisma.vault.delete({
          where: { id: vault.id }
        });
        console.log("Deleted vault:", vault.id);
      } catch (error) {
        console.log("Error deleting vault:", vault.id, error);
      }
    }

    const userOrgs = await prisma.org.findMany({
      where: { owner_user_id: userId },
      select: { id: true, name: true }
    });

    console.log("Found orgs to delete:", userOrgs.length);

    for (const org of userOrgs) {
      try {
        await prisma.membership.deleteMany({
          where: { org_id: org.id }
        });
        await prisma.orgVaultKey.deleteMany({
          where: { org_id: org.id }
        });
        await prisma.audit.deleteMany({
          where: { org_id: org.id }
        });
        await prisma.org.delete({
          where: { id: org.id }
        });
        console.log("Deleted org:", org.id, org.name);
      } catch (error) {
        console.log("Error deleting org:", org.id, error);
      }
    }

    const deletedKeys = await prisma.personalVaultKey.deleteMany({
      where: { user_id: userId }
    });
    console.log("Deleted personal vault keys:", deletedKeys.count);

    console.log("=== Cleanup complete, starting transaction ===");

    const result = await prisma.$transaction(async (tx) => {
      let newOrg = null;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          umk_salt,
          master_passphrase_verifier,
          account_type,
          public_key,
        },
        select: { id: true, email: true, name: true },
      });

      await tx.logs.create({
        data: {
          user_id: userId,
          action: "STORE_PRIVATE_KEY",
          subject_type: "CRYPTO_SETUP",
          meta: {
            wrapped_private_key,
            setup_timestamp: new Date().toISOString(),
          },
        },
      });

      if (account_type === "org") {
        newOrg = await tx.org.create({
          data: {
            name: org_name,
            owner_user_id: userId,
          },
        });

        await tx.membership.create({
          data: {
            org_id: newOrg.id,
            user_id: userId,
            role: "owner",
            ovk_wrapped_for_user: ovk_wrapped_for_org,
          },
        });

        const orgVaultKey = await tx.orgVaultKey.create({
          data: {
            org_id: newOrg.id,
            ovk_cipher: ovk_raw,
          },
        });

        const vault = await tx.vault.create({
          data: {
            org_id: newOrg.id,
            name: `${org_name} Vault`,
            type: "org",
            ovk_id: orgVaultKey.id,
            orgVaultKeyId: orgVaultKey.id,
            created_by: userId,
          },
        });

        await tx.audit.create({
          data: {
            org_id: newOrg.id,
            actor_user_id: userId,
            action: "ORG_CREATED_AND_UMK_SETUP",
            subject_type: "org",
            subject_id: newOrg.id,
            ip: request.headers.get("x-forwarded-for") || "unknown",
            ua: request.headers.get("user-agent") || "unknown",
            meta: {
              ownerEmail: updatedUser.email,
              orgName: org_name,
              vaultName: vault.name,
            },
          },
        });

        console.log("Created org vault:", vault.id);
      } else if (account_type === "personal") {
        const personalVaultKey = await tx.personalVaultKey.create({
          data: {
            user_id: userId,
            ovk_cipher: ovk_wrapped_for_user,
          },
        });

        console.log("Creating personal vault for user:", userId);
        
        const vault = await tx.vault.create({
          data: {
            name: `Personal Vault - ${updatedUser.email}`,
            type: "personal",
            user_id: userId,
            ovk_id: personalVaultKey.id,
            personalVaultKeyId: personalVaultKey.id,
            created_by: userId,
          },
        });

        await tx.logs.create({
          data: {
            user_id: userId,
            action: "PERSONAL_SETUP",
            subject_type: "PERSONAL_VAULT_SETUP",
            ip: request.headers.get("x-forwarded-for") || "unknown",
            ua: request.headers.get("user-agent") || "unknown",
            meta: {
              ownerEmail: updatedUser.email,
              vaultName: vault.name,
            },
          },
        });

        console.log("Created personal vault:", vault.id);
      }

      return [updatedUser, newOrg];
    });

    return NextResponse.json(
      {
        message:
          "Setup complete: Master Passphrase, User, Vault, and Org created successfully.",
        orgId: result[1]?.id || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Critical setup transaction failed:", error);
    return NextResponse.json(
      { error: "Server error during critical setup. Setup failed." },
      { status: 500 }
    );
  }
}