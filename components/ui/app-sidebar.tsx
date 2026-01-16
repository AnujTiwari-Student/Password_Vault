"use client";

import * as React from "react";
import {
  BellRing,
  Building,
  GalleryVerticalEnd,
  SquareTerminal,
  Vault,
} from "lucide-react";

import { NavMain } from "@/components/ui/nav-main";
import { NavUser } from "@/components/ui/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { TeamSwitcher } from "./team-switcher";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useNotifications";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AppSidebar({
  activeTab,
  setActiveTab,
  ...props
}: AppSidebarProps) {
  const user = useCurrentUser();
  const { hasNotifications } = useNotifications();

  const isOrgAccount = React.useMemo(() => {
    return user?.account_type === 'org';
  }, [user?.account_type]);

  if (!user) {
    return null;
  }

  const data = {
    teams: [
      {
        name: "Design Engineering",
        logo: GalleryVerticalEnd,
        plan: "Enterprise",
      },
    ],
    navMain: [
      {
        title: "Workground",
        url: "#",
        icon: SquareTerminal,
        isActive: true,
        items: [
          {
            title: "Dashboard",
            url: "#",
          },
          {
            title: "Audits",
            url: "#",
          },
          {
            title: "Security",
            url: "#",
          },
        ],
      },
      {
        title: "Vault Settings",
        url: "#",
        icon: Vault,
        items: [
          {
            title: "Settings",
            url: "#",
          },
          {
            title: "Items",
            url: "#",
          },
        ],
      },
      ...(isOrgAccount ? [{
        title: "Teams",
        url: "#",
        icon: Building,
        items: [
          {
            title: "Members",
            url: "#",
          },
          {
            title: "Manage",
            url: "#",
          },
        ],
      }] : []),
      {
        title: "Notifications",
        url: "#",
        icon: BellRing,
        hasNotification: hasNotifications,
        items: [
          {
            title: "Active",
            url: "#",
          },
        ],
      },
    ],
  };

  return (
    <Sidebar className="py-2" variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader className="bg-gray-900">
        {/* @ts-expect-error Todo: Type missmatch */}
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent className="bg-gray-900">
        <NavMain
          items={data.navMain}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </SidebarContent>
      <SidebarFooter className="bg-gray-900">
        {/* @ts-expect-error Todo: Type missmatch */}
        <NavUser user={user} onTabChange={setActiveTab} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}