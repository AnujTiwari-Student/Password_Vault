import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/db';

interface PaymentMeta {
  amount?: number;
  currency?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  planId?: string;
  billingCycle?: string;
  [key: string]: unknown;
}

interface PaymentLog {
  id: string;
  ts: Date;
  meta: PaymentMeta | null;
}

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

    const payments = await prisma.logs.findMany({
      where: {
        user_id: userId,
        action: 'subscription_payment',
      },
      orderBy: {
        ts: 'desc',
      },
      take: 10,
    }) as PaymentLog[];

    const invoices = payments.map((payment) => {
      const meta = (payment.meta || {}) as PaymentMeta;
      
      return {
        id: payment.id,
        date: payment.ts,
        amount: meta.amount || 0,
        currency: meta.currency || 'INR',
        status: 'paid',
        razorpayPaymentId: meta.razorpayPaymentId || null,
        razorpayOrderId: meta.razorpayOrderId || null,
        planId: meta.planId || null,
        billingCycle: meta.billingCycle || null,
      };
    });

    return NextResponse.json(
      { invoices },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}