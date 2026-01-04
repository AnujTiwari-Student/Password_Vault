"use client";

import React, { useEffect, useState } from "react";
import {
  Lock,
  Users,
  Shield,
  Clock,
  Loader2,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Activity,
  ArrowRight,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";

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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  
  // Pagination state
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
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(message);
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
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(message);
      toast.error("Failed to load recent activity");
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getSecurityScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  // Pagination logic
  const totalPages = Math.ceil(recentActivity.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = recentActivity.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <div className="text-xl">Loading User Data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl sm:text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-400 text-sm mt-1.5">
          Welcome back, {user.name || user.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Total Items Card */}
        <div className="bg-gray-800 rounded-xl p-5 sm:p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <Lock className="text-blue-400" size={22} />
            </div>
            <h3 className="text-gray-400 text-xs sm:text-sm font-medium uppercase tracking-wide">Total Items</h3>
          </div>
          {isLoadingStats ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="text-gray-400 text-sm">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {stats?.totalItems ?? 0}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <TrendingUp size={14} />
                <span>Across all vaults</span>
              </div>
            </>
          )}
        </div>

        {/* Shared Vaults/Teams Card */}
        <div className="bg-gray-800 rounded-xl p-5 sm:p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/5 group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
              <Users className="text-green-400" size={22} />
            </div>
            <h3 className="text-gray-400 text-xs sm:text-sm font-medium uppercase tracking-wide">
              {stats?.vaultType === "org" ? "Shared Vaults" : "Teams Joined"}
            </h3>
          </div>
          {isLoadingStats ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="text-gray-400 text-sm">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {stats?.vaultType === "org"
                  ? stats?.sharedVaults ?? 0
                  : stats?.teamsJoined ?? 0}
              </p>
              <div className="text-xs text-gray-500">
                {stats?.vaultType === "org"
                  ? "Organization vaults"
                  : "Collaborative spaces"}
              </div>
            </>
          )}
        </div>

        {/* Security Score Card */}
        <div className="bg-gray-800 rounded-xl p-5 sm:p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 group sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <Shield className="text-purple-400" size={22} />
            </div>
            <h3 className="text-gray-400 text-xs sm:text-sm font-medium uppercase tracking-wide">Security Score</h3>
          </div>
          {isLoadingStats ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="text-gray-400 text-sm">Loading...</span>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2 mb-3">
                <p
                  className={`text-3xl sm:text-4xl font-bold ${getSecurityScoreColor(
                    stats?.securityScore ?? 0
                  )}`}
                >
                  {stats?.securityScore ?? 0}%
                </p>
                <span
                  className={`text-sm font-semibold ${getSecurityScoreColor(
                    stats?.securityScore ?? 0
                  )}`}
                >
                  {getSecurityScoreLabel(stats?.securityScore ?? 0)}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    (stats?.securityScore ?? 0) >= 80
                      ? "bg-green-500"
                      : (stats?.securityScore ?? 0) >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${stats?.securityScore ?? 0}%`,
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-lg">
                <Activity size={22} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Recent Activity</h3>
                <p className="text-xs text-gray-500 mt-0.5">Track your latest actions</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
              <Clock size={16} />
              <span>Live updates</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoadingActivity ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-400">Loading activity...</span>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity size={32} className="text-gray-600" />
              </div>
              <p className="font-medium text-base">No recent activity</p>
              <p className="text-sm mt-1.5 text-gray-500">Your actions will appear here</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {currentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="group relative bg-gray-750 hover:bg-gray-700/70 border border-gray-700/50 hover:border-gray-600 rounded-lg transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5 p-2 bg-gray-700/50 rounded-lg group-hover:bg-blue-500/10 transition-colors">
                          <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <p className="text-white font-semibold text-sm sm:text-base">
                              {activity.action}
                            </p>
                            {activity.type === "org" && (
                              <span className="inline-flex items-center gap-1 text-xs bg-purple-900/40 text-purple-300 px-2.5 py-1 rounded-md border border-purple-700/30 font-medium">
                                <Users size={12} />
                                Team
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-400">
                            <span className="font-medium text-gray-300">{activity.item}</span>
                            <span className="mx-2 text-gray-600">•</span>
                            <span className="text-gray-500">{activity.user}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 ml-11 sm:ml-0">
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 bg-gray-800/70 px-3 py-1.5 rounded-md border border-gray-700/50">
                          <Clock size={14} className="text-gray-600" />
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-6 border-t border-gray-700">
                  <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
                    Showing <span className="font-semibold text-gray-300">{startIndex + 1}</span> to{" "}
                    <span className="font-semibold text-gray-300">{Math.min(endIndex, recentActivity.length)}</span> of{" "}
                    <span className="font-semibold text-gray-300">{recentActivity.length}</span> activities
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
