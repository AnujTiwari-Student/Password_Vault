import React from "react";

interface BillingCycleToggleProps {
  billingCycle: "monthly" | "yearly";
  setBillingCycle: (cycle: "monthly" | "yearly") => void;
}

export const BillingCycleToggle: React.FC<BillingCycleToggleProps> = ({
  billingCycle,
  setBillingCycle,
}) => {
  return (
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
  );
};
