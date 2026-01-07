import React, { useState } from "react";
import {
  X,
  CreditCard,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { BillingData, BillingPlan, PlanType } from "./types";
import { toast } from "sonner";
import { createStripePortalSession } from "@/actions/stripe-action";

interface ManageSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  billingData: BillingData | null;
  currentPlan: PlanType;
  plans: BillingPlan[];
}

export const ManageSubscriptionModal: React.FC<ManageSubscriptionModalProps> = ({
  isOpen,
  onClose,
  billingData,
  currentPlan,
  plans,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const currentPlanDetails = plans.find((p) => p.id === currentPlan);

  const handleOpenStripePortal = async () => {
    setIsLoading(true);
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
        error instanceof Error ? error.message : "Failed to open billing portal";
      toast.error(message);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl minimal-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Manage Subscription</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Current Subscription Status */}
            <div className="bg-gray-750 rounded-lg p-5 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-green-400" />
                Current Subscription
              </h3>
              <div className="grid gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Plan</span>
                  <span className="text-white font-semibold">
                    {currentPlanDetails?.name || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Status</span>
                  <span className="text-green-400 font-semibold capitalize">
                    {billingData?.status || "Active"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Amount</span>
                  <span className="text-white font-semibold">
                    ₹{billingData?.amount?.toFixed(2) || "0.00"}/month
                  </span>
                </div>
                {billingData?.nextBillingDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Next Billing Date</span>
                    <span className="text-white font-semibold">
                      {new Date(billingData.nextBillingDate).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
                {billingData?.cancelAtPeriodEnd && (
                  <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 text-sm flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Your subscription will be canceled at the end of the billing period
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-gray-750 rounded-lg p-5 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-blue-400" />
                Payment Method
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Current Method</span>
                <span className="text-white font-semibold">
                  {billingData?.paymentMethod || "Not set"}
                </span>
              </div>
            </div>

            {/* Billing Cycle */}
            <div className="bg-gray-750 rounded-lg p-5 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-purple-400" />
                Billing Cycle
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Cycle</span>
                <span className="text-white font-semibold capitalize">
                  {billingData?.billingCycle || "Monthly"}
                </span>
              </div>
            </div>

            {/* Stripe Portal Actions */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-white mb-2">
                Full Subscription Management
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Access the Stripe billing portal to update payment methods, change billing cycle,
                view all invoices, and manage or cancel your subscription.
              </p>
              <button
                onClick={handleOpenStripePortal}
                disabled={isLoading}
                className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening Portal...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Open Stripe Billing Portal
                  </>
                )}
              </button>
            </div>

            {/* Cancel Warning */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle size={20} />
                Cancel Subscription
              </h3>
              <p className="text-gray-400 text-sm">
                To cancel your subscription, use the Stripe billing portal above. You will have
                access until the end of your current billing period.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium border border-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
