export type PlanType = 'free' | 'pro' | 'enterprise';

export interface PlanLimits {
  vaults: number;
  itemsPerVault: number;
  members?: number;
  storage: string;
  features: string[];
}

export interface BillingPlan {
  id: PlanType;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  limits: PlanLimits;
  popular?: boolean;
}

export interface UserSubscription {
  plan: PlanType;
  status: 'active' | 'inactive' | 'canceled' | 'trial';
  current_period_end?: Date;
  cancel_at_period_end?: boolean;
}
