"use client";

import React from "react";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { AuditLogsTable } from "@/components/audit/AuditLogsTable";
import { SecurityCenter } from "@/components/security/SecurityCenter";
import VaultSetting from "@/components/vaults/VaultSetting";
import { TeamManagement } from "@/components/teams/TeamManagement";
import { OrganizationManagement } from "@/components/org/OrganizationManagement";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import type { User } from "@/types/vault";
import type { DashboardTab } from "@/types/dashboard";
import { UnifiedVaultList } from "../vaults/ItemList";

interface DashboardContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  currentOrgId?: string;
}

const ContentWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="w-full animate-fadeIn">{children}</div>;

export const DashboardContent: React.FC<DashboardContentProps> = ({
  activeTab,
  setActiveTab,
  user,
  currentOrgId,
}) => {
  const renderContent = () => {
    switch (activeTab as DashboardTab) {
      case "Dashboard":
        return <DashboardOverview setActiveTab={setActiveTab} />;

      case "Items":
      case "Org Items":
        return <UnifiedVaultList />;

      case "Audits":
        return <AuditLogsTable />;

      case "Security":
        return <SecurityCenter />;

      case "Settings":
        return <VaultSetting />;

      case "Members":
        // @ts-expect-error orgId is guaranteed to be defined here
        return <TeamManagement vault={user.vault} user={user} />;

      case "Manage":
        return (
          <OrganizationManagement 
            user={user} 
            orgId={currentOrgId || user.org?.id || ''} 
            key={currentOrgId || user.org?.id}
          />
        );

      case "Active":
        return <NotificationBadge />;

      default:
        return <DashboardOverview setActiveTab={setActiveTab} />;
    }
  };

  return <ContentWrapper>{renderContent()}</ContentWrapper>;
};