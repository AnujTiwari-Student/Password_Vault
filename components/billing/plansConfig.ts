import { BillingPlan } from "./types";

export const personalPlans: BillingPlan[] = [
  {
    id: "free",
    name: "Basic",
    price: { monthly: 0, yearly: 0 },
    limits: {
      vaults: 1,
      itemsPerVault: 100,
      storage: "1GB",
      features: ["100 Items", "Basic Security", "Web Access", "2FA Support", "Community Support"],
    },
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 749, yearly: 7490 },
    limits: {
      vaults: 5,
      itemsPerVault: 500,
      storage: "10GB",
      features: [
        "500 Items",
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
      vaults: 20,
      itemsPerVault: 1000,
      storage: "100GB",
      features: [
        "1000 Items",
        "Enterprise Security",
        "Custom Integrations",
        "Dedicated Support",
        "100GB Storage",
      ],
    },
  },
];

export const orgPlans: BillingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    limits: {
      vaults: 1,
      itemsPerVault: 100,
      members: 5,
      storage: "1GB",
      features: [
        "100 Items",
        "Up to 5 Members",
        "Basic Security",
        "Team Sharing",
        "2FA Support",
      ],
    },
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 2099, yearly: 20990 },
    limits: {
      vaults: 10,
      itemsPerVault: 500,
      members: 50,
      storage: "100GB",
      features: [
        "500 Items",
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
      itemsPerVault: 1000,
      members: 100,
      storage: "500GB",
      features: [
        "1000 Items",
        "Up to 100 Members",
        "Advanced Compliance",
        "SSO Integration",
        "Dedicated Support",
      ],
    },
  },
];
