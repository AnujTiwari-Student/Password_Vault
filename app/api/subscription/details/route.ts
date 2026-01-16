import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserSubscription } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const vaultId = searchParams.get('vaultId');
    const userId = searchParams.get('userId');

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

    const subscription = await getUserSubscription(vaultId, userId);

    if (!subscription) {
      return NextResponse.json(
        { subscription: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          amount: subscription.amount,
          currency: subscription.currency,
          billing_cycle: subscription.billing_cycle,
          next_billing_date: subscription.next_billing_date,
          payment_method: subscription.payment_method,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancelled_at: subscription.cancelled_at,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription details" },
      { status: 500 }
    );
  }
}