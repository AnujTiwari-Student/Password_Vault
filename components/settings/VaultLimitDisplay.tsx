"use client";

import React, { useState, useEffect } from 'react';
import { Database, AlertCircle, Loader2 } from 'lucide-react';
import { Vault, User } from '@/types/vault';
import { PlanType } from '@/types/billing';
import { toast } from 'sonner';

interface UsageData {
  passwords: { current: number; limit: number };
  members: { current: number; limit: number };
  storage: { current: number; limit: number };
  twoFaEnabled: boolean;
}

interface VaultLimitsDisplayProps {
  vault: Vault;
  user: User;
}

export const VaultLimitsDisplay: React.FC<VaultLimitsDisplayProps> = ({ vault }) => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const userPlan: PlanType = 'free'; // TODO: Get from user data

  useEffect(() => {
    const fetchUsage = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/vault/${vault.id}/usage`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch usage data');
        }
        
        const data = await response.json();
        setUsage(data);
      } catch (error: unknown) {
        console.error('Failed to fetch vault usage:', error);
        toast.error('Failed to load usage data');
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [vault.id]);

  const getUsageColor = (used: number, limit: number): string => {
    if (limit === -1 || limit === 0) return 'text-green-600';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-amber-600';
    return 'text-green-600';
  };

  const getProgressColor = (used: number, limit: number): string => {
    if (limit === -1 || limit === 0) return 'bg-blue-600';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 70) return 'bg-amber-600';
    return 'bg-blue-600';
  };

  const calculatePercentage = (used: number, limit: number): number => {
    if (limit === -1 || limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const formatLimit = (limit: number): string => {
    if (limit === -1) return '∞';
    return limit.toString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600 font-medium">Loading usage data...</span>
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center py-12">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Failed to load usage data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
          <Database className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Usage & Limits</h3>
          <p className="text-sm text-gray-600">Current plan usage overview</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Current Plan Badge */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Current Plan</p>
            <p className="text-xs text-gray-500 capitalize font-medium">{userPlan.replace('_', ' ')}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0 ${
            userPlan === 'free' 
              ? 'bg-gray-100 text-gray-700 border-gray-200'
              : userPlan === 'pro'
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : 'bg-purple-100 text-purple-800 border-purple-200'
          }`}>
            {userPlan.toUpperCase()}
          </div>
        </div>

        {/* Usage Metrics */}
        <div className="space-y-6">
          {/* Vault Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Vault Items</span>
              <span className={`text-sm font-semibold ${getUsageColor(usage.passwords.current, usage.passwords.limit)}`}>
                {usage.passwords.current} / {formatLimit(usage.passwords.limit)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-700 ease-out shadow-sm ${getProgressColor(usage.passwords.current, usage.passwords.limit)}`}
                style={{ width: `${calculatePercentage(usage.passwords.current, usage.passwords.limit)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {calculatePercentage(usage.passwords.current, usage.passwords.limit).toFixed(1)}% used
            </p>
          </div>

          {/* Members (org vaults only) */}
          {vault.type === 'org' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Organization Members</span>
                <span className={`text-sm font-semibold ${getUsageColor(usage.members.current, usage.members.limit)}`}>
                  {usage.members.current} / {formatLimit(usage.members.limit)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ease-out shadow-sm ${getProgressColor(usage.members.current, usage.members.limit)}`}
                  style={{ width: `${calculatePercentage(usage.members.current, usage.members.limit)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {calculatePercentage(usage.members.current, usage.members.limit).toFixed(1)}% used
              </p>
            </div>
          )}

          {/* Storage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Storage</span>
              <span className={`text-sm font-semibold ${getUsageColor(usage.storage.current, usage.storage.limit)}`}>
                {(usage.storage.current / 1024 / 1024).toFixed(1)} MB / 
                {usage.storage.limit === -1 ? ' ∞' : ` ${(usage.storage.limit / 1024 / 1024).toFixed(0)} MB`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-700 ease-out shadow-sm ${getProgressColor(usage.storage.current, usage.storage.limit)}`}
                style={{ width: `${calculatePercentage(usage.storage.current, usage.storage.limit)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {calculatePercentage(usage.storage.current, usage.storage.limit).toFixed(1)}% used
            </p>
          </div>
        </div>

        <div className="gap-4 pt-2">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Two-Factor Authentication</span>
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                usage.twoFaEnabled
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {usage.twoFaEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>

          {usage.passwords.limit > 0 && (usage.passwords.current / usage.passwords.limit) >= 0.9 && (
            <div className="md:col-span-2 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900 text-sm">Item Limit Warning</p>
                  <p className="text-sm text-red-800">
                    You are approaching your item limit. Consider upgrading your plan.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
