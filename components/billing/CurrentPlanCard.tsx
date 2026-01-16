import React from "react";
import { CreditCard, DollarSign, Check } from "lucide-react";
import { BillingData, BillingPlan, PlanType } from "./types";

interface CurrentPlanCardProps {
  currentPlan: PlanType;
  billingData: BillingData | null;
  isOrgVault: boolean;
  plans: BillingPlan[];
}

export const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({
  currentPlan,
  billingData,
  isOrgVault,
  plans,
}) => {
  const currentPlanDetails = plans.find((p) => p.id === currentPlan);
  // @ts-expect-error --- IGNORE ---
  const isActivePlan = currentPlan === "professional" || currentPlan === "pro" || currentPlan === "enterprise";

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500/10 rounded-lg">
              <CreditCard size={22} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Current Plan</h3>
              <p className="text-gray-500 text-xs mt-0.5">Your active subscription</p>
            </div>
          </div>
          {isActivePlan && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
              <Check size={16} className="text-green-400" />
              <span className="text-sm font-semibold text-green-400">Activated</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gray-750 rounded-lg border border-gray-700">
          <div className="min-w-0">
            <p className="font-semibold text-white text-base mb-1">
              {currentPlanDetails?.name} Plan
            </p>
            <p className="text-sm text-gray-400">
              {isOrgVault ? "Organization Vault" : "Personal Vault"}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-2xl font-bold text-white mb-1">
              {/* @ts-expect-error --- IGNORE --- */}
              {currentPlan === "free" || currentPlan === "basic"
                ? "Free"
                : `₹${billingData?.amount || currentPlanDetails?.price.monthly || 0}`}
            </p>
            {/* @ts-expect-error --- IGNORE --- */}
            {currentPlan !== "free" && currentPlan !== "basic" && (
              <p className="text-sm text-gray-400">
                per {billingData?.billingCycle === "annually" ? "year" : "month"}
              </p>
            )}
            {/* @ts-expect-error --- IGNORE --- */}
            {currentPlan !== "free" && currentPlan !== "basic" && billingData?.nextBillingDate && (
              <p className="text-xs text-gray-500 mt-1">
                Renews {new Date(billingData.nextBillingDate).toLocaleDateString("en-IN")}
              </p>
            )}
          </div>
        </div>

        {/* @ts-expect-error --- IGNORE --- */}
        {billingData && currentPlan !== "free" && currentPlan !== "basic" && (
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <div className="flex items-start gap-3 p-4 bg-gray-750 rounded-lg border border-gray-700">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">
                  {billingData.billingCycle === "annually" ? "Yearly" : "Monthly"} Cost
                </p>
                <p className="text-lg font-semibold text-white">
                  ₹{billingData.amount?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>

            {billingData.paymentMethod && billingData.paymentMethod !== "None" && (
              <div className="flex items-start gap-3 p-4 bg-gray-750 rounded-lg border border-gray-700">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <CreditCard size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Payment Method</p>
                  <p className="text-lg font-semibold text-white">
                    {billingData.paymentMethod}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};