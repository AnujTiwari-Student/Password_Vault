"use client";

import React, { useState } from "react";
import { Building, Plus, Check, ChevronDown } from "lucide-react";
import { canCreateOrg } from "@/utils/permission-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const OrgSwitcher: React.FC = () => {
  const user = useCurrentUser();
  const [selectedOrgId, setSelectedOrgId] = useState(user?.org?.id);

  const memberships = user?.member
    ? Array.isArray(user.member)
      ? user.member
      : [user.member]
    : [];

  if (!user) return null;
  // @ts-expect-error TS(2769)
  const canUserCreateOrg = canCreateOrg(user);

  if (memberships.length === 0 && !canUserCreateOrg) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 w-full px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-colors text-left">
        <Building className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {user?.org?.name || "Select Organization"}
          </p>
          <p className="text-xs text-gray-400">
            {memberships.length} {memberships.length === 1 ? "org" : "orgs"}
          </p>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 bg-gray-800 border-gray-700"
        align="start"
      >
        <div className="px-2 py-1.5 text-xs font-semibold text-gray-400">
          Your Organizations
        </div>

        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.org_id}
            onClick={() => {
              setSelectedOrgId(membership.org_id);
              toast.success(
                `Switched to ${membership.org?.name || "organization"}`
              );
            }}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-sm text-white">
                  {membership.org?.name || "Organization"}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {membership.role}
                </p>
              </div>
            </div>
            {selectedOrgId === membership.org_id && (
              <Check className="w-4 h-4 text-green-400" />
            )}
          </DropdownMenuItem>
        ))}

        {canUserCreateOrg && (
          <>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem
              onClick={() => toast.info("Open create org modal")}
              className="flex items-center gap-2 cursor-pointer text-blue-400"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Create Organization</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
