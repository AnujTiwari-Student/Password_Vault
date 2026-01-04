import { prisma } from "@/db";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { Prisma, AuditSubjectType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 20);
    const action = searchParams.get("action");
    const subject_type = searchParams.get("subject_type");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const org_id = searchParams.get("org_id");

    const skip = (page - 1) * limit;

    const whereClause: Prisma.AuditWhereInput = {};

    if (user.account_type === "org" && user.org) {
      whereClause.org_id = user.org.id;
    } else {
      whereClause.actor_user_id = user.id;
    }

    if (org_id) {
      whereClause.org_id = org_id;
    }

    if (action) {
      whereClause.action = action;
    }

    if (
      subject_type &&
      Object.values(AuditSubjectType).includes(
        subject_type as AuditSubjectType
      )
    ) {
      whereClause.subject_type = subject_type as AuditSubjectType;
    }

    if (start_date || end_date) {
      whereClause.ts = {
        ...(start_date && { gte: new Date(start_date) }),
        ...(end_date && { lte: new Date(end_date) }),
      };
    }

    const [audits, totalCount] = await Promise.all([
      prisma.audit.findMany({
        where: whereClause,
        include: {
          org: { select: { name: true } },
          actor: { select: { name: true, email: true } },
        },
        orderBy: { ts: "desc" },
        skip,
        take: limit,
      }),
      prisma.audit.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        audits,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching audits:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
