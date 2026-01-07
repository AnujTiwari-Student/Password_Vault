"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Package } from "lucide-react";
import { User } from "@/types/vault";
import { PlanType } from "@/types/billing";
import { toast } from "sonner";
import { getSubscriptionDetails } from "@/actions/stripe-action";
import { CurrentPlanCard } from "../billing/CurrentPlanCard";
import { BillingCycleToggle } from "../billing/BillingCycleToggle";
import { PlanCards } from "../billing/PlanCards";
import { PlanComparisonTable } from "../billing/PlanComparisonTable";
import { BillingManagement } from "../billing/BillingManagement";
import { ManageSubscriptionModal } from "../billing/ManageSubscriptionModal";
import { BillingData } from "../billing/types";
import { personalPlans, orgPlans } from "../billing/plansConfig";

interface BillingComponentProps {
  user: User;
}

export const BillingComponent: React.FC<BillingComponentProps> = ({ user }) => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(true);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const isOrgVault = user.vault?.type === "org";
  const vaultId = user.vault?.id;

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!vaultId) {
        setIsLoadingBilling(false);
        return;
      }

      try {
        const data = await getSubscriptionDetails();
        setBillingData(data as BillingData);
        if (data.billingCycle) {
          setBillingCycle(data.billingCycle as "monthly" | "yearly");
        }
      } catch (error: unknown) {
        console.error("Failed to fetch billing data:", error);
        toast.error("Failed to load billing information");
      } finally {
        setIsLoadingBilling(false);
      }
    };

    fetchBillingData();
  }, [vaultId]);

  const currentPlan: PlanType = (billingData?.plan as PlanType) || "free";
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
      {/* Header */}
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

      {/* Current Plan Card */}
      <CurrentPlanCard
        currentPlan={currentPlan}
        billingData={billingData}
        isOrgVault={isOrgVault}
        plans={plans}
      />

      {/* Billing Cycle Toggle */}
      <BillingCycleToggle
        billingCycle={billingCycle}
        setBillingCycle={setBillingCycle}
      />

      {/* Plan Cards */}
      <PlanCards
        plans={plans}
        currentPlan={currentPlan}
        billingCycle={billingCycle}
        user={user}
      />

      {/* Plan Comparison Table */}
      <PlanComparisonTable plans={plans} isOrgVault={isOrgVault} />

      {/* Billing Management (Invoice & Manage Subscription) */}
      {currentPlan !== "free" && (
        <BillingManagement
          onManageClick={() => setIsManageModalOpen(true)}
        />
      )}

      {/* Manage Subscription Modal */}
      <ManageSubscriptionModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        billingData={billingData}
        currentPlan={currentPlan}
        plans={plans}
      />
    </div>
  );
};
