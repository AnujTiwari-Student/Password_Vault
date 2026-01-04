import React, { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
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
    if (limit === -1 || limit === 0) return 'text-green-400';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getProgressColor = (used: number, limit: number): string => {
    if (limit === -1 || limit === 0) return 'bg-blue-500';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-blue-500';
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
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-400">Loading usage data...</span>
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
        <p className="text-gray-400">Failed to load usage data</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Database className="w-5 h-5" />
        Usage & Limits
      </h3>
      
      <div className="space-y-6">
        {/* Current Plan Badge */}
        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
          <div>
            <p className="font-medium text-white">Current Plan</p>
            <p className="text-sm text-gray-400 capitalize">{userPlan.replace('_', ' ')}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs border ${
            userPlan === 'free' 
              ? 'bg-gray-900/30 text-gray-300 border-gray-700/30'
              : userPlan === 'pro'
              ? 'bg-blue-900/30 text-blue-300 border-blue-700/30'
              : 'bg-purple-900/30 text-purple-300 border-purple-700/30'
          }`}>
            {userPlan.toUpperCase()}
          </div>
        </div>

        {/* Usage Bars */}
        <div className="space-y-4">
          {/* Items/Passwords */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Vault Items</span>
              <span className={`text-sm font-medium ${getUsageColor(usage.passwords.current, usage.passwords.limit)}`}>
                {usage.passwords.current} / {formatLimit(usage.passwords.limit)}
              </span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(usage.passwords.current, usage.passwords.limit)}`}
                style={{ width: `${calculatePercentage(usage.passwords.current, usage.passwords.limit)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {calculatePercentage(usage.passwords.current, usage.passwords.limit).toFixed(1)}% used
            </p>
          </div>

          {/* Members (org vaults only) */}
          {vault.type === 'org' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Organization Members</span>
                <span className={`text-sm font-medium ${getUsageColor(usage.members.current, usage.members.limit)}`}>
                  {usage.members.current} / {formatLimit(usage.members.limit)}
                </span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(usage.members.current, usage.members.limit)}`}
                  style={{ width: `${calculatePercentage(usage.members.current, usage.members.limit)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {calculatePercentage(usage.members.current, usage.members.limit).toFixed(1)}% used
              </p>
            </div>
          )}

          {/* Storage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Storage</span>
              <span className={`text-sm font-medium ${getUsageColor(usage.storage.current, usage.storage.limit)}`}>
                {(usage.storage.current / 1024 / 1024).toFixed(2)} MB / 
                {usage.storage.limit === -1 ? ' ∞' : ` ${(usage.storage.limit / 1024 / 1024).toFixed(0)} MB`}
              </span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(usage.storage.current, usage.storage.limit)}`}
                style={{ width: `${calculatePercentage(usage.storage.current, usage.storage.limit)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {calculatePercentage(usage.storage.current, usage.storage.limit).toFixed(1)}% used
            </p>
          </div>

          {/* 2FA Status */}
          <div className="pt-4 border-t border-gray-700/30">
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <span className="text-sm font-medium text-gray-300">Two-Factor Authentication</span>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                usage.twoFaEnabled
                  ? 'bg-green-900/30 text-green-300 border border-green-700/30'
                  : 'bg-red-900/30 text-red-300 border border-red-700/30'
              }`}>
                {usage.twoFaEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {usage.passwords.limit > 0 && (usage.passwords.current / usage.passwords.limit) >= 0.9 && (
          <div className="flex items-start gap-3 p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-300 font-medium">Item Limit Warning</p>
              <p className="text-sm text-red-200">
                Youre approaching your item limit. Consider upgrading your plan to add more items.
              </p>
            </div>
          </div>
        )}

        {userPlan === 'free' && (
          <div className="flex items-start gap-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-300 font-medium">Free Plan Limits</p>
              <p className="text-sm text-blue-200">
                Upgrade to Pro to get more storage, unlimited items, and advanced features.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
