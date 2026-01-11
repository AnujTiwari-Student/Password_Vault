import { prisma } from "@/db";
import { currentUser } from "@/lib/current-user";
import { NextRequest, NextResponse } from "next/server";

type PlanType = "basic" | "professional" | "enterprise" | "free";

const PLAN_LIMITS: Record<PlanType, number> = {
  free: 100,
  basic: 100,
  professional: 500,
  enterprise: 1000,
};

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const vaultId = searchParams.get("id");

    if (!vaultId) {
      return NextResponse.json(
        {
          message: "Vault ID is required",
        },
        { status: 400 }
      );
    }

    const vault = await prisma.vault.findUnique({
      where: { id: vaultId },
      select: {
        user_id: true,
        type: true,
      },
    });

    if (!vault) {
      return NextResponse.json(
        {
          message: "Vault not found",
        },
        { status: 404 }
      );
    }

    if (vault.type === "personal" && vault.user_id !== user.id) {
      return NextResponse.json(
        {
          message: "Not a personal vault",
        },
        { status: 400 }
      );
    }

    const items = await prisma.item.findMany({
      where: { vault_id: vaultId },
      orderBy: { updated_at: "desc" },
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      vaultId,
      item_name,
      item_url,
      type,
      tags,
      item_key_wrapped,
      username_ct,
      password_ct,
      totp_seed_ct,
      notes_ct,
      created_by,
    } = body;

    if (
      !vaultId ||
      !item_name ||
      !type ||
      !Array.isArray(type) ||
      type.length === 0
    ) {
      return NextResponse.json(
        {
          message: "Missing required fields: vaultId, item_name, type",
        },
        { status: 400 }
      );
    }

    if (!item_key_wrapped) {
      return NextResponse.json(
        {
          message: "item_key_wrapped is required",
        },
        { status: 400 }
      );
    }

    const vault = await prisma.vault.findUnique({
      where: { id: vaultId },
      select: {
        id: true,
        type: true,
        user_id: true,
        org_id: true,
      },
    });

    if (!vault) {
      return NextResponse.json(
        {
          message: "Vault not found",
        },
        { status: 404 }
      );
    }

    if (vault.type === "personal") {
      if (vault.user_id !== user.id) {
        return NextResponse.json(
          {
            message: "Access denied: Not your personal vault",
          },
          { status: 403 }
        );
      }
    } else if (vault.type === "org") {
      const membership = await prisma.membership.findFirst({
        where: {
          user_id: user.id,
          org_id: vault.org_id!,
        },
      });

      if (!membership) {
        return NextResponse.json(
          {
            message: "Access denied: Not a member of this organization",
          },
          { status: 403 }
        );
      }

      if (membership.role === "viewer") {
        return NextResponse.json(
          {
            message: "Access denied: Viewers cannot create items",
          },
          { status: 403 }
        );
      }
    }

    const userPlan = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan_type: true },
    });

    const currentItemsCount = await prisma.item.count({
      where: { vault_id: vaultId },
    });

    const planLimit =
      PLAN_LIMITS[(userPlan?.plan_type as PlanType) || "free"] || 100;

    if (currentItemsCount >= planLimit && planLimit !== 1000) {
      return NextResponse.json(
        {
          message: `Plan limit exceeded (${currentItemsCount}/${planLimit}). Upgrade to ${
            userPlan?.plan_type === "basic" ? "Professional" : "Enterprise"
          } plan.`,
        },
        { status: 402 }
      );
    }

    const newItem = await prisma.item.create({
      data: {
        vault_id: vaultId,
        name: item_name,
        url: item_url || null,
        type: type,
        tags: tags || [],
        item_key_wrapped: item_key_wrapped,
        username_ct: username_ct || null,
        password_ct: password_ct || null,
        totp_seed_ct: totp_seed_ct || null,
        note_ct: notes_ct || null,
        created_by: created_by || user.id,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "Item created successfully",
        item: newItem,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      itemId,
      item_name,
      item_url,
      type,
      tags,
    } = body;

    if (!itemId) {
      return NextResponse.json(
        { message: "Item ID is required" },
        { status: 400 }
      );
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        vault: {
          select: {
            type: true,
            user_id: true,
            org_id: true,
            org: {
              select: {
                owner_user_id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    const oldValues = {
      name: item.name,
      url: item.url,
      type: item.type,
      tags: item.tags,
    };

    if (item.vault.type === "personal") {
      if (item.vault.user_id !== user.id) {
        return NextResponse.json(
          { message: "Access denied: Not your personal vault" },
          { status: 403 }
        );
      }

      const updatedItem = await prisma.item.update({
        where: { id: itemId },
        data: {
          name: item_name,
          url: item_url,
          type: type,
          tags: tags,
          updated_at: new Date(),
        },
      });

      await prisma.logs.create({
        data: {
          user_id: user.id,
          action: "item.update",
          subject_type: "item",
          subject_id: itemId,
          ip:
            req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") ||
            null,
          ua: req.headers.get("user-agent") || null,
          ts: new Date(),
          meta: {
            item_id: itemId,
            item_name: item_name,
            vault_id: item.vault_id,
            vault_type: "personal",
            old_values: oldValues,
            changed_fields: Object.keys(body).filter((k) => k !== "itemId"),
          },
        },
      });

      return NextResponse.json(
        { message: "Item updated successfully", item: updatedItem },
        { status: 200 }
      );
    }

    if (item.vault.type === "org") {
      const isOrgOwner = item.vault.org?.owner_user_id === user.id;
      const membership = await prisma.membership.findFirst({
        where: {
          user_id: user.id,
          org_id: item.vault.org_id!,
        },
      });
      const isAdmin = membership?.role === "admin";
      const canEdit = isOrgOwner || isAdmin;

      if (!canEdit) {
        return NextResponse.json(
          { message: "Access denied: Only owner and admin can edit items" },
          { status: 403 }
        );
      }

      const parseTags = (tagsString: string | null | string[]) => {
        if (!tagsString) return [];
        if (Array.isArray(tagsString)) return tagsString;
        if (tagsString === "[]" || tagsString === "null") return [];
        try {
          return JSON.parse(tagsString) as string[];
        } catch {
          return [];
        }
      };

      const updatedItem = await prisma.item.update({
        where: { id: itemId },
        data: {
          name: item_name,
          url: item_url,
          type: type,
          tags: parseTags(tags),
          updated_at: new Date(),
        },
      });

      await prisma.audit.create({
        data: {
          org_id: item.vault.org_id!,
          actor_user_id: user.id,
          action: "item.update",
          subject_type: "item",
          subject_id: itemId,
          ip:
            req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") ||
            null,
          ua: req.headers.get("user-agent") || null,
          ts: new Date(),
          meta: {
            item_id: itemId,
            item_name: item_name,
            vault_id: item.vault_id,
            vault_type: "org",
            org_name: item.vault.org?.name,
            actor_role: isOrgOwner ? "owner" : "admin",
            old_values: oldValues,
            changed_fields: Object.keys(body).filter((k) => k !== "itemId"),
          },
        },
      });

      return NextResponse.json(
        { message: "Item updated successfully", item: updatedItem },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Invalid vault type" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json(
        {
          message: "Item ID is required",
        },
        { status: 400 }
      );
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        vault: {
          select: {
            type: true,
            user_id: true,
            org_id: true,
            org: {
              select: {
                owner_user_id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        {
          message: "Item not found",
        },
        { status: 404 }
      );
    }

    if (item.vault.type === "personal") {
      if (item.vault.user_id !== user.id) {
        return NextResponse.json(
          {
            message: "Access denied: Not your personal vault",
          },
          { status: 403 }
        );
      }

      await prisma.item.delete({
        where: { id: itemId },
      });

      await prisma.logs.create({
        data: {
          user_id: user.id,
          action: "item.delete",
          subject_type: "item",
          ip:
            req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") ||
            null,
          ua: req.headers.get("user-agent") || null,
          ts: new Date(),
          meta: {
            item_id: itemId,
            item_name: item.name,
            vault_id: item.vault_id,
            vault_type: "personal",
          },
        },
      });

      return NextResponse.json(
        {
          message: "Item deleted successfully",
        },
        { status: 200 }
      );
    }

    if (item.vault.type === "org") {
      const isOrgOwner = item.vault.org?.owner_user_id === user.id;

      if (!isOrgOwner) {
        return NextResponse.json(
          {
            message: "Access denied: Only organization owner can delete items",
          },
          { status: 403 }
        );
      }

      await prisma.item.delete({
        where: { id: itemId },
      });

      await prisma.audit.create({
        data: {
          org_id: item.vault.org_id!,
          actor_user_id: user.id,
          action: "item.delete",
          subject_type: "item",
          subject_id: itemId,
          ip:
            req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") ||
            null,
          ua: req.headers.get("user-agent") || null,
          ts: new Date(),
          meta: {
            item_id: itemId,
            item_name: item.name,
            vault_id: item.vault_id,
            vault_type: "org",
            org_name: item.vault.org?.name,
          },
        },
      });

      return NextResponse.json(
        {
          message: "Item deleted successfully",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "Invalid vault type",
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}