"use client";

import React from 'react';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="min-h-screen text-white flex">
      <AppSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <SidebarTrigger className='relative' />
      <main className="flex-1 px-2 py-8 -ml-6 mr-1 md:px-8 md:py-8 md:mr-2 w-max">
        {children}
      </main>
    </div>
  );
};
