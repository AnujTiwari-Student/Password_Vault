"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Check,
  Zap,
  Loader2,
  DollarSign,
  TrendingUp,
  Package,
} from "lucide-react";
import { User } from "@/types/vault";
import { BillingPlan, PlanType } from "@/types/billing";
import { toast } from "sonner";
import {
  createStripeCheckoutSession,
  getSubscriptionDetails,
  createStripePortalSession,
  cancelSubscription,
} from "@/actions/stripe-action";

interface BillingComponentProps {
  user: User;
}

interface BillingData {
  plan: string;
  status: string;
  nextBillingDate?: string | null;
  amount?: number;
  paymentMethod?: string;
  currency?: string;
}

export const BillingComponent: React.FC<BillingComponentProps> = ({ user }) => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(true);

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
        setBillingData(data);
      } catch (error: unknown) {
        console.error("Failed to fetch billing data:", error);
      } finally {
        setIsLoadingBilling(false);
      }
    };

    fetchBillingData();
  }, [vaultId]);

  const currentPlan: PlanType = (billingData?.plan as PlanType) || "free";

  const personalPlans: BillingPlan[] = [
    {
      id: "free",
      name: "Free",
      price: { monthly: 0, yearly: 0 },
      limits: {
        vaults: 1,
        itemsPerVault: 100,
        storage: "1GB",
        features: [
          "1 Personal Vault",
          "100 Items",
          "Basic Security",
          "Web Access",
          "2FA Support",
        ],
      },
    },
    {
      id: "pro",
      name: "Pro",
      price: { monthly: 749, yearly: 7490 },
      limits: {
        vaults: 5,
        itemsPerVault: 1000,
        storage: "10GB",
        features: [
          "5 Personal Vaults",
          "Unlimited Items",
          "Advanced Security",
          "2FA Support",
          "Priority Support",
          "File Attachments",
        ],
      },
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: { monthly: 2499, yearly: 24990 },
      limits: {
        vaults: 999,
        itemsPerVault: 10000,
        storage: "Unlimited",
        features: [
          "Unlimited Vaults",
          "Unlimited Items",
          "Enterprise Security",
          "Custom Integrations",
          "Dedicated Support",
          "Advanced Audit Logs",
        ],
      },
    },
  ];

  const orgPlans: BillingPlan[] = [
    {
      id: "free",
      name: "Free",
      price: { monthly: 0, yearly: 0 },
      limits: {
        vaults: 1,
        itemsPerVault: 100,
        members: 3,
        storage: "1GB",
        features: [
          "1 Organization Vault",
          "100 Items",
          "Up to 3 Members",
          "Basic Security",
          "Team Sharing",
        ],
      },
    },
    {
      id: "pro",
      name: "Pro",
      price: { monthly: 2099, yearly: 20990 },
      limits: {
        vaults: 10,
        itemsPerVault: 2000,
        members: 50,
        storage: "100GB",
        features: [
          "10 Organization Vaults",
          "Unlimited Items",
          "Up to 50 Members",
          "Team Management",
          "Advanced Security",
          "Role-based Access",
        ],
      },
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: { monthly: 8299, yearly: 82990 },
      limits: {
        vaults: 999,
        itemsPerVault: 10000,
        members: 999,
        storage: "Unlimited",
        features: [
          "Unlimited Everything",
          "Advanced Compliance",
          "SSO Integration",
          "Dedicated Support",
          "Custom Features",
          "Advanced Audit Logs",
        ],
      },
    },
  ];

  const plans = isOrgVault ? orgPlans : personalPlans;

  const getCurrentPlanDetails = (): BillingPlan | null => {
    return plans.find((p) => p.id === currentPlan) || null;
  };

  const currentPlanDetails = getCurrentPlanDetails();

  const handleUpgrade = async (planId: PlanType): Promise<void> => {
    if (planId === "free") {
      toast.info("Cannot downgrade to free plan from here");
      return;
    }

    setLoading(planId);
    try {
      const result = await createStripeCheckoutSession({
        planId,
        billingCycle,
        vaultId: user.vault?.id || "",
        vaultType: user.vault?.type || "personal",
      });

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to start upgrade process";
      console.error("Error upgrading plan:", error);
      toast.error(message);
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const result = await createStripePortalSession();

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to open billing portal";
      toast.error(message);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }

    try {
      const result = await cancelSubscription();

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Subscription cancelled successfully");
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to cancel subscription";
      toast.error(message);
    }
  };

  if (isLoadingBilling) {
    return (
      <div className="bg-gray-800 rounded-xl p-12 border border-gray-700">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <span className="ml-3 text-gray-400">
            Loading billing information...
          </span>
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

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500/10 rounded-lg">
              <CreditCard size={22} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Current Plan</h3>
              <p className="text-gray-500 text-xs mt-0.5">
                Your active subscription
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gray-750 rounded-lg border border-gray-700">
            <div className="min-w-0">
              <p className="font-semibold text-white text-base mb-1">
                {currentPlanDetails?.name || "Unknown"} Plan
              </p>
              <p className="text-sm text-gray-400">
                {isOrgVault ? "Organization Vault" : "Personal Vault"}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-2xl font-bold text-white mb-1">
                {currentPlan === "free"
                  ? "Free"
                  : `₹${
                      billingData?.amount ||
                      currentPlanDetails?.price.monthly ||
                      0
                    }`}
              </p>
              {currentPlan !== "free" && (
                <p className="text-sm text-gray-400">per month</p>
              )}
              {currentPlan !== "free" && billingData?.nextBillingDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Renews{" "}
                  {new Date(billingData.nextBillingDate).toLocaleDateString(
                    "en-IN"
                  )}
                </p>
              )}
            </div>
          </div>

          {billingData && currentPlan !== "free" && (
            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div className="flex items-start gap-3 p-4 bg-gray-750 rounded-lg border border-gray-700">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Monthly Cost</p>
                  <p className="text-lg font-semibold text-white">
                    ₹{billingData.amount?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>

              {billingData.paymentMethod &&
                billingData.paymentMethod !== "None" && (
                  <div className="flex items-start gap-3 p-4 bg-gray-750 rounded-lg border border-gray-700">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <CreditCard size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">
                        Payment Method
                      </p>
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

      <div className="flex items-center justify-center">
        <div className="bg-gray-800 p-1.5 rounded-lg border border-gray-700 inline-flex">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2.5 rounded-md transition-all font-medium text-sm ${
              billingCycle === "monthly"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2.5 rounded-md transition-all relative font-medium text-sm ${
              billingCycle === "yearly"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 bg-green-600 text-xs px-2 py-0.5 rounded-full text-white font-semibold">
              Save
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const price =
            billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;
          const savings =
            billingCycle === "yearly"
              ? plan.price.monthly * 12 - plan.price.yearly
              : 0;

          return (
            <div
              key={plan.id}
              className={`relative bg-gray-800 rounded-xl p-6 border transition-all duration-300 hover:shadow-xl ${
                plan.popular
                  ? "border-blue-600/50 shadow-lg shadow-blue-500/10"
                  : "border-gray-700 hover:border-gray-600"
              } ${
                currentPlan === plan.id
                  ? "ring-2 ring-green-600/50 shadow-lg shadow-green-500/10"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    Popular
                  </span>
                </div>
              )}

              {currentPlan === plan.id && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                    <Check size={12} />
                    Active
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-3">
                  {plan.name}
                </h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-white">
                    ₹{price}
                  </span>
                  {plan.id !== "free" && (
                    <span className="text-gray-400 text-base ml-1">
                      /{billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  )}
                </div>
                {billingCycle === "yearly" &&
                  plan.id !== "free" &&
                  savings > 0 && (
                    <div className="flex items-center justify-center gap-1 text-sm text-green-400 font-medium">
                      <TrendingUp size={14} />
                      Save ₹{savings}/year
                    </div>
                  )}
              </div>

              <div className="space-y-3 mb-6">
                {plan.limits.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2.5 text-sm">
                    <div className="p-0.5 bg-green-500/10 rounded-full mt-0.5">
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={
                  currentPlan === plan.id ||
                  loading === plan.id ||
                  plan.id === "free"
                }
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                  currentPlan === plan.id
                    ? "bg-green-600/20 text-green-400 cursor-not-allowed border border-green-600/30"
                    : plan.id === "free"
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-600"
                    : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:border-gray-600"
                }`}
              >
                {loading === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : currentPlan === plan.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    Current Plan
                  </>
                ) : plan.id === "free" ? (
                  "Contact Support"
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Upgrade Now
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-700 bg-gray-800/50">
          <h3 className="text-lg font-semibold text-white">Plan Comparison</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Compare features across all plans
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="text-left py-4 px-6 text-gray-400 font-semibold min-w-30">
                  Feature
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.id}
                    className="text-center py-4 px-6 text-gray-400 font-semibold min-w-25"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              <tr className="hover:bg-gray-750">
                <td className="py-4 px-6 text-gray-300 font-medium">Vaults</td>
                {plans.map((plan) => (
                  <td
                    key={plan.id}
                    className="text-center py-4 px-6 text-white font-semibold"
                  >
                    {plan.limits.vaults === 999 ? "∞" : plan.limits.vaults}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-750">
                <td className="py-4 px-6 text-gray-300 font-medium">Items</td>
                {plans.map((plan) => (
                  <td
                    key={plan.id}
                    className="text-center py-4 px-6 text-white font-semibold"
                  >
                    {plan.limits.itemsPerVault >= 1000
                      ? "∞"
                      : plan.limits.itemsPerVault}
                  </td>
                ))}
              </tr>
              {isOrgVault && (
                <tr className="hover:bg-gray-750">
                  <td className="py-4 px-6 text-gray-300 font-medium">
                    Members
                  </td>
                  {plans.map((plan) => (
                    <td
                      key={plan.id}
                      className="text-center py-4 px-6 text-white font-semibold"
                    >
                      {plan.limits.members === 999
                        ? "∞"
                        : plan.limits.members || "-"}
                    </td>
                  ))}
                </tr>
              )}
              <tr className="hover:bg-gray-750">
                <td className="py-4 px-6 text-gray-300 font-medium">Storage</td>
                {plans.map((plan) => (
                  <td
                    key={plan.id}
                    className="text-center py-4 px-6 text-white font-semibold"
                  >
                    {plan.limits.storage}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {currentPlan !== "free" && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-700 bg-gray-800/50">
            <h3 className="text-lg font-semibold text-white">
              Billing Actions
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">
              Manage your subscription settings
            </p>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 border border-gray-600"
                onClick={handleManageBilling}
              >
                <CreditCard className="w-4 h-4" />
                Manage Billing
              </button>
              <button
                className="px-5 py-2.5 bg-red-900/20 hover:bg-red-900/30 text-red-300 rounded-lg transition-colors text-sm font-medium border border-red-700/30"
                onClick={handleCancelSubscription}
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
