import React, { useState } from "react";
import { Check, Loader2, Shield } from "lucide-react";
import { User } from "@/types/vault";
import { BillingPlan, PlanType } from "./types";
import { toast } from "sonner";
import { createStripeCheckoutSession } from "@/actions/stripe-action";

interface PlanCardsProps {
  plans: BillingPlan[];
  currentPlan: PlanType;
  billingCycle: "monthly" | "yearly";
  user: User;
}

export const PlanCards: React.FC<PlanCardsProps> = ({
  plans,
  currentPlan,
  billingCycle,
  user,
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const hasActivePaidPlan = currentPlan !== "free";

  const handleUpgrade = async (planId: PlanType): Promise<void> => {
    if (hasActivePaidPlan) {
      toast.info("Please use the Manage Subscription portal to change your plan.");
      return;
    }

    if (planId === "free") {
      toast.info("Cannot select free plan.");
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

      if (result.success && result.message) {
        toast.success(result.message);
        setTimeout(() => window.location.reload(), 2000);
        return;
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to start upgrade process";
      console.error("Error upgrading plan:", error);
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {plans.map((plan) => {
        const price = billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;
        const savings =
          billingCycle === "yearly" ? plan.price.monthly * 12 - plan.price.yearly : 0;
        const isCurrentPlan = currentPlan === plan.id;
        const isFree = plan.id === "free";
        
        // Disable all buttons if user has active paid plan, except current plan display
        const isDisabled = hasActivePaidPlan || isFree || loading === plan.id;

        const getButtonContent = () => {
          if (loading === plan.id) {
            return (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            );
          }
          
          if (isCurrentPlan) {
            return (
              <>
                <Check className="w-4 h-4" />
                Current Plan
              </>
            );
          }
          
          if (isFree) {
            return "Contact Support";
          }
          
          if (hasActivePaidPlan) {
            return (
              <>
                <Shield className="w-4 h-4" />
                Manage via Portal
              </>
            );
          }
          
          return "Select Plan";
        };

        return (
          <div
            key={plan.id}
            className={`relative bg-gray-800 rounded-xl p-6 border transition-all duration-300 hover:shadow-xl ${
              plan.popular
                ? "border-blue-600/50 shadow-lg shadow-blue-500/10"
                : "border-gray-700 hover:border-gray-600"
            } ${
              isCurrentPlan
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

            {isCurrentPlan && (
              <div className="absolute -top-3 right-4">
                <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                  <Check size={12} />
                  Active
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-3">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-4xl font-bold text-white">₹{price}</span>
                {!isFree && (
                  <span className="text-gray-400 text-base ml-1">
                    /{billingCycle === "yearly" ? "year" : "month"}
                  </span>
                )}
              </div>
              {billingCycle === "yearly" && !isFree && savings > 0 && (
                <div className="flex items-center justify-center gap-1 text-sm text-green-400 font-medium">
                  <Check size={14} />
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
              onClick={() => handleUpgrade(plan.id as PlanType)}
              disabled={isDisabled}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                isCurrentPlan
                  ? "bg-green-600/20 text-green-400 cursor-not-allowed border border-green-600/30"
                  : isDisabled
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-600"
                  : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:shadow-lg hover:shadow-blue-500/20"
              }`}
            >
              {getButtonContent()}
            </button>
          </div>
        );
      })}
    </div>
  );
};
