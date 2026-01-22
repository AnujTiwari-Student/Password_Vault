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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Filter size={18} className="text-blue-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Filters</h3>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Select 
            value={filters.action}
            onValueChange={(value) => onFilterChange('action', value)}
          >
            <SelectTrigger className="bg-white border-gray-300 text-gray-900 hover:border-gray-400 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {isOrgAccount ? (
                <>
                  <SelectGroup>
                    <SelectLabel className="text-gray-500 font-semibold">Organization Management</SelectLabel>
                    <SelectItem value="ORG_CREATED" className="text-gray-900 hover:bg-blue-50">Organization Created</SelectItem>
                    <SelectItem value="ORG_VIEWED" className="text-gray-900 hover:bg-blue-50">Organization Viewed</SelectItem>
                    <SelectItem value="ORG_UPDATED" className="text-gray-900 hover:bg-blue-50">Organization Updated</SelectItem>
                    <SelectItem value="ORG_DELETED" className="text-gray-900 hover:bg-blue-50">Organization Deleted</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-500 font-semibold">Member Management</SelectLabel>
                    <SelectItem value="MEMBER_ADDED" className="text-gray-900 hover:bg-blue-50">Member Added</SelectItem>
                    <SelectItem value="MEMBER_INVITED" className="text-gray-900 hover:bg-blue-50">Member Invited</SelectItem>
                    <SelectItem value="MEMBER_REMOVED" className="text-gray-900 hover:bg-blue-50">Member Removed</SelectItem>
                    <SelectItem value="MEMBER_ROLE_CHANGED" className="text-gray-900 hover:bg-blue-50">Member Role Changed</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-500 font-semibold">Vault & Security</SelectLabel>
                    <SelectItem value="VAULT_CREATED" className="text-gray-900 hover:bg-blue-50">Vault Created</SelectItem>
                    <SelectItem value="VAULT_ACCESSED" className="text-gray-900 hover:bg-blue-50">Vault Accessed</SelectItem>
                    <SelectItem value="VAULT_SHARED" className="text-gray-900 hover:bg-blue-50">Vault Shared</SelectItem>
                    <SelectItem value="UMK_SETUP" className="text-gray-900 hover:bg-blue-50">UMK Setup</SelectItem>
                    <SelectItem value="OVK_SETUP" className="text-gray-900 hover:bg-blue-50">OVK Setup</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-500 font-semibold">Items</SelectLabel>
                    <SelectItem value="ITEM_CREATED" className="text-gray-900 hover:bg-blue-50">Item Created</SelectItem>
                    <SelectItem value="ITEM_VIEWED" className="text-gray-900 hover:bg-blue-50">Item Viewed</SelectItem>
                    <SelectItem value="ITEM_DELETED" className="text-gray-900 hover:bg-blue-50">Item Deleted</SelectItem>
                    <SelectItem value="ITEM_SHARED" className="text-gray-900 hover:bg-blue-50">Item Shared</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-500 font-semibold">Invitations</SelectLabel>
                    <SelectItem value="INVITE_SENT" className="text-gray-900 hover:bg-blue-50">Invite Sent</SelectItem>
                    <SelectItem value="INVITE_ACCEPTED" className="text-gray-900 hover:bg-blue-50">Invite Accepted</SelectItem>
                    <SelectItem value="INVITE_REVOKED" className="text-gray-900 hover:bg-blue-50">Invite Revoked</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-500 font-semibold">Security</SelectLabel>
                    <SelectItem value="LOGIN_FAILED" className="text-gray-900 hover:bg-blue-50">Login Failed</SelectItem>
                    <SelectItem value="PASSWORD_CHANGED" className="text-gray-900 hover:bg-blue-50">Password Changed</SelectItem>
                    <SelectItem value="PERMISSION_CHANGED" className="text-gray-900 hover:bg-blue-50">Permission Changed</SelectItem>
                    <SelectItem value="SUSPICIOUS_ACTIVITY" className="text-gray-900 hover:bg-blue-50">Suspicious Activity</SelectItem>
                  </SelectGroup>
                </>
              ) : (
                <>
                  <SelectGroup>
                    <SelectLabel className="text-gray-500 font-semibold">Personal Setup</SelectLabel>
                    <SelectItem value="PERSONAL_SETUP" className="text-gray-900 hover:bg-blue-50">Personal Setup</SelectItem>
                    <SelectItem value="STORE_PRIVATE_KEY" className="text-gray-900 hover:bg-blue-50">Store Private Key</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-500 font-semibold">Items</SelectLabel>
                    <SelectItem value="ITEM_CREATED" className="text-gray-900 hover:bg-blue-50">Item Created</SelectItem>
                    <SelectItem value="ITEM_VIEWED" className="text-gray-900 hover:bg-blue-50">Item Viewed</SelectItem>
                    <SelectItem value="ITEM_DELETED" className="text-gray-900 hover:bg-blue-50">Item Deleted</SelectItem>
                    <SelectItem value="ITEM_SHARED" className="text-gray-900 hover:bg-blue-50">Item Shared</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-500 font-semibold">Vault</SelectLabel>
                    <SelectItem value="VAULT_ACCESSED" className="text-gray-900 hover:bg-blue-50">Vault Accessed</SelectItem>
                    <SelectItem value="VAULT_CREATED" className="text-gray-900 hover:bg-blue-50">Vault Created</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-gray-500 font-semibold">Security</SelectLabel>
                    <SelectItem value="LOGIN_FAILED" className="text-gray-900 hover:bg-blue-50">Login Failed</SelectItem>
                    <SelectItem value="PASSWORD_CHANGED" className="text-gray-900 hover:bg-blue-50">Password Changed</SelectItem>
                    <SelectItem value="EMAIL_CHANGED" className="text-gray-900 hover:bg-blue-50">Email Changed</SelectItem>
                  </SelectGroup>
                </>
              )}
            </SelectContent>
          </Select>

          <Select 
            value={filters.subject_type}
            onValueChange={(value) => onFilterChange('subject_type', value)}
          >
            <SelectTrigger className="bg-white border-gray-300 text-gray-900 hover:border-gray-400 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {isOrgAccount ? (
                <>
                  <SelectItem value="org" className="text-gray-900 hover:bg-blue-50">Organization</SelectItem>
                  <SelectItem value="vault" className="text-gray-900 hover:bg-blue-50">Vault</SelectItem>
                  <SelectItem value="item" className="text-gray-900 hover:bg-blue-50">Item</SelectItem>
                  <SelectItem value="member" className="text-gray-900 hover:bg-blue-50">Member</SelectItem>
                  <SelectItem value="invite" className="text-gray-900 hover:bg-blue-50">Invite</SelectItem>
                  <SelectItem value="permission" className="text-gray-900 hover:bg-blue-50">Permission</SelectItem>
                  <SelectItem value="key" className="text-gray-900 hover:bg-blue-50">Key Management</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="PERSONAL_VAULT_SETUP" className="text-gray-900 hover:bg-blue-50">Personal Vault Setup</SelectItem>
                  <SelectItem value="CRYPTO_SETUP" className="text-gray-900 hover:bg-blue-50">Crypto Setup</SelectItem>
                  <SelectItem value="item" className="text-gray-900 hover:bg-blue-50">Item</SelectItem>
                  <SelectItem value="vault" className="text-gray-900 hover:bg-blue-50">Vault</SelectItem>
                  <SelectItem value="user" className="text-gray-900 hover:bg-blue-50">User</SelectItem>
                  <SelectItem value="auth" className="text-gray-900 hover:bg-blue-50">Authentication</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          
          <input
            type="date"
            value={filters.date}
            onChange={(e) => onFilterChange('date', e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 transition-colors"
          />
          
          <div className="flex gap-3">
            <button
              onClick={onApply}
              disabled={loading}
              className="flex-1 sm:flex-none px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors font-semibold shadow-sm"
            >
              Apply
            </button>
            <button
              onClick={onClear}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm transition-colors border border-gray-300 font-semibold"
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