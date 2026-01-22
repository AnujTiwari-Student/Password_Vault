import React, { useState } from "react";
import { Check, Loader2, Shield, Sparkles } from "lucide-react";
import { User } from "@/types/vault";
import { BillingPlan, PlanType } from "./types";
import { toast } from "sonner";
import axios from "axios";
import { VerifyPaymentRequest } from "@/app/api/razorpay/verify/route";

interface PlanCardsProps {
  plans: BillingPlan[];
  currentPlan: PlanType;
  billingCycle: "monthly" | "yearly";
  user: User;
}

const PLAN_ID_MAP: Record<string, string> = {
  'free': 'basic',
  'basic': 'basic',
  'pro': 'professional',
  'professional': 'professional',
  'enterprise': 'enterprise',
};

export const PlanCards: React.FC<PlanCardsProps> = ({
  plans,
  currentPlan,
  billingCycle,
  user,
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  // @ts-expect-error -- Razorpay is loaded globally ---> globalThis.Razorpay
  const hasActivePaidPlan = currentPlan !== "free" && currentPlan !== "basic";

  const handleUpgrade = async (planId: PlanType): Promise<void> => {
    console.log("=== handleUpgrade called ===");
    console.log("Plan ID:", planId);
    console.log("User object:", user);
    console.log("User vault:", user.vault);
    
    if (hasActivePaidPlan) {
      toast.info("Please use the Manage Subscription portal to change your plan.");
      return;
    }

    // @ts-expect-error -- Razorpay is loaded globally ---
    if (planId === "free" || planId === "basic") {
      toast.info("Cannot select free plan.");
      return;
    }

    const backendPlanId = PLAN_ID_MAP[planId.toLowerCase()] || planId;
    console.log("Mapped plan ID:", backendPlanId);

    if (!user.vault?.id) {
      console.error("User has no vault!");
      toast.error("No vault found. Please create a vault first.");
      return;
    }

    let vaultType: 'org' | 'personal' = 'personal';
    
    if (user.vault.type) {
      vaultType = user.vault.type === 'org' ? 'org' : 'personal';
    }
    
    console.log("Vault type determined:", vaultType);

    setLoading(planId);
    
    try {
      const selectedPlan = plans.find(p => p.id === planId);
      if (!selectedPlan) {
        throw new Error("Plan not found");
      }

      const amount = billingCycle === "yearly" 
        ? selectedPlan.price.yearly 
        : selectedPlan.price.monthly;

      console.log("Selected plan:", selectedPlan);
      console.log("Amount:", amount);

      const orderPayload = {
        planId: backendPlanId,
        billingCycle,
        vaultId: user.vault.id,
        vaultType: vaultType, 
      };

      console.log("Creating Razorpay order with payload:", orderPayload);

      const result = await axios.post('/api/razorpay', orderPayload)
        .then(res => {
          console.log("✓ Razorpay order created:", res.data);
          return res.data;
        })
        .catch(err => {
          console.error("✗ Razorpay order creation failed");
          console.error("Status:", err.response?.status);
          console.error("Error data:", err.response?.data);
          throw err;
        });

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.success || !result.order) {
        throw new Error("Failed to create payment order");
      }

      console.log("Opening Razorpay checkout...");

      if (typeof window.Razorpay === 'undefined') {
        throw new Error("Razorpay SDK not loaded. Please refresh the page.");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: result.order.amount,
        currency: result.order.currency,
        name: "LovzMe",
        description: `${selectedPlan.name} - ${billingCycle} subscription`,
        order_id: result.order.id,
        handler: async function (response: VerifyPaymentRequest) {
          console.log("=== Payment successful ===");
          console.log("Razorpay response:", response);
          
          try {
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: backendPlanId, 
              billingCycle,
              vaultId: user.vault!.id,
              vaultType: vaultType, 
              amount: result.order.amount,
            };

            console.log("Verifying payment with payload:", verifyPayload);

            const verifyResult = await axios.post('/api/razorpay/verify', verifyPayload)
              .then(res => {
                console.log("✓ Payment verified:", res.data);
                return res.data;
              })
              .catch(err => {
                console.error("✗ Payment verification failed");
                console.error("Status:", err.response?.status);
                console.error("Error data:", err.response?.data);
                throw err;
              });

            if (verifyResult.success) {
              toast.success("Payment successful! Activating your subscription...");
              setTimeout(() => window.location.reload(), 2000);
            } else {
              throw new Error(verifyResult.error || "Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            if (axios.isAxiosError(error)) {
              const errorMsg = error.response?.data?.error || error.response?.data?.details || error.message;
              toast.error(`Payment verification failed: ${errorMsg}`);
            } else {
              toast.error("Payment verification failed. Please contact support.");
            }
          } finally {
            setLoading(null);
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: function() {
            setLoading(null);
            toast.info("Payment cancelled");
          }
        }
      };

      // @ts-expect-error -- Razorpay is loaded globally ---
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error: unknown) {
      console.error("Error in handleUpgrade:", error);
      
      let message = "Failed to start upgrade process";
      
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          message = error.response.data.error;
        } else if (error.response?.data?.details) {
          message = error.response.data.details;
        } else if (error.message) {
          message = error.message;
        }
        
        console.error("Axios error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        message = error.message;
      }
      
      toast.error(message);
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const price = billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;
        const savings =
          billingCycle === "yearly" ? plan.price.monthly * 12 - plan.price.yearly : 0;
        const isCurrentPlan = currentPlan === plan.id;
        const isFree = plan.id === "free" || plan.id === "basic";
        
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
                Already on Paid Plan
              </>
            );
          }
          
          return "Select Plan";
        };

        return (
          <div
            key={plan.id}
            className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 ${
              plan.popular
                ? "border-blue-500 shadow-lg"
                : isCurrentPlan
                ? "border-green-500 shadow-lg"
                : "border-gray-200 hover:border-gray-300 hover:shadow-md"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-orange-500 text-white text-xs px-4 py-1 rounded-full font-bold uppercase tracking-wide flex items-center gap-1">
                  <Sparkles size={12} />
                  Most Popular
                </span>
              </div>
            )}

            {isCurrentPlan && (
              <div className="absolute -top-3 right-4">
                <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                  <Check size={12} />
                  Current Plan
                </span>
              </div>
            )}

            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-500">
                  {plan.id === "free" ? "Free forever" : plan.id === "pro" ? "For ambitious teams & startups" : "For large organizations"}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-gray-900">₹{price}</span>
                  {!isFree && (
                    <span className="text-gray-500 text-lg">
                      /{billingCycle === "yearly" ? "mo" : "mo"}
                    </span>
                  )}
                </div>
                {billingCycle === "yearly" && !isFree && savings > 0 && (
                  <div className="mt-2 text-sm text-green-600 font-medium">
                    Save ₹{savings} yearly
                  </div>
                )}
              </div>

              <div className="mb-6 pt-6 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  What is Included
                </p>
                <div className="space-y-3">
                  {plan.limits.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleUpgrade(plan.id as PlanType)}
                disabled={isDisabled}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                  isCurrentPlan
                    ? "bg-green-100 text-green-700 cursor-not-allowed border border-green-200"
                    : isDisabled
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200"
                    : plan.popular
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    : "bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
                }`}
              >
                {getButtonContent()}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};