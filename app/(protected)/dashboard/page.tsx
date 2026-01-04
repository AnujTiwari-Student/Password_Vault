"use client";

import React, { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

const DashboardPage = () => {
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState('Dashboard');

  useEffect(() => {
    if (user && !user.masterPassphraseSetupComplete) {
      redirect('/setup/master-passphrase');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading User Data...</div>
      </div>
    );
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <DashboardContent
        activeTab={activeTab}
        // @ts-expect-error Todo: Type missmatch
        user={user}
      />
    </DashboardLayout>
  );
};

export default DashboardPage;
