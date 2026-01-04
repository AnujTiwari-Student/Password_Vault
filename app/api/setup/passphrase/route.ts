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
    console.warn(
      "Received incomplete key material for setup:",
      Object.keys(body)
    );
    return NextResponse.json(
      {
        error: "Missing required client-side generated key materials.",
      },
      { status: 400 }
    );
  }

  if (account_type === "org" && (!org_name || !ovk_raw || !ovk_wrapped_for_org)) {
    return NextResponse.json(
      {
        error: "Organization setup requires org_name, ovk_raw, and ovk_wrapped_for_org.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let newOrg;

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
            wrapped_private_key: wrapped_private_key,
            setup_timestamp: new Date().toISOString()
          }
        }
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
      } else if (account_type === "personal") {
        const personalVaultKey = await tx.personalVaultKey.create({
          data: {
            user_id: userId,
            ovk_cipher: ovk_wrapped_for_user,
          },
        });

        const vault = await tx.vault.create({
          data: {
            name: "Personal Vault",
            type: "personal",
            user_id: userId,
            ovk_id: personalVaultKey.id,
            personalVaultKeyId: personalVaultKey.id,
          },
        });

        await tx.logs.create({
          data: {
            user_id: userId,
            action: "PERSONAL_SETUP",
            ip: request.headers.get("x-forwarded-for") || "unknown",
            ua: request.headers.get("user-agent") || "unknown",
            subject_type: "PERSONAL_VAULT_SETUP",
            meta: {
              ownerEmail: updatedUser.email,
              vaultName: vault.name,
            },
          },
        });
      }

      return [updatedUser, newOrg];
    });

    return NextResponse.json(
      {
        message: "Setup complete: Master Passphrase, User, Org, and Membership created.",
        result,
        orgId: result[1]?.id || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Critical setup transaction failed:", error);
    return NextResponse.json(
      {
        error: "Server error during critical setup. Setup failed.",
      },
      { status: 500 }
    );
  }
}
