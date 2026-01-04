"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  verifyCheckoutSession,
  handleCheckoutCompleted,
} from "@/actions/stripe-action";
import { Check, Loader2, X } from "lucide-react";

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setStatus("error");
      setMessage("No session ID found");
      return;
    }

    const verifySession = async () => {
      try {
        const result = await verifyCheckoutSession(sessionId);

        if (result.success && result.session) {
          const session = result.session;

          await handleCheckoutCompleted({
            id: session.id,
            customer: session.customer as string,
            subscription: session.subscription as string,
            amount_total: session.amount_total || 0,
            metadata: {
              userId: session.metadata?.userId || "",
              vaultId: session.metadata?.vaultId || "",
              vaultType: session.metadata?.vaultType || "personal",
              planId: session.metadata?.planId || "pro",
              billingCycle: session.metadata?.billingCycle || "monthly",
            },
          });

          setStatus("success");
          setMessage(
            "Payment successful! Your subscription has been activated."
          );
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(result.error || "Payment verification failed");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("Failed to verify payment");
      }
    };

    verifySession();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">
                Verifying Payment
              </h1>
              <p className="text-gray-400">Please wait...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <Check className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Payment Successful!
              </h1>
              <p className="text-gray-400 mb-4">{message}</p>
              <p className="text-sm text-gray-500">
                Redirecting to billing page...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <X className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Payment Failed
              </h1>
              <p className="text-gray-400 mb-4">{message}</p>
              <button
                onClick={() => router.push("/billing")}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Return to Billing
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
