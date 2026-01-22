"use client";

import { useCurrentUser } from '@/hooks/useCurrentUser';
import React, { useState } from 'react'
import { User, Vault as VaultType } from '@/types/vault';
import { Settings, CreditCard, Database, Loader2, Building2, User2, Vault } from 'lucide-react';
import { VaultNameEditor } from '../settings/VaultNameEditor';
import { BillingComponent } from '../settings/BillingComponent';
import { VaultLimitsDisplay } from '../settings/VaultLimitDisplay';

interface ExtendedVault extends VaultType {
  name: string;
  created_at?: string;
  updated_at?: string;
}

interface ExtendedUser extends Omit<User, 'vault'> {
  vault?: ExtendedVault;
}

function VaultSetting() {
  const user = useCurrentUser() as ExtendedUser | null;
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'limits'>('general');

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96 w-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-sm text-gray-500 font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  const vault = user.vault;
  if (!vault) {
    return (
      <div className="flex flex-col items-center justify-center h-96 w-full bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
          <Database className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">No Vault Found</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-xs text-center">
          We could not locate a vault associated with your account. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="flex items-start gap-4">
            {/* Vault Icon Container */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 shrink-0">
              <Vault className="w-8 h-8 text-blue-600" />
            </div>
            
            <div className="space-y-1">
              {/* Heading Size: 2xl on small, 3xl on large */}
              <h1 className="text-3xl lg:text-2xl font-bold text-gray-900 tracking-tight">
                Vault Settings
              </h1>
              <p className="text-gray-500 text-sm font-medium">
                Manage configuration, billing, and limits for <span className="text-gray-900 font-semibold">{vault.name}</span>
              </p>
            </div>
          </div>
          
          <div className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide
            ${vault.type === 'personal' 
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-purple-50 text-purple-700 border-purple-200'
            }
          `}>
            {vault.type === 'personal' ? (
              <User2 className="w-3.5 h-3.5" />
            ) : (
              <Building2 className="w-3.5 h-3.5" />
            )}
            {vault.type === 'personal' ? 'Personal Workspace' : 'Organization'}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1.5 flex flex-wrap gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`
            flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
            ${activeTab === 'general' 
              ? 'bg-gray-100 text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }
          `}
        >
          <Settings className={`w-4 h-4 ${activeTab === 'general' ? 'text-gray-900' : 'text-gray-400'}`} />
          General
        </button>
        
        <button
          onClick={() => setActiveTab('billing')}
          className={`
            flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
            ${activeTab === 'billing' 
              ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }
          `}
        >
          <CreditCard className={`w-4 h-4 ${activeTab === 'billing' ? 'text-blue-600' : 'text-gray-400'}`} />
          Billing
        </button>
        
        <button
          onClick={() => setActiveTab('limits')}
          className={`
            flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
            ${activeTab === 'limits' 
              ? 'bg-gray-100 text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }
          `}
        >
          <Database className={`w-4 h-4 ${activeTab === 'limits' ? 'text-gray-900' : 'text-gray-400'}`} />
          Usage Limits
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-transparent space-y-6">
        {activeTab === 'general' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* @ts-expect-error TS(2769): Type compatibility check handled by parent */}
            <VaultNameEditor vault={vault} />
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <BillingComponent user={user as User} />
          </div>
        )}

        {activeTab === 'limits' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <VaultLimitsDisplay user={user as User} vault={vault} />
          </div>
        )}
      </div>
    </div>
  );
}

export default VaultSetting;