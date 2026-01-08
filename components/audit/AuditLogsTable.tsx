"use client";

import { useCurrentUser } from '@/hooks/useCurrentUser';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Shield } from 'lucide-react';
import { AuditLog, FilterState } from './types';
import { ITEMS_PER_PAGE } from './constants';
import { getSeverityLevel } from './utils';
import { AuditFilters } from './AuditFilters';
import { AuditTableDesktop } from './AuditTableDesktop';
import { AuditTableMobile } from './AuditTableMobile';
import { AuditEmptyState } from './AuditEmptyState';
import { AuditErrorState } from './AuditErrorState';
import { AuditLoadingState } from './AuditLoadingState';

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
        <AuditLoadingState message="Loading user data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <AuditFilters
        filters={filters}
        isOrgAccount={isOrgAccount}
        loading={loading}
        onFilterChange={handleFilterChange}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {error && <AuditErrorState error={error} onRetry={fetchLogs} />}

      {loading ? (
        <AuditLoadingState />
      ) : (
        <>
          <AuditTableDesktop
            logs={paginatedLogs}
            isOrgAccount={isOrgAccount}
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={goToPage}
            onNextPage={goToNextPage}
            onPrevPage={goToPrevPage}
          />

          <AuditTableMobile
            logs={paginatedLogs}
            isOrgAccount={isOrgAccount}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={logs.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={goToPage}
            onNextPage={goToNextPage}
            onPrevPage={goToPrevPage}
          />
        </>
      )}

      {!loading && logs.length === 0 && <AuditEmptyState isOrgAccount={isOrgAccount} />}
    </div>
  );
};
