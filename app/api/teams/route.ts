import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { CreateTeamSchema } from "@/schema/zod-schema";
import { APIResponse, CreateTeamResponse } from "@/types/api-responses";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Unauthorized"] }
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const vaultId = searchParams.get('vault_id');

    if (!orgId || !vaultId) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Missing org_id or vault_id parameter"] }
      }, { status: 400 });
    }

    const membership = await prisma.membership.findFirst({
      where: {
        user_id: session.user.id,
        org_id: orgId
      }
    });

    if (!membership) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Access denied"] }
      }, { status: 403 });
    }

    const teams = await prisma.team.findMany({
      where: {
        org_id: orgId,
        vault_id: vaultId
      }
    });

    const memberCount = await prisma.membership.count({
      where: { org_id: orgId }
    });

    const teamsWithMemberCount = teams.map(team => ({
      ...team,
      member_count: memberCount
    }));

    return NextResponse.json({
      success: true,
      data: { teams: teamsWithMemberCount }
    });

  } catch (error: unknown) {
    console.error("Teams API error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: [error instanceof Error ? error.message : "Internal server error"] }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse<CreateTeamResponse>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        errors: { _form: ["Unauthorized"] }
      }, { status: 401 });
    }

    const data = await request.json();
    
    if (data.action === 'create_team') {
      const validatedData = CreateTeamSchema.parse({
        name: data.name,
        description: data.description
      });

      const membership = await prisma.membership.findFirst({
        where: {
          user_id: session.user.id,
          org_id: data.org_id,
          role: { in: ['owner', 'admin'] }
        }
      });

      if (!membership) {
        return NextResponse.json({
          success: false,
          errors: { _form: ["Organization not found or insufficient permissions"] }
        }, { status: 403 });
      }

      const vault = await prisma.vault.findFirst({
        where: {
          id: data.vault_id,
          org_id: data.org_id 
        }
      });

      if (!vault) {
        return NextResponse.json({
          success: false,
          errors: { _form: ["Vault not found or access denied"] }
        }, { status: 404 });
      }

      const team = await prisma.team.create({
        data: {
          name: validatedData.name,
          description: validatedData.description || "",
          org_id: data.org_id,
          vault_id: data.vault_id, 
          created_by: session.user.id,
        }
      });

      const memberCount = await prisma.membership.count({
        where: { org_id: data.org_id }
      });

      return NextResponse.json({
        success: true,
        message: "Team created successfully",
        data: {
          team: {
            id: team.id,
            name: team.name,
            description: team.description || "",
            org_id: team.org_id,
            vault_id: team.vault_id,
            created_at: team.created_at.toISOString(),
            member_count: memberCount
          }
        }
      }, { status: 201 });
    }

    return NextResponse.json({
      success: false,
      errors: { _form: ["Invalid action"] }
    }, { status: 400 });

  } catch (error: unknown) {
    console.error("API error:", error);
    return NextResponse.json({
      success: false,
      errors: { _form: [error instanceof Error ? error.message : "Internal server error"] }
    }, { status: 500 });
  }
}
