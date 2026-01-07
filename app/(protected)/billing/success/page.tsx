"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  verifyCheckoutSession,
  getSubscriptionDetails,
  handleCheckoutCompleted,
} from "@/actions/stripe-action";
import { Check, Loader2, X } from "lucide-react";

interface StripeSession {
  id: string;
  customer: string;
  subscription: string;
  amount_total: number;
  metadata?: {
    userId?: string;
    vaultId?: string;
    vaultType?: string;
    planId?: string;
    billingCycle?: string;
  };
}

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "processing">("loading");
  const [message, setMessage] = useState("");
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [sessionData, setSessionData] = useState<StripeSession | null>(null);

  console.log("🚦 BillingSuccessPage loaded", sessionData);

  // Memoized manual creation function to avoid recreation
  const createSubscriptionManually = useCallback(async (session: StripeSession) => {
    try {
      setStatus("processing");
      setMessage("Finalizing subscription...");
      
      console.log("🔧 Manual creation for:", session.metadata?.vaultId);
      
      await handleCheckoutCompleted({
        id: session.id,
        customer: session.customer,
        subscription: session.subscription,
        amount_total: session.amount_total,
        metadata: {
          userId: session.metadata?.userId || "",
          vaultId: session.metadata?.vaultId || "",
          vaultType: session.metadata?.vaultType || "personal",
          planId: session.metadata?.planId || "pro",
          billingCycle: session.metadata?.billingCycle || "monthly",
        },
      });
      
      setMessage("Subscription activated successfully!");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (error) {
      console.error("❌ Manual creation failed:", error);
      setStatus("error");
      setMessage("Failed to activate. Please contact support.");
    }
  }, [router]);

  useEffect(() => {
    let isCancelled = false;
    let attempts = 0;
    const maxAttempts = 10;
    let timeoutId: NodeJS.Timeout;

    const checkSubscription = async (vaultId?: string, session: StripeSession | null = null) => {
      if (isCancelled) return;
      
      attempts++;
      console.log(`🔍 Attempt ${attempts}/${maxAttempts}`);
      
      try {
        setPollingAttempts(attempts);
        const subDetails = await getSubscriptionDetails(vaultId);
        console.log("📋 Subscription:", subDetails);

        if (subDetails.plan && subDetails.plan !== "free") {
          console.log("✅ Found subscription:", subDetails.plan);
          setMessage("Subscription activated successfully!");
          setTimeout(() => router.push("/dashboard"), 1500);
          return;
        }

        if (attempts < maxAttempts && session) {
          timeoutId = setTimeout(() => checkSubscription(vaultId, session), 2000);
        } else if (session) {
          await createSubscriptionManually(session);
        }
      } catch (error) {
        console.error("❌ Check failed:", error);
        if (attempts < maxAttempts && !isCancelled && session) {
          timeoutId = setTimeout(() => checkSubscription(vaultId, session), 2000);
        }
      }
    };

    const startPolling = async (session: StripeSession) => {
      const vaultId = session.metadata?.vaultId;
      console.log("🚀 Polling for vault/org:", vaultId);
      checkSubscription(vaultId, session);
    };

    const verifyAndStart = async () => {
      const sessionId = searchParams.get("session_id");
      if (!sessionId) {
        setStatus("error");
        setMessage("No session ID found");
        return;
      }

      try {
        console.log("🔐 Verifying:", sessionId);
        const result = await verifyCheckoutSession(sessionId);
        
        if (!result.success || !result.session) {
          setStatus("error");
          setMessage(result.error || "Verification failed");
          return;
        }

        const session = result.session as StripeSession;
        setSessionData(session);
        setStatus("success");
        setMessage("Payment successful! Activating subscription...");
        
        startPolling(session);
      } catch (error) {
        console.error("❌ Verification failed:", error);
        setStatus("error");
        setMessage("Payment verification failed");
      }
    };

    verifyAndStart();

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Empty deps = runs ONCE, no ESLint warnings on Vercel

  // Rest of JSX unchanged...
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Verifying Payment</h1>
              <p className="text-gray-400">Please wait while we confirm your payment...</p>
            </>
          )}

          {(status === "success" || status === "processing") && (
            <>
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <Check className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
              <p className="text-gray-400 mb-4">{message}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {status === "processing" 
                    ? "Activating subscription..." 
                    : `Checking subscription status... (${pollingAttempts}/10)`}
                </span>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <X className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Activation Failed</h1>
              <p className="text-gray-400 mb-6">{message}</p>
              <div className="space-y-3 w-full">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
