import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/index";

export function requireFeature(featureName: string) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    try {
      const body = await req.json();
      const { organizationId, org_id } = body;
      const orgId = organizationId || org_id;

      if (!orgId) {
        return null;
      }

      const organization = await prisma.org.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          plan_type: true,
          features: true,
        },
      });

      if (!organization) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        );
      }

      if (!organization.features.includes(featureName)) {
        return NextResponse.json(
          {
            error: "FEATURE_NOT_AVAILABLE",
            message: `This feature is not available in your current plan (${organization.plan_type})`,
            required_feature: featureName,
            upgrade_required: true,
          },
          { status: 403 }
        );
      }

      return null;
    } catch (error) {
      console.error("Feature access check error:", error);
      return NextResponse.json(
        { error: "Failed to check feature access" },
        { status: 500 }
      );
    }
  };
}

export const FEATURES = {
  BASIC_SECURITY: "basic_security",
  TEAM_SHARING: "team_sharing",
  CONTACT_SUPPORT: "contact_support",
  TEAM_MANAGEMENT: "team_management",
  ADVANCED_SECURITY: "advanced_security",
  ROLE_BASED_ACCESS: "role_based_access",
  ADVANCED_COMPLIANCE: "advanced_compliance",
  SSO_INTEGRATION: "sso_integration",
  DEDICATED_SUPPORT: "dedicated_support",
  CUSTOM_FEATURES: "custom_features",
  ADVANCED_AUDIT_LOGS: "advanced_audit_logs",
} as const;
