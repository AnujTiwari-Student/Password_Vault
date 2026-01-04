"use client";

import React from 'react';
import { Key, Shield, Lock, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSession } from 'next-auth/react';
import { useState, useTransition, useEffect } from 'react';
import { toast } from 'sonner';
import { toggle2FA } from '@/actions/toggle-2fa';

export const SecurityCenter: React.FC = () => {
  const { data: session, update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    if (session?.user?.twofa_enabled !== undefined) {
      setIs2FAEnabled(session.user.twofa_enabled);
    }
  }, [session?.user?.twofa_enabled]);

  const handleToggle2FA = async (checked: boolean) => {
    startTransition(async () => {
      try {
        const result = await toggle2FA(checked);
        
        if (result.success) {
          setIs2FAEnabled(checked);
          await update();
          toast.success(result.message);
        } else {
          setIs2FAEnabled(!checked);
          toast.error(result.error || 'Failed to update 2FA settings');
        }
      } catch (error) {
        console.error('Error toggling 2FA:', error);
        setIs2FAEnabled(!checked);
        toast.error('An unexpected error occurred');
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-500/10 rounded-lg">
            <Lock size={24} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Security Center</h2>
        </div>
        <p className="text-gray-400 text-sm ml-14">
          Manage your account security and authentication settings
        </p>
      </div>

      {/* Security Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Master Passphrase Card */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all overflow-hidden group">
          <div className="px-6 py-5 border-b border-gray-700 bg-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Key className="text-blue-400" size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Master Passphrase</h3>
                <p className="text-gray-500 text-xs mt-0.5">Your primary security credential</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-5">
              <div className="flex items-start gap-2.5 mb-3">
                <Info size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">
                    Last changed <span className="font-semibold text-gray-300">45 days ago</span>
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    We recommend changing your passphrase every 90 days
                  </p>
                </div>
              </div>
            </div>
            
            <button className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/20 font-medium text-sm">
              Change Master Passphrase
            </button>
          </div>
        </div>

        {/* Two-Factor Authentication Card */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all overflow-hidden group">
          <div className="px-6 py-5 border-b border-gray-700 bg-gray-800/50">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg transition-colors ${
                is2FAEnabled 
                  ? 'bg-green-500/10 group-hover:bg-green-500/20' 
                  : 'bg-gray-700/50 group-hover:bg-gray-700'
              }`}>
                <Shield 
                  className={`${is2FAEnabled ? 'text-green-400' : 'text-gray-400'}`} 
                  size={22} 
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
                <p className="text-gray-500 text-xs mt-0.5">Add an extra layer of security</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-400 text-sm">Status:</span>
                <span className={`font-semibold text-sm ${
                  is2FAEnabled ? 'text-green-400' : 'text-red-400'
                }`}>
                  {is2FAEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              {is2FAEnabled ? (
                <div className="bg-green-900/20 border border-green-700/30 rounded-lg px-3 py-2.5">
                  <p className="text-green-300 text-xs font-medium">
                    ✓ Protected via Email code
                  </p>
                  <p className="text-green-400/70 text-xs mt-1">
                    Youll receive a verification code on each login
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-3 py-2.5">
                  <p className="text-yellow-300 text-xs font-medium">
                    ⚠ Account is not fully protected
                  </p>
                  <p className="text-yellow-400/70 text-xs mt-1">
                    Enable 2FA to secure your account
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between bg-gray-750 px-4 py-3 rounded-lg border border-gray-700">
              <Label 
                htmlFor="2fa-toggle" 
                className="text-sm font-medium text-gray-300 cursor-pointer"
              >
                Enable 2FA
              </Label>
              <Switch
                id="2fa-toggle"
                checked={is2FAEnabled}
                onCheckedChange={handleToggle2FA}
                disabled={isPending}
                className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-600"
              />
            </div>
            
            {isPending && (
              <div className="mt-3 flex items-center gap-2 text-blue-400 text-xs">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                <span>Updating 2FA settings...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recovery Codes Section - Commented Out */}
      {/*
      <div className="bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/10 rounded-lg">
              <Unlock className="text-yellow-400" size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Recovery Codes</h3>
              <p className="text-gray-500 text-xs mt-0.5">Backup access to your account</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-5">
            <div className="flex items-start gap-2.5">
              <Info size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-400 text-sm">
                Generate backup codes to access your account if you lose access to your 2FA device. 
                Store these codes in a safe place.
              </p>
            </div>
          </div>
          
          <button 
            className="px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all hover:shadow-lg hover:shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none font-medium text-sm"
            disabled={!is2FAEnabled}
          >
            Generate Recovery Codes
          </button>
          
          {!is2FAEnabled && (
            <div className="mt-3 bg-gray-750 border border-gray-700 rounded-lg px-3 py-2.5">
              <p className="text-gray-500 text-xs">
                ⓘ Enable 2FA first to generate recovery codes
              </p>
            </div>
          )}
        </div>
      </div>
      */}

      {/* Security Tips */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-5">
        <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <Shield size={16} className="text-blue-400" />
          Security Best Practices
        </h4>
        <ul className="space-y-2 text-gray-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>Use a unique, strong master passphrase that you dont use anywhere else</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>Enable two-factor authentication for enhanced account security</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>Never share your master passphrase or 2FA codes with anyone</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>Regularly review your security logs for suspicious activity</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
