import { NextRequest, NextResponse } from 'next/server';
import { handleExpiredSubscriptions } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Running subscription expiry check...');

    const result = await handleExpiredSubscriptions();

    if (!result.success) {
      console.error('Failed to handle expired subscriptions:', result.error);
      return NextResponse.json(
        { 
          error: 'Failed to process expired subscriptions',
          details: result.error 
        },
        { status: 500 }
      );
    }

    console.log(`Successfully processed ${result.expiredCount} expired subscriptions`);

    return NextResponse.json(
      {
        success: true,
        message: 'Expired subscriptions processed successfully',
        expiredCount: result.expiredCount,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;