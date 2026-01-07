import React from "react";
import { BillingPlan } from "./types";

interface PlanComparisonTableProps {
  plans: BillingPlan[];
  isOrgVault: boolean;
}

export const PlanComparisonTable: React.FC<PlanComparisonTableProps> = ({
  plans,
  isOrgVault,
}) => {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-700 bg-gray-800/50">
        <h3 className="text-lg font-semibold text-white">Plan Comparison</h3>
        <p className="text-gray-500 text-xs mt-0.5">Compare features across all plans</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/50">
              <th className="text-left py-4 px-6 text-gray-400 font-semibold min-w-30">
                Feature
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.id}
                  className="text-center py-4 px-6 text-gray-400 font-semibold min-w-25"
                >
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            <tr className="hover:bg-gray-750">
              <td className="py-4 px-6 text-gray-300 font-medium">Items</td>
              {plans.map((plan) => (
                <td key={plan.id} className="text-center py-4 px-6 text-white font-semibold">
                  {plan.limits.itemsPerVault >= 2000 ? "∞" : plan.limits.itemsPerVault}
                </td>
              ))}
            </tr>
            {isOrgVault && (
              <tr className="hover:bg-gray-750">
                <td className="py-4 px-6 text-gray-300 font-medium">Members</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center py-4 px-6 text-white font-semibold">
                    {plan.limits.members || "-"}
                  </td>
                ))}
              </tr>
            )}
            <tr className="hover:bg-gray-750">
              <td className="py-4 px-6 text-gray-300 font-medium">Storage</td>
              {plans.map((plan) => (
                <td key={plan.id} className="text-center py-4 px-6 text-white font-semibold">
                  {plan.limits.storage}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
