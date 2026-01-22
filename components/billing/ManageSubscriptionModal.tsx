import React, { useState } from "react";
import {
  X,
  CreditCard,
  Calendar,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { BillingData, BillingPlan, PlanType } from "./types";
import { toast } from "sonner";
import axios from "axios";

interface ManageSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  billingData: BillingData | null;
  currentPlan: PlanType;
  plans: BillingPlan[];
  vaultId: string;
  userId: string;
}

export const ManageSubscriptionModal: React.FC<ManageSubscriptionModalProps> = ({
  isOpen,
  onClose,
  billingData,
  currentPlan,
  plans,
  vaultId,
  userId,
}) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const currentPlanDetails = plans.find((p) => p.id === currentPlan);

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will have access until the end of your current billing period.")) {
      return;
    }

    setIsCancelling(true);
    try {
      const result = await axios.post('/api/subscription/cancel', {
        vaultId,
        userId,
      }).then(res => res.data);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Subscription cancelled successfully. You will have access until the end of your billing period.");
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to cancel subscription";
      toast.error(message);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl border border-gray-200 w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Manage Subscription</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                  <CheckCircle size={18} className="text-green-600" />
                </div>
                Current Subscription
              </h3>
              <div className="grid gap-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600 text-sm font-medium">Plan</span>
                  <span className="text-gray-900 font-semibold">
                    {currentPlanDetails?.name || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600 text-sm font-medium">Status</span>
                  <span className="text-green-600 font-semibold capitalize">
                    {billingData?.status || "Active"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600 text-sm font-medium">Amount</span>
                  <span className="text-gray-900 font-semibold">
                    ₹{billingData?.amount?.toFixed(2) || "0.00"}/
                    {billingData?.billingCycle === "annually" ? "year" : "month"}
                  </span>
                </div>
                {billingData?.nextBillingDate && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm font-medium">Next Billing Date</span>
                    <span className="text-gray-900 font-semibold">
                      {new Date(billingData.nextBillingDate).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
                {billingData?.cancelAtPeriodEnd && (
                  <div className="mt-2 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                    <p className="text-yellow-700 text-sm flex items-center gap-2 font-medium">
                      <AlertTriangle size={16} />
                      Your subscription will be canceled at the end of the billing period
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                  <CreditCard size={18} className="text-blue-600" />
                </div>
                Payment Method
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm font-medium">Current Method</span>
                <span className="text-gray-900 font-semibold">
                  {billingData?.paymentMethod || "Razorpay"}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                  <Calendar size={18} className="text-purple-600" />
                </div>
                Billing Cycle
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm font-medium">Cycle</span>
                <span className="text-gray-900 font-semibold capitalize">
                  {billingData?.billingCycle === "annually" ? "Yearly" : "Monthly"}
                </span>
              </div>
            </div>

            {!billingData?.cancelAtPeriodEnd && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Cancel Subscription
                </h3>
                <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                  You will have access until the end of your current billing period. Your subscription will not auto-renew.
                </p>
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="w-full px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Cancel Subscription
                    </>
                  )}
                </button>
              </div>
            )}

            {billingData?.cancelAtPeriodEnd && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Subscription Scheduled for Cancellation
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Your subscription is set to cancel on{" "}
                  {billingData.nextBillingDate && 
                    new Date(billingData.nextBillingDate).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  }. You will continue to have access until then.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-semibold border border-gray-300 shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
