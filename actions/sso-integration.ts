"use server";

import { prisma } from "@/db/index";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function configureSAMLSSO(
  organizationId: string,
  config: {
    idp_entity_id: string;
    idp_sso_url: string;
    idp_certificate: string;
    sp_entity_id: string;
    assertion_consumer_service_url: string;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const membership = await prisma.membership.findUnique({
      where: {
        org_id_user_id: {
          org_id: organizationId,
          user_id: session.user.id,
        },
      },
    });

    if (!membership || !["admin", "owner"].includes(membership.role)) {
      return { success: false, error: "Only admins can configure SSO" };
    }

    const organization = await prisma.org.findUnique({
      where: { id: organizationId },
      select: { features: true },
    });

    if (!organization?.features.includes("sso_integration")) {
      return {
        success: false,
        error: "SSO integration is not available in your plan",
        upgrade_required: true,
      };
    }

    await prisma.logs.create({
      data: {
        user_id: session.user.id,
        action: "saml_sso_configured",
        subject_type: "organization",
        meta: {
          organization_id: organizationId,
          idp_entity_id: config.idp_entity_id,
          sp_entity_id: config.sp_entity_id,
        },
      },
    });

    await prisma.audit.create({
      data: {
        org_id: organizationId,
        actor_user_id: session.user.id,
        action: "settings_updated",
        subject_type: "org",
        subject_id: organizationId,
        ts: new Date(),
        meta: {
          type: "saml_sso_configuration",
          idp_entity_id: config.idp_entity_id,
        },
      },
    });

    revalidatePath(`/organizations/${organizationId}/settings/sso`);

    return {
      success: true,
      message: "SAML SSO configured successfully",
    };
  } catch (error) {
    console.error("Configure SAML SSO error:", error);
    return { success: false, error: "Failed to configure SAML SSO" };
  }
}

export async function configureOAuthSSO(
  organizationId: string,
  config: {
    provider: "google" | "microsoft" | "okta";
    client_id: string;
    client_secret: string;
    redirect_uri: string;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const membership = await prisma.membership.findUnique({
      where: {
        org_id_user_id: {
          org_id: organizationId,
          user_id: session.user.id,
        },
      },
    });

    if (!membership || !["admin", "owner"].includes(membership.role)) {
      return { success: false, error: "Only admins can configure SSO" };
    }

    const organization = await prisma.org.findUnique({
      where: { id: organizationId },
      select: { features: true },
    });

    if (!organization?.features.includes("sso_integration")) {
      return {
        success: false,
        error: "SSO integration is not available in your plan",
        upgrade_required: true,
      };
    }

    await prisma.logs.create({
      data: {
        user_id: session.user.id,
        action: "oauth_sso_configured",
        subject_type: "organization",
        meta: {
          organization_id: organizationId,
          provider: config.provider,
          client_id: config.client_id,
        },
      },
    });

    await prisma.audit.create({
      data: {
        org_id: organizationId,
        actor_user_id: session.user.id,
        action: "settings_updated",
        subject_type: "org",
        subject_id: organizationId,
        ts: new Date(),
        meta: {
          type: "oauth_sso_configuration",
          provider: config.provider,
        },
      },
    });

    revalidatePath(`/organizations/${organizationId}/settings/sso`);

    return {
      success: true,
      message: `${config.provider} OAuth SSO configured successfully`,
    };
  } catch (error) {
    console.error("Configure OAuth SSO error:", error);
    return { success: false, error: "Failed to configure OAuth SSO" };
  }
}

export async function provisionSCIMUser(
  organizationId: string,
  userData: {
    userName: string;
    name: {
      givenName: string;
      familyName: string;
    };
    emails: Array<{
      value: string;
      primary: boolean;
    }>;
  }
) {
  try {
    const organization = await prisma.org.findUnique({
      where: { id: organizationId },
      select: { features: true, max_members: true },
    });

    if (!organization?.features.includes("sso_integration")) {
      return {
        success: false,
        error: "User provisioning is not available in your plan",
        upgrade_required: true,
      };
    }

    const memberCount = await prisma.membership.count({
      where: { org_id: organizationId },
    });

    if (
      organization.max_members !== null &&
      memberCount >= organization.max_members
    ) {
      return {
        success: false,
        error: "Member limit reached",
        upgrade_required: true,
      };
    }

    const primaryEmail =
      userData.emails.find((e) => e.primary)?.value ||
      userData.emails[0]?.value;

    let user = await prisma.user.findUnique({
      where: { email: primaryEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: primaryEmail,
          name: `${userData.name.givenName} ${userData.name.familyName}`,
          auth_provider: "sso",
          account_type: "sso",
        },
      });
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        org_id_user_id: {
          org_id: organizationId,
          user_id: user.id,
        },
      },
    });

    if (existingMembership) {
      return {
        success: false,
        error: "User already a member of this organization",
      };
    }

    const membership = await prisma.membership.create({
      data: {
        org_id: organizationId,
        user_id: user.id,
        role: "member",
        ovk_wrapped_for_user: "",
      },
    });

    await prisma.audit.create({
      data: {
        org_id: organizationId,
        actor_user_id: user.id,
        action: "member_invited",
        subject_type: "member",
        subject_id: user.id,
        ts: new Date(),
        meta: {
          provisioned_via: "SCIM",
          email: primaryEmail,
        },
      },
    });

    revalidatePath(`/organizations/${organizationId}/members`);

    return {
      success: true,
      data: {
        id: user.id,
        userName: userData.userName,
        email: primaryEmail,
        name: user.name,
        active: true,
      },
    };
  } catch (error) {
    console.error("Provision SCIM user error:", error);
    return { success: false, error: "Failed to provision user" };
  }
}

export async function deprovisionSCIMUser(
  organizationId: string,
  userId: string
) {
  try {
    const organization = await prisma.org.findUnique({
      where: { id: organizationId },
      select: { features: true },
    });

    if (!organization?.features.includes("sso_integration")) {
      return {
        success: false,
        error: "User de-provisioning is not available in your plan",
        upgrade_required: true,
      };
    }

    await prisma.membership.delete({
      where: {
        org_id_user_id: {
          org_id: organizationId,
          user_id: userId,
        },
      },
    });

    await prisma.audit.create({
      data: {
        org_id: organizationId,
        actor_user_id: userId,
        action: "member_removed",
        subject_type: "member",
        subject_id: userId,
        ts: new Date(),
        meta: {
          deprovisioned_via: "SCIM",
        },
      },
    });

    revalidatePath(`/organizations/${organizationId}/members`);

    return {
      success: true,
      message: "User deprovisioned successfully",
    };
  } catch (error) {
    console.error("Deprovision SCIM user error:", error);
    return { success: false, error: "Failed to deprovision user" };
  }
}
