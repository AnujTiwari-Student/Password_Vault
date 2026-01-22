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
      <div className="bg-white p-1.5 rounded-lg border-2 border-gray-200 inline-flex shadow-sm">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`px-6 py-2.5 rounded-md transition-all font-semibold text-sm ${
            billingCycle === "monthly"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("yearly")}
          className={`px-6 py-2.5 rounded-md transition-all relative font-semibold text-sm ${
            billingCycle === "yearly"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          Yearly
          <span className="absolute -top-2 -right-2 bg-green-500 text-xs px-2 py-0.5 rounded-full text-white font-bold shadow-sm">
            Save
          </span>
        </button>
      </div>
    </div>
  );
};
