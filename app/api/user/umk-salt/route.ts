import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        umk_salt: true,
        public_key: true
      }
    });

    if (!user?.umk_salt) {
      return NextResponse.json({ error: "UMK salt not found" }, { status: 404 });
    }

    const privateKeyLog = await prisma.logs.findFirst({
      where: {
        user_id: session.user.id,
        action: "STORE_PRIVATE_KEY"
      },
      select: {
        meta: true
      },
      orderBy: {
        ts: 'desc'
      }
    });

    const wrappedPrivateKey = privateKeyLog?.meta && 
      typeof privateKeyLog.meta === 'object' && 
      'wrapped_private_key' in privateKeyLog.meta 
      ? (privateKeyLog.meta as { wrapped_private_key: string }).wrapped_private_key 
      : null;

    return NextResponse.json({
      umk_salt: user.umk_salt,
      public_key: user.public_key,
      wrapped_private_key: wrappedPrivateKey
    });

  } catch {
    return NextResponse.json({ error: "Failed to get UMK salt" }, { status: 500 });
  }
}