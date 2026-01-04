import { prisma } from "@/db";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { Prisma } from "@prisma/client";

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

    const skip = (page - 1) * limit;

    // ✅ Fully typed Prisma where clause
    const whereClause: Prisma.LogsWhereInput = {
      user_id: user.id,
    };

    if (action) {
      whereClause.action = {
        contains: action,
        mode: "insensitive",
      };
    }

    if (subject_type) {
      whereClause.subject_type = subject_type;
    }

    // ✅ Correct DateTimeFilter for ts
    if (start_date || end_date) {
      whereClause.ts = {
        ...(start_date && { gte: new Date(start_date) }),
        ...(end_date && { lte: new Date(end_date) }),
      };
    }

    const [logs, totalCount] = await Promise.all([
      prisma.logs.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          ts: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.logs.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        logs,
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
    console.error("Error fetching logs:", error);

    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
