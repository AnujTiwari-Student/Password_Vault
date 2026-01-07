export interface BillingData {
  plan: string;
  status: string;
  nextBillingDate?: string | null;
  amount?: number;
  paymentMethod?: string;
  currency?: string;
  billingCycle?: string;
  cancelAtPeriodEnd?: boolean;
  subscriptionId?: string;
}

export interface BillingPlanLimits {
  vaults: number;
  itemsPerVault: number;
  storage: string;
  members?: number;
  features: string[];
}

export interface BillingPlan {
  id: string;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  limits: BillingPlanLimits;
  popular?: boolean;
}

export type PlanType = "free" | "pro" | "enterprise";
