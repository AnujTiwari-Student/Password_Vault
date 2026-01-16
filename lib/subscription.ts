import { VerifyPaymentRequest } from '@/app/api/razorpay/verify/route';
import { prisma } from '@/db';
import { PlanType, BillingCycle, SubscriptionStatus } from '@prisma/client';

interface UpdateSubscriptionParams {
  vaultId: string;
  userId: string;
  planId: PlanType;
  billingCycle: BillingCycle;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amount: number; 
  vaultType: 'org' | 'personal';
}

interface SubscriptionResult {
  success: boolean;
  subscription?:  VerifyPaymentRequest['razorpay_order_id'];
  error?: string;
}

export async function updateUserSubscription({
  vaultId,
  userId,
  planId,
  billingCycle,
  razorpayOrderId,
  razorpayPaymentId,
  amount,
  vaultType,
}: UpdateSubscriptionParams): Promise<SubscriptionResult> {
  try {
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    const nextBillingDate = new Date();
    
    if (billingCycle === BillingCycle.monthly) {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else if (billingCycle === BillingCycle.annually) {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        vault_id: vaultId,
        user_id: userId,
      },
    });

    let subscription;

    if (existingSubscription) {
      subscription = await prisma.subscription.update({
        where: {
          id: existingSubscription.id,
        },
        data: {
          plan: planId,
          billing_cycle: billingCycle,
          status: SubscriptionStatus.active,
          amount: amount / 100, 
          currency: 'INR',
          payment_method: 'razorpay',
          next_billing_date: nextBillingDate,
          last_payment_date: currentPeriodStart,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          cancelled_at: null, 
          will_downgrade_at: null,
          updated_at: new Date(),
        },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          vault_id: vaultId,
          user_id: userId,
          plan: planId,
          billing_cycle: billingCycle,
          status: SubscriptionStatus.active,
          amount: amount / 100, 
          currency: 'INR',
          payment_method: 'razorpay',
          next_billing_date: nextBillingDate,
          last_payment_date: currentPeriodStart,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        plan_type: planId,
      },
    });

    if (vaultType === 'org') {
      const vault = await prisma.vault.findUnique({
        where: { id: vaultId },
        select: { org_id: true },
      });

      if (vault?.org_id) {
        await prisma.org.update({
          where: {
            id: vault.org_id,
          },
          data: {
            plan_type: planId,
            billing_cycle: billingCycle,
            plan_renewal_date: nextBillingDate,
          },
        });
      }
    }

    await prisma.logs.create({
      data: {
        user_id: userId,
        action: 'subscription_payment',
        subject_type: 'subscription',
        ts: new Date(),
        meta: {
          subscriptionId: subscription.id,
          razorpayOrderId,
          razorpayPaymentId,
          amount: amount / 100,
          currency: 'INR',
          planId,
          billingCycle,
          vaultId,
          vaultType,
        },
      },
    });

    console.log(`Subscription updated successfully for vault: ${vaultId}`);
    
    return {
      success: true,
    //   @ts-expect-error --- IGNORE ---
      subscription,
    };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update subscription',
    };
  }
}

export async function cancelUserSubscription(
  vaultId: string,
  userId: string,
  vaultType: 'org' | 'personal'
): Promise<SubscriptionResult> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        vault_id: vaultId,
        user_id: userId,
      },
    });

    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found',
      };
    }

    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: SubscriptionStatus.cancelled,
        cancelled_at: new Date(),
        will_downgrade_at: subscription.current_period_end, 
        updated_at: new Date(),
      },
    });

    await prisma.logs.create({
      data: {
        user_id: userId,
        action: 'subscription_cancelled',
        subject_type: 'subscription',
        ts: new Date(),
        meta: {
          subscriptionId: subscription.id,
          vaultId,
          vaultType,
          cancelledAt: new Date(),
          willDowngradeAt: subscription.current_period_end,
        },
      },
    });

    console.log(`Subscription cancelled for vault: ${vaultId}`);
    
    return {
      success: true,
    //   @ts-expect-error --- IGNORE ---
      subscription: updatedSubscription,
    };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription',
    };
  }
}

