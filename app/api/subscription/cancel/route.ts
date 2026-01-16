import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { cancelUserSubscription } from '@/lib/subscription';
import { prisma } from '@/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { vaultId, userId } = data;

    if (!vaultId || !userId) {
      return NextResponse.json(
        { error: "Missing vaultId or userId" },
        { status: 400 }
      );
    }

    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const vault = await prisma.vault.findUnique({
      where: { id: vaultId },
      select: { type: true },
    });

    if (!vault) {
      return NextResponse.json(
        { error: "Vault not found" },
        { status: 404 }
      );
    }

    const result = await cancelUserSubscription(vaultId, userId, vault.type as 'org' | 'personal');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to cancel subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Subscription cancelled successfully",
        subscription: result.subscription
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}