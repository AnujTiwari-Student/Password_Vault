"use client";

import React, { useEffect, useState } from "react";
import {
  Lock,
  Clock,
  Loader2,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart3,
  ShieldCheck,
  LayoutGrid,
  FileText,
  KeyRound,
  Globe,
  UserPlus,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import AddingItemsModal from "../modals/AddingItems";

// --- Types ---
interface RecentActivity {
  id: string;
  action: string;
  item: string;
  time: string;
  user: string;
  type: "personal" | "org";
}

interface DashboardStats {
  totalItems: number;
  sharedVaults: number;
  teamsJoined: number;
  securityScore: number;
  vaultType: "personal" | "org";
}

export const DashboardOverview: React.FC = () => {
  const user = useCurrentUser();
  const router = useRouter();
  
  // Data State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  
  // Actions State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingItemType, setAddingItemType] = useState<"login" | "note">("login");

  console.log(addingItemType)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!user) return;
    fetchDashboardStats();
    fetchRecentActivity();
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data: DashboardStats = await response.json();
      setStats(data);
    } catch (error: unknown) {
      console.error(error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch("/api/dashboard/activity?limit=10");
      if (!response.ok) throw new Error("Failed to fetch activity");
      const data: RecentActivity[] = await response.json();
      setRecentActivity(data);
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  // --- 1. VAULT CONTEXT LOGIC ---
  const getActiveContext = () => {
    if (!user) return { vaultId: null, type: 'personal', orgId: undefined };

    // Priority 1: Personal Vault (if exists and account is personal/hybrid)
    if (user.vault?.id && user.account_type !== 'org') {
      return { 
        vaultId: user.vault.id, 
        type: 'personal' as const, 
        orgId: undefined 
      };
    }

    // Priority 2: Organization Vault (for Org-only users or explicit org context)

    //  @ts-expect-error --fix--
    if (user.org?.vault_id) {
      return { 
        //  @ts-expect-error --fix--
        vaultId: user.org.vault_id, 
        type: 'org' as const, 
        orgId: user.org.id
      };
    }

    return { vaultId: null, type: 'personal', orgId: undefined };
  };

  const activeContext = getActiveContext();

  // --- 2. ROBUST NAVIGATION (Matches NavUser logic) ---
  const handleNavigation = (tab: string) => {
    // A. Update URL Query Param (Persistence)
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    router.push(`${window.location.pathname}?${params.toString()}`);

    // B. Dispatch Custom Event (Cross-Component Sync)
    // This forces the parent Dashboard component to switch views immediately
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("dashboardTabChange", { 
        detail: { tab } 
      }));
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "login":
        if (!activeContext.vaultId) {
          toast.error("No active vault found.");
          return;
        }
        setAddingItemType("login");
        setShowAddModal(true);
        break;

      case "note":
        if (!activeContext.vaultId) {
          toast.error("No active vault found.");
          return;
        }
        setAddingItemType("note");
        setShowAddModal(true);
        break;

      case "generate":
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
        const password = Array.from(crypto.getRandomValues(new Uint32Array(16)))
          .map((v) => chars[v % chars.length])
          .join("");
        
        navigator.clipboard.writeText(password);
        
        toast.custom(() => (
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex gap-3 w-full max-w-sm">
            <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-full h-fit">
              <KeyRound className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Strong password copied!</h4>
              <p className="text-gray-500 text-xs mt-1">
                16 characters (symbols included) ready to paste.
              </p>
            </div>
          </div>
        ), { duration: 3000 });
        break;

      case "invite":
        if (user?.account_type === 'personal') {
          toast.info("Organization Required", {
            description: "Upgrade to an Organization plan to invite members.",
            action: {
              label: "Upgrade",
              onClick: () => handleNavigation("Settings")
            }
          });
        } else {
          handleNavigation("Members");
        }
        break;
    }
  };

  // --- Visual Helpers ---
  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  const getSecurityScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Critical";
  };

  const getSecurityBarColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  // Pagination Logic
  const totalPages = Math.ceil(recentActivity.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = recentActivity.slice(startIndex, endIndex);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <div className="text-xl font-semibold text-gray-700">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  // --- BUTTON VISIBILITY LOGIC ---
  // Only show "New Login" and "Secure Note" if user is NOT an 'org' type
  const showPersonalActions = user.account_type !== 'org';

  return (
    <div className="mx-auto space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. WELCOME HEADER */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-blue-50/50 to-transparent rounded-bl-full -mr-16 -mt-16 transition-all duration-700 group-hover:scale-110 pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-3xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Dashboard
              </h1>
            </div>
            <p className="text-gray-600 text-base">
              Welcome back, <span className="font-bold text-gray-900">{user.name || user.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-sm text-emerald-700 font-bold uppercase tracking-wide">System Active</span>
          </div>
        </div>
      </div>

      {/* 2. QUICK ACTIONS */}
      {/* Adjusted grid columns based on number of visible buttons */}
      <div className={`grid grid-cols-2 ${showPersonalActions ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-4`}>
        
        {/* Only for Personal/Hybrid Accounts */}
        {showPersonalActions && (
          <>
            <button 
              onClick={() => handleQuickAction('login')}
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 group text-left"
            >
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 group-hover:scale-110 transition-transform">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-700 text-sm group-hover:text-gray-900">
                New Login
              </span>
            </button>

            <button 
              onClick={() => handleQuickAction('note')}
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200 group text-left"
            >
              <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-semibold text-gray-700 text-sm group-hover:text-gray-900">
                Secure Note
              </span>
            </button>
          </>
        )}

        {/* Available for Everyone */}
        <button 
          onClick={() => handleQuickAction('generate')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200 group text-left"
        >
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 group-hover:scale-110 transition-transform">
            <KeyRound className="w-5 h-5 text-amber-600" />
          </div>
          <span className="font-semibold text-gray-700 text-sm group-hover:text-gray-900">
            Generate Pass
          </span>
        </button>

        <button 
          onClick={() => handleQuickAction('invite')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200 group text-left"
        >
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 group-hover:scale-110 transition-transform">
            <UserPlus className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="font-semibold text-gray-700 text-sm group-hover:text-gray-900">
            Invite Member
          </span>
        </button>
      </div>

      {/* 3. MAIN STATS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Stat Card 1: Total Items */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-4xl font-bold text-gray-900 tracking-tight">
              {isLoadingStats ? "-" : (stats?.totalItems ?? 0)}
            </h3>
            <p className="text-gray-500 font-medium">Secured Vault Items</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 to-blue-100 opacity-20"></div>
        </div>

        {/* Stat Card 2: Teams/Shared */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <LayoutGrid className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
              {stats?.vaultType === "org" ? "Organization" : "Workspace"}
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-4xl font-bold text-gray-900 tracking-tight">
              {isLoadingStats ? "-" : (stats?.vaultType === "org" ? stats?.sharedVaults : stats?.teamsJoined) ?? 0}
            </h3>
            <p className="text-gray-500 font-medium">
              {stats?.vaultType === "org" ? "Active Shared Vaults" : "Joined Organizations"}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-indigo-500 to-indigo-100 opacity-20"></div>
        </div>

        {/* Stat Card 3: Security Health */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300 lg:row-span-2">
          <div className="flex justify-between items-start mb-6">
            <div className={`p-3 rounded-xl border ${stats?.securityScore && stats.securityScore >= 80 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
              <ShieldCheck className={`w-6 h-6 ${getSecurityScoreColor(stats?.securityScore ?? 0)}`} />
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-sm font-bold uppercase tracking-wider ${getSecurityScoreColor(stats?.securityScore ?? 0)}`}>
                {getSecurityScoreLabel(stats?.securityScore ?? 0)}
              </span>
              <span className="text-xs text-gray-400 font-medium">Security Score</span>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-6">
            <h3 className={`text-5xl font-bold tracking-tight ${getSecurityScoreColor(stats?.securityScore ?? 0)}`}>
              {isLoadingStats ? "..." : `${stats?.securityScore ?? 0}%`}
            </h3>
          </div>

          <div className="space-y-2 mb-8">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
              <span>Risk</span>
              <span>Safe</span>
            </div>
            <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${getSecurityBarColor(stats?.securityScore ?? 0)} transition-all duration-1000 ease-out rounded-full shadow-sm relative`}
                style={{ width: `${stats?.securityScore ?? 0}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Insights</h4>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span>Master Password is strong</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              <span>2FA pending on 1 account</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span>Recovery phrase saved</span>
            </div>
          </div>
        </div>

        {/* 4. ACTIVITY FEED */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm lg:col-span-2 flex flex-col h-full">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                <Activity className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
              </div>
            </div>
            <button 
              onClick={() => handleNavigation("Audits")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              View Audit Log
            </button>
          </div>

          <div className="p-0 flex-1">
            {isLoadingActivity ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                <span className="text-gray-400 text-sm">Syncing feed...</span>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-20 px-6">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <Clock className="text-gray-300 w-8 h-8" />
                </div>
                <p className="font-bold text-gray-900">No recent activity</p>
                <p className="text-sm text-gray-500 mt-1">Actions performed in your vault will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {currentActivities.map((activity, index) => (
                  <div key={activity.id} className="group px-6 py-4 hover:bg-gray-50/80 transition-colors flex items-start gap-4">
                    <div className="relative flex flex-col items-center self-stretch">
                      <div className={`w-2 h-2 rounded-full border-2 z-10 mt-2 ${
                        index === 0 ? 'bg-blue-600 border-blue-200' : 'bg-gray-300 border-gray-100'
                      }`}></div>
                      {index !== currentActivities.length - 1 && (
                        <div className="w-px bg-gray-200 flex-1 my-1"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {activity.action}
                        </p>
                        <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
                          {activity.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 truncate max-w-37.5">
                          {activity.item}
                        </span>
                        <span>by</span>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[8px] text-white font-bold">
                            {activity.user.charAt(0)}
                          </div>
                          <span className="text-gray-700 font-medium">{activity.user}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="hidden sm:block">
                      {activity.type === "org" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
                          Team
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between rounded-b-2xl">
              <span className="text-xs font-medium text-gray-500">
                Page <span className="text-gray-900 font-bold">{currentPage}</span> of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 text-gray-500 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:border-transparent transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 text-gray-500 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:border-transparent transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Adding Modal */}
      {activeContext.vaultId && (
        <AddingItemsModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          vaultId={activeContext.vaultId}
          vaultType={activeContext.type as "personal" | "org"}
          orgId={activeContext.orgId} // Pass correct Org ID
          onSuccess={() => {
            fetchDashboardStats();
            fetchRecentActivity();
          }}
        />
      )}
    </div>
  );
};