export async function getUserSubscription(vaultId: string, userId: string) {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        vault_id: vaultId,
        user_id: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            plan_type: true,
          },
        },
        vault: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

export async function checkSubscriptionStatus(vaultId: string, userId: string) {
  const subscription = await getUserSubscription(vaultId, userId);
  
  if (!subscription) {
    return {
      isActive: false,
      plan: PlanType.basic,
      status: 'inactive',
      needsRenewal: false,
    };
  }

  const now = new Date();
  const isActive = subscription.status === SubscriptionStatus.active && 
                   subscription.current_period_end ? 
                   subscription.current_period_end > now : false;

  let daysUntilExpiry = 0;
  if (subscription.current_period_end) {
    daysUntilExpiry = Math.floor(
      (subscription.current_period_end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return {
    isActive,
    plan: subscription.plan,
    status: subscription.status,
    needsRenewal: daysUntilExpiry <= 7 && daysUntilExpiry > 0,
    daysUntilExpiry,
    expiryDate: subscription.current_period_end,
    nextBillingDate: subscription.next_billing_date,
    amount: subscription.amount,
    billingCycle: subscription.billing_cycle,
    willDowngradeAt: subscription.will_downgrade_at,
    isCancelled: subscription.status === SubscriptionStatus.cancelled,
  };
}

export async function handleExpiredSubscriptions() {
  try {
    const now = new Date();
    
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.active,
        current_period_end: {
          lte: now,
        },
      },
      include: {
        vault: {
          select: {
            id: true,
            org_id: true,
            type: true,
          },
        },
      },
    });

    for (const subscription of expiredSubscriptions) {
      await prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: SubscriptionStatus.expired,
          updated_at: new Date(),
        },
      });

      await prisma.user.update({
        where: {
          id: subscription.user_id,
        },
        data: {
          plan_type: PlanType.basic,
        },
      });

      if (subscription.vault.type === 'org' && subscription.vault.org_id) {
        await prisma.org.update({
          where: {
            id: subscription.vault.org_id,
          },
          data: {
            plan_type: PlanType.basic,
          },
        });
      }

      await prisma.logs.create({
        data: {
          user_id: subscription.user_id,
          action: 'subscription_expired',
          subject_type: 'subscription',
          ts: new Date(),
          meta: {
            subscriptionId: subscription.id,
            vaultId: subscription.vault_id,
            expiredAt: now,
          },
        },
      });

      console.log(`Subscription expired for vault: ${subscription.vault_id}`);
    }

    return {
      success: true,
      expiredCount: expiredSubscriptions.length,
    };
  } catch (error) {
    console.error('Error handling expired subscriptions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to handle expired subscriptions',
    };
  }
}

export async function reactivateSubscription(
  vaultId: string,
  userId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  amount: number
): Promise<SubscriptionResult> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        vault_id: vaultId,
        user_id: userId,
        status: SubscriptionStatus.cancelled,
      },
    });

    if (!subscription) {
      return {
        success: false,
        error: 'No cancelled subscription found',
      };
    }

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    const nextBillingDate = new Date();
    
    if (subscription.billing_cycle === BillingCycle.monthly) {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: SubscriptionStatus.active,
        cancelled_at: null,
        will_downgrade_at: null,
        last_payment_date: currentPeriodStart,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        next_billing_date: nextBillingDate,
        updated_at: new Date(),
      },
    });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        plan_type: subscription.plan as PlanType,
      },
    });

    await prisma.logs.create({
      data: {
        user_id: userId,
        action: 'subscription_reactivated',
        subject_type: 'subscription',
        ts: new Date(),
        meta: {
          subscriptionId: subscription.id,
          razorpayOrderId,
          razorpayPaymentId,
          amount: amount / 100,
          vaultId,
        },
      },
    });

    return {
      success: true,
    //   @ts-expect-error --- IGNORE ---
      subscription: updatedSubscription,
    };
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reactivate subscription',
    };
  }
}