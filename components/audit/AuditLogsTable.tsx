"use client";

import { useCurrentUser } from '@/hooks/useCurrentUser';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Filter, X, RefreshCw, Shield, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLog {
  id: string;
  actor: string;
  action: string;
  item: string;
  date: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string | null;
  org_name: string | null;
}

interface FilterState {
  action: string;
  subject_type: string;
  date: string;
}

const ITEMS_PER_PAGE = 10;

export const AuditLogsTable: React.FC = () => {
  const user = useCurrentUser();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    action: '',
    subject_type: '',
    date: '',
  });

  const isUserLoaded = user !== null;
  const isOrgAccount = user?.account_type === 'org';
  const endpoint = isOrgAccount ? '/api/audits' : '/api/logs';

  const getSeverityLevel = (action: string): 'low' | 'medium' | 'high' | 'critical' => {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      LOGIN_FAILED: 'medium',
      PASSWORD_CHANGED: 'high',
      EMAIL_CHANGED: 'high',
      ACCOUNT_LOCKED: 'critical',
      SUSPICIOUS_ACTIVITY: 'critical',
      VAULT_ACCESSED: 'medium',
      ITEM_DELETED: 'high',
      MEMBER_REMOVED: 'high',
      PERMISSION_CHANGED: 'medium',
      ITEM_CREATED: 'low',
      ITEM_VIEWED: 'low',
      ITEM_SHARED: 'medium',
      PERSONAL_SETUP: 'low',
      STORE_PRIVATE_KEY: 'medium',
      ORG_CREATED: 'high',
      ORG_VIEWED: 'low',
      ORG_UPDATED: 'medium',
      ORG_DELETED: 'critical',
      MEMBER_ADDED: 'medium',
      MEMBER_INVITED: 'low',
      MEMBER_ROLE_CHANGED: 'high',
      VAULT_CREATED: 'medium',
      VAULT_SHARED: 'medium',
      UMK_SETUP: 'high',
      OVK_SETUP: 'high',
      INVITE_SENT: 'low',
      INVITE_ACCEPTED: 'medium',
      INVITE_REVOKED: 'medium',
    };
    return severityMap[action] || 'low';
  };

  const fetchLogs = useCallback(async () => {
    if (!isUserLoaded) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();

      if (!isOrgAccount && user?.id) {
        queryParams.append('user_id', user.id);
      }
      if (isOrgAccount && user?.org?.id) {
        queryParams.append('org_id', user.org.id);
      }
      if (filters.action) {
        queryParams.append('action', filters.action);
      }
      if (filters.subject_type) {
        queryParams.append('subject_type', filters.subject_type);
      }
      if (filters.date) {
        queryParams.append('start_date', filters.date);
      }

      const response = await fetch(`${endpoint}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        let logsData;
        
        if (result.data && Array.isArray(result.data)) {
          logsData = result.data;
        } else if (result.data && result.data.logs) {
          logsData = result.data.logs;
        } else if (result.data && result.data.audits) {
          logsData = result.data.audits;
        } else {
          logsData = [];
        }

        // @ts-expect-error -- Ignore ---
        const transformedLogs = logsData.map((item) => ({
          id: item.id,
          actor: isOrgAccount 
            ? (item.actor?.name || item.actor?.email || 'Unknown User')
            : (item.user?.name || item.user?.email || 'You'),
          action: item.action,
          item: isOrgAccount 
            ? `${item.subject_type}${item.org?.name ? ` in ${item.org.name}` : ''}` 
            : item.subject_type,
          date: new Date(item.ts).toLocaleString(),
          severity: getSeverityLevel(item.action),
          ip: item.ip,
          org_name: item.org?.name || null,
        }));
        
        setLogs(transformedLogs);
        setCurrentPage(1);
      } else {
        throw new Error(result.error || result.message || 'Failed to fetch logs');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [isUserLoaded, endpoint, filters, user?.id, user?.org?.id, isOrgAccount]);

  const getSeverityColor = (severity: string): string => {
    const colorMap: Record<string, string> = {
      low: 'bg-green-900 text-green-300',
      medium: 'bg-blue-900 text-blue-300',
      high: 'bg-yellow-900 text-yellow-300',
      critical: 'bg-red-900 text-red-300',
    };
    return colorMap[severity] || 'bg-gray-900 text-gray-300';
  };

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    fetchLogs();
  }, [fetchLogs]);

  const clearFilters = useCallback(() => {
    setFilters({
      action: '',
      subject_type: '',
      date: '',
    });
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedLogs = useMemo(() => logs.slice(startIndex, endIndex), [logs, startIndex, endIndex]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  useEffect(() => {
    if (isUserLoaded) {
      fetchLogs();
    }
  }, [isUserLoaded, fetchLogs]);

  useEffect(() => {
    const hasEmptyFilters = Object.values(filters).every(value => value === '');
    if (hasEmptyFilters && isUserLoaded) {
      fetchLogs();
    }
  }, [filters, fetchLogs, isUserLoaded]);

  if (!isUserLoaded) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 text-sm mt-4">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-500/10 rounded-lg">
            <Shield size={24} className="text-blue-400" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {isOrgAccount ? 'Organization Audit Logs' : 'Security Logs'}
          </h2>
        </div>
        <p className="text-gray-400 text-sm ml-14">
          {isOrgAccount 
            ? 'Monitor all activities across your organization' 
            : 'Track your security and activity history'}
        </p>
      </div>

      {/* Filters Section */}
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
              onValueChange={(value) => handleFilterChange('action', value)}
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
              onValueChange={(value) => handleFilterChange('subject_type', value)}
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
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="px-3 md:px-4 py-2 bg-gray-750 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 hover:border-gray-600 transition-colors"
            />
            
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                disabled={loading}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors font-medium"
              >
                Apply
              </button>
              <button
                onClick={clearFilters}
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

      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-300 text-sm font-medium">{error}</p>
              <button 
                onClick={() => fetchLogs()}
                className="mt-2 flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                <RefreshCw size={14} />
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 text-sm mt-4">Loading logs...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">Actor</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">Action</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">Item</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">Date & Time</th>
                    {isOrgAccount && <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">IP</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, index) => (
                    <tr 
                      key={log.id} 
                      className={`border-b border-gray-700/50 hover:bg-gray-750 transition-colors ${
                        index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'
                      }`}
                    >
                      <td className="py-4 px-6 text-white text-sm font-medium">{log.actor}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold ${getSeverityColor(log.severity)}`}>
                          {log.action.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400 text-sm">{log.item}</td>
                      <td className="py-4 px-6 text-gray-400 text-sm">{log.date}</td>
                      {isOrgAccount && <td className="py-4 px-6 text-gray-500 text-xs font-mono">{log.ip || '-'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination for Desktop */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-t border-gray-700">
                <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
                  Showing <span className="font-semibold text-gray-300">{startIndex + 1}</span> to{" "}
                  <span className="font-semibold text-gray-300">{Math.min(endIndex, logs.length)}</span> of{" "}
                  <span className="font-semibold text-gray-300">{logs.length}</span> logs
                </div>
                
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="p-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-700 transition-colors border border-gray-600"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} className="text-gray-300" />
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`min-w-[40px] h-[40px] rounded-lg font-semibold text-sm transition-all ${
                          currentPage === page
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-700 transition-colors border border-gray-600"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Actor</span>
                      <p className="text-white text-sm mt-1 font-medium break-all">{log.actor}</p>
                    </div>
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${getSeverityColor(log.severity)} whitespace-nowrap`}>
                      {log.action.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-700/50">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Item</span>
                    <p className="text-gray-300 text-sm mt-1">{log.item}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-700/50">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Date & Time</span>
                    <p className="text-gray-300 text-sm mt-1">{log.date}</p>
                  </div>

                  {isOrgAccount && log.ip && (
                    <div className="pt-3 border-t border-gray-700/50">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">IP Address</span>
                      <p className="text-gray-500 text-xs mt-1 font-mono">{log.ip}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination for Mobile */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-6 border-t border-gray-700">
                <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
                  Showing <span className="font-semibold text-gray-300">{startIndex + 1}</span> to{" "}
                  <span className="font-semibold text-gray-300">{Math.min(endIndex, logs.length)}</span> of{" "}
                  <span className="font-semibold text-gray-300">{logs.length}</span> logs
                </div>
                
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="p-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-700 transition-colors border border-gray-600"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} className="text-gray-300" />
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`min-w-[40px] h-[40px] rounded-lg font-semibold text-sm transition-all ${
                          currentPage === page
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-700 transition-colors border border-gray-600"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && logs.length === 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-gray-600" />
          </div>
          <p className="text-gray-400 text-sm font-medium">
            {isOrgAccount ? 'No audit logs found' : 'No security logs found'}
          </p>
          <p className="text-gray-500 text-sm mt-1.5">
            Try adjusting your filters or check back later
          </p>
        </div>
      )}
    </div>
  );
};
