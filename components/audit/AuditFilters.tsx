"use client";

import { Filter, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterState } from './types';

interface AuditFiltersProps {
  filters: FilterState;
  isOrgAccount: boolean;
  loading: boolean;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onApply: () => void;
  onClear: () => void;
}

export const AuditFilters: React.FC<AuditFiltersProps> = ({
  filters,
  isOrgAccount,
  loading,
  onFilterChange,
  onApply,
  onClear,
}) => {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center gap-2.5">
          <Filter size={18} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Filters</h3>
        </div>
      </div>
      
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Select 
            value={filters.action}
            onValueChange={(value) => onFilterChange('action', value)}
          >
            <SelectTrigger className="bg-gray-750 border-gray-700 text-white hover:border-gray-600 w-full">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {isOrgAccount ? (
                <>
                  <SelectGroup>
                    <SelectLabel className="text-gray-400">Organization Management</SelectLabel>
                    <SelectItem value="ORG_CREATED" className="text-white">Organization Created</SelectItem>
                    <SelectItem value="ORG_VIEWED" className="text-white">Organization Viewed</SelectItem>
                    <SelectItem value="ORG_UPDATED" className="text-white">Organization Updated</SelectItem>
                    <SelectItem value="ORG_DELETED" className="text-white">Organization Deleted</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-400">Member Management</SelectLabel>
                    <SelectItem value="MEMBER_ADDED" className="text-white">Member Added</SelectItem>
                    <SelectItem value="MEMBER_INVITED" className="text-white">Member Invited</SelectItem>
                    <SelectItem value="MEMBER_REMOVED" className="text-white">Member Removed</SelectItem>
                    <SelectItem value="MEMBER_ROLE_CHANGED" className="text-white">Member Role Changed</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-400">Vault & Security</SelectLabel>
                    <SelectItem value="VAULT_CREATED" className="text-white">Vault Created</SelectItem>
                    <SelectItem value="VAULT_ACCESSED" className="text-white">Vault Accessed</SelectItem>
                    <SelectItem value="VAULT_SHARED" className="text-white">Vault Shared</SelectItem>
                    <SelectItem value="UMK_SETUP" className="text-white">UMK Setup</SelectItem>
                    <SelectItem value="OVK_SETUP" className="text-white">OVK Setup</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-400">Items</SelectLabel>
                    <SelectItem value="ITEM_CREATED" className="text-white">Item Created</SelectItem>
                    <SelectItem value="ITEM_VIEWED" className="text-white">Item Viewed</SelectItem>
                    <SelectItem value="ITEM_DELETED" className="text-white">Item Deleted</SelectItem>
                    <SelectItem value="ITEM_SHARED" className="text-white">Item Shared</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-400">Invitations</SelectLabel>
                    <SelectItem value="INVITE_SENT" className="text-white">Invite Sent</SelectItem>
                    <SelectItem value="INVITE_ACCEPTED" className="text-white">Invite Accepted</SelectItem>
                    <SelectItem value="INVITE_REVOKED" className="text-white">Invite Revoked</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-400">Security</SelectLabel>
                    <SelectItem value="LOGIN_FAILED" className="text-white">Login Failed</SelectItem>
                    <SelectItem value="PASSWORD_CHANGED" className="text-white">Password Changed</SelectItem>
                    <SelectItem value="PERMISSION_CHANGED" className="text-white">Permission Changed</SelectItem>
                    <SelectItem value="SUSPICIOUS_ACTIVITY" className="text-white">Suspicious Activity</SelectItem>
                  </SelectGroup>
                </>
              ) : (
                <>
                  <SelectGroup>
                    <SelectLabel className="text-gray-400">Personal Setup</SelectLabel>
                    <SelectItem value="PERSONAL_SETUP" className="text-white">Personal Setup</SelectItem>
                    <SelectItem value="STORE_PRIVATE_KEY" className="text-white">Store Private Key</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-400">Items</SelectLabel>
                    <SelectItem value="ITEM_CREATED" className="text-white">Item Created</SelectItem>
                    <SelectItem value="ITEM_VIEWED" className="text-white">Item Viewed</SelectItem>
                    <SelectItem value="ITEM_DELETED" className="text-white">Item Deleted</SelectItem>
                    <SelectItem value="ITEM_SHARED" className="text-white">Item Shared</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-400">Vault</SelectLabel>
                    <SelectItem value="VAULT_ACCESSED" className="text-white">Vault Accessed</SelectItem>
                    <SelectItem value="VAULT_CREATED" className="text-white">Vault Created</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-400">Security</SelectLabel>
                    <SelectItem value="LOGIN_FAILED" className="text-white">Login Failed</SelectItem>
                    <SelectItem value="PASSWORD_CHANGED" className="text-white">Password Changed</SelectItem>
                    <SelectItem value="EMAIL_CHANGED" className="text-white">Email Changed</SelectItem>
                  </SelectGroup>
                </>
              )}
            </SelectContent>
          </Select>

          <Select 
            value={filters.subject_type}
            onValueChange={(value) => onFilterChange('subject_type', value)}
          >
            <SelectTrigger className="bg-gray-750 border-gray-700 text-white hover:border-gray-600 w-full">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {isOrgAccount ? (
                <>
                  <SelectItem value="org" className="text-white">Organization</SelectItem>
                  <SelectItem value="vault" className="text-white">Vault</SelectItem>
                  <SelectItem value="item" className="text-white">Item</SelectItem>
                  <SelectItem value="member" className="text-white">Member</SelectItem>
                  <SelectItem value="invite" className="text-white">Invite</SelectItem>
                  <SelectItem value="permission" className="text-white">Permission</SelectItem>
                  <SelectItem value="key" className="text-white">Key Management</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="PERSONAL_VAULT_SETUP" className="text-white">Personal Vault Setup</SelectItem>
                  <SelectItem value="CRYPTO_SETUP" className="text-white">Crypto Setup</SelectItem>
                  <SelectItem value="item" className="text-white">Item</SelectItem>
                  <SelectItem value="vault" className="text-white">Vault</SelectItem>
                  <SelectItem value="user" className="text-white">User</SelectItem>
                  <SelectItem value="auth" className="text-white">Authentication</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          
          <input
            type="date"
            value={filters.date}
            onChange={(e) => onFilterChange('date', e.target.value)}
            className="px-3 md:px-4 py-2 bg-gray-750 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 hover:border-gray-600 transition-colors"
          />
          
          <div className="flex gap-2">
            <button
              onClick={onApply}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors font-medium"
            >
              Apply
            </button>
            <button
              onClick={onClear}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
            >
              <X size={16} />
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
