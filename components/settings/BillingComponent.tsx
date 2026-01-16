"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Package } from "lucide-react";
import { User } from "@/types/vault";
import { PlanType } from "@/types/billing";
import { toast } from "sonner";
import { CurrentPlanCard } from "../billing/CurrentPlanCard";
import { BillingCycleToggle } from "../billing/BillingCycleToggle";
import { PlanCards } from "../billing/PlanCards";
import { PlanComparisonTable } from "../billing/PlanComparisonTable";
import { BillingManagement } from "../billing/BillingManagement";
import { ManageSubscriptionModal } from "../billing/ManageSubscriptionModal";
import { BillingData } from "../billing/types";
import { personalPlans, orgPlans } from "../billing/plansConfig";
import axios from "axios";

interface BillingComponentProps {
  user: User;
}

const PLAN_ID_MAP: Record<string, PlanType> = {
  'basic': 'free',
  'professional': 'pro',
  'enterprise': 'enterprise',
  'free': 'free',
  'pro': 'pro',
};

export const BillingComponent: React.FC<BillingComponentProps> = ({ user }) => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(true);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const isOrgVault = user.vault?.type === "org";
  const vaultId = user.vault?.id;
  const userId = user.id;

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!vaultId || !userId) {
        setIsLoadingBilling(false);
        return;
      }

      try {
        const response = await axios.get(`/api/subscription/details?vaultId=${vaultId}&userId=${userId}`);
        const data = response.data;
        
        if (data.subscription) {
          const mappedPlan = PLAN_ID_MAP[data.subscription.plan] || data.subscription.plan;
          
          setBillingData({
            plan: mappedPlan,
            status: data.subscription.status,
            amount: data.subscription.amount,
            currency: data.subscription.currency || 'INR',
            billingCycle: data.subscription.billing_cycle === 'annually' ? 'yearly' : 'monthly',
            nextBillingDate: data.subscription.next_billing_date,
            paymentMethod: data.subscription.payment_method || 'Razorpay',
            cancelAtPeriodEnd: data.subscription.status === 'cancelled',
          });
          
          if (data.subscription.billing_cycle) {
            setBillingCycle(data.subscription.billing_cycle === 'annually' ? 'yearly' : 'monthly');
          }
        } else {
          setBillingData(null);
        }
      } catch (error: unknown) {
        console.error("Failed to fetch billing data:", error);
        if (axios.isAxiosError(error) && error.response?.status !== 404) {
          toast.error("Failed to load billing information");
        }
      } finally {
        setIsLoadingBilling(false);
      }
    };

    fetchBillingData();
  }, [vaultId, userId]);

  // @ts-expect-error --- IGNORE ---
  const currentPlan: PlanType = billingData?.plan || user.plan_type || "free";
  const plans = isOrgVault ? orgPlans : personalPlans;

  if (isLoadingBilling) {
    return (
      <div className="bg-gray-800 rounded-xl p-12 border border-gray-700">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <span className="ml-3 text-gray-400">Loading billing information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-500/10 rounded-lg">
            <Package size={24} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Billing & Plans</h2>
        </div>
        <p className="text-gray-400 text-sm ml-14">
          Manage your subscription and upgrade your plan
        </p>
      </div>

      <CurrentPlanCard
        currentPlan={currentPlan}
        billingData={billingData}
        isOrgVault={isOrgVault}
        plans={plans}
      />

      <BillingCycleToggle
        billingCycle={billingCycle}
        setBillingCycle={setBillingCycle}
      />

      <PlanCards
        plans={plans}
        currentPlan={currentPlan}
        billingCycle={billingCycle}
        user={user}
      />

      <PlanComparisonTable plans={plans} isOrgVault={isOrgVault} />

      {currentPlan !== "free" && vaultId && userId && (
        <BillingManagement
          onManageClick={() => setIsManageModalOpen(true)}
          vaultId={vaultId}
          userId={userId}
        />
      )}

      {vaultId && userId && (
        <ManageSubscriptionModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          billingData={billingData}
          currentPlan={currentPlan}
          plans={plans}
          vaultId={vaultId}
          userId={userId}
        />
      )}
    </div>
  );
};