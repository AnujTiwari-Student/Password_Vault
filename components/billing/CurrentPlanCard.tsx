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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
              <CreditCard size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
              <p className="text-gray-600 text-sm mt-0.5">Your active subscription</p>
            </div>
          </div>
          {isActivePlan && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border-2 border-green-200">
              <Check size={16} className="text-green-600" />
              <span className="text-sm font-bold text-green-700">Activated</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gray-50 rounded-lg border border-gray-200">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-base mb-1">
              {currentPlanDetails?.name} Plan
            </p>
            <p className="text-sm text-gray-600">
              {isOrgVault ? "Organization Vault" : "Personal Vault"}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {/* @ts-expect-error --- IGNORE --- */}
              {currentPlan === "free" || currentPlan === "basic"
                ? "Free"
                : `₹${billingData?.amount || currentPlanDetails?.price.monthly || 0}`}
            </p>
            {/* @ts-expect-error --- IGNORE --- */}
            {currentPlan !== "free" && currentPlan !== "basic" && (
              <p className="text-sm text-gray-600">
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
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                <DollarSign size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {billingData.billingCycle === "annually" ? "Yearly" : "Monthly"} Cost
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  ₹{billingData.amount?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>

            {billingData.paymentMethod && billingData.paymentMethod !== "None" && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                  <CreditCard size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                  <p className="text-lg font-semibold text-gray-900">
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
