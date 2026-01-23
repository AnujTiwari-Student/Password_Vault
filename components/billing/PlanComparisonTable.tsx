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
  // Helper to get org limit if not present in plan object, matching api/orgs/route.ts
  const getOrgLimit = (plan: BillingPlan) => {
    // @ts-expect-error handling potential missing property on interface
    if (plan.limits.orgs) return plan.limits.orgs;
    
    const name = plan.name.toLowerCase();
    if (name.includes("enterprise")) return 8;
    if (name.includes("pro")) return 5;
    return 2; // Basic/Free default
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Plan Comparison</h3>
        <p className="text-gray-600 text-sm mt-0.5">Compare features across all plans</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-4 px-6 text-gray-700 font-semibold min-w-30">
                Feature
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.id}
                  className="text-center py-4 px-6 text-gray-700 font-semibold min-w-25"
                >
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="py-4 px-6 text-gray-700 font-medium">Items</td>
              {plans.map((plan) => (
                <td key={plan.id} className="text-center py-4 px-6 text-gray-900 font-semibold">
                  {plan.limits.itemsPerVault >= 2000 ? "∞" : plan.limits.itemsPerVault}
                </td>
              ))}
            </tr>
            
            {/* Organization Limit Row */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="py-4 px-6 text-gray-700 font-medium">Organizations</td>
              {plans.map((plan) => (
                <td key={plan.id} className="text-center py-4 px-6 text-gray-900 font-semibold">
                  {getOrgLimit(plan)}
                </td>
              ))}
            </tr>

            {isOrgVault && (
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-gray-700 font-medium">Members</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center py-4 px-6 text-gray-900 font-semibold">
                    {plan.limits.members || "-"}
                  </td>
                ))}
              </tr>
            )}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="py-4 px-6 text-gray-700 font-medium">Storage</td>
              {plans.map((plan) => (
                <td key={plan.id} className="text-center py-4 px-6 text-gray-900 font-semibold">
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