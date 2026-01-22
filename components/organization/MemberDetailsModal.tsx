import React, { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Building2, 
  Clock,
  Key,
  Activity,
  Copy,
  Check,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { OrganizationMember } from "../org/types";

interface MemberDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: OrganizationMember | null;
}

interface MemberActivity {
  id: string;
  action: string;
  timestamp: string;
  ip: string;
  description: string;
}

interface MemberStats {
  totalLogins: number;
  lastLogin: string | null;
  itemsAccessed: number;
  invitedBy: {
    name: string;
    email: string;
  } | null;
}

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  isOpen,
  onClose,
  member,
}) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<MemberActivity[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && member) {
      fetchMemberDetails();
    }
    //  eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, member]);

  const fetchMemberDetails = async () => {
    if (!member) return;
    
    setLoading(true);
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        axios.get(`/api/members/stats?membership_id=${member.id}`),
        axios.get(`/api/members/activity?membership_id=${member.id}`)
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (activityResponse.data.success) {
        setRecentActivity(activityResponse.data.data.activities || []);
      }
    } catch (error) {
      console.error("Failed to fetch member details:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
      case "admin":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";
      case "member":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
      case "viewer":
        return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (!member) return null;

  const orgName = member.org?.name || '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-2xl bg-white border-gray-200 shadow-xl max-h-[85vh] overflow-y-auto p-0 gap-0 scrollbar-hide rounded-2xl mx-auto sm:mx-0"> {/* Added responsive width classes */}
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-lg font-bold text-gray-900">Member Details</h2>
                <p className="text-sm font-normal text-gray-500">View profile and activity logs</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 scrollbar-hide"> {/* Adjusted padding and spacing for mobile */}
          {/* Profile Header Card */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 p-4 sm:p-5 bg-gray-50 rounded-2xl border border-gray-200/60"> {/* Responsive flex direction and gap */}
            {member.user?.image ? (
              <Image
                src={member.user.image}
                alt={member.user?.name || "User"}
                width={72}
                height={72}
                className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl object-cover border-2 border-white shadow-sm" 
              />
            ) : (
              <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] bg-white rounded-2xl flex items-center justify-center border-2 border-gray-100 shadow-sm text-gray-400">
                <User className="w-8 h-8" />
              </div>
            )}
            
            <div className="flex-1 min-w-0 pt-1 w-full sm:w-auto"> {/* Added w-full for mobile */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col w-full"> {/* Added w-full */}
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate"> {/* Adjusted font size */}
                    {member.user?.name || "Unknown User"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1"> {/* Allow wrapping for badges */}
                    <Badge className={`${getRoleBadgeColor(member.role)} px-2.5 py-0.5 text-xs font-semibold capitalize border shadow-none`}>
                      {member.role}
                    </Badge>
                    <span className="text-gray-300 hidden sm:inline">|</span> {/* Hide separator on small screens if needed */}
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 w-full sm:w-auto mt-1 sm:mt-0"> {/* Allow full width on mobile */}
                      <Calendar className="w-3.5 h-3.5" />
                      {/* @ts-expect-error `created_at` is a string */}
                      Joined {formatDate(member.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              
              {orgName && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-3 bg-white px-3 py-1.5 rounded-lg border border-gray-200 w-fit shadow-sm">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="font-medium truncate max-w-[200px] sm:max-w-none">{orgName}</span> {/* Truncate org name on mobile */}
                </div>
              )}
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 scrollbar-hide">
            <div className="group relative p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-500">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Email Address</span>
                </div>
                <button
                  onClick={() => copyToClipboard(member.user?.email || '', 'Email')}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {copiedField === 'Email' ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-900 font-medium truncate select-all">
                {member.user?.email || "No email provided"}
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Key className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Membership ID</span>
              </div>
              <p className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-0.5 rounded-md inline-block border border-gray-100 break-all"> {/* Break long ID on mobile */}
                {member.id}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full bg-gray-100 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-12 w-full bg-gray-100 rounded-lg" />
                <Skeleton className="h-12 w-full bg-gray-100 rounded-lg" />
              </div>
            </div>
          ) : (
            <>
              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"> {/* Stack stats on mobile */}
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col items-center text-center">
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600 mb-2">
                      <Activity className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Total Logins</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalLogins}</p>
                  </div>

                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col items-center text-center">
                    <div className="p-2 bg-emerald-100 rounded-full text-emerald-600 mb-2">
                      <Shield className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Items Accessed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.itemsAccessed}</p>
                  </div>

                  <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 flex flex-col items-center text-center">
                    <div className="p-2 bg-purple-100 rounded-full text-purple-600 mb-2">
                      <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider mb-1">Last Active</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {stats.lastLogin ? getRelativeTime(stats.lastLogin) : 'Never'}
                    </p>
                  </div>
                </div>
              )}

              {stats?.invitedBy && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm text-gray-400 flex-shrink-0"> {/* Prevent shrink */}
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0"> {/* Allow text truncation */}
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Invited By</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{stats.invitedBy.name}</p>
                    <p className="text-xs text-gray-500 truncate">{stats.invitedBy.email}</p>
                  </div>
                </div>
              )}

              <Separator className="bg-gray-100" />

              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 sm:gap-0"> {/* Stack header on mobile */}
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    Recent Activity
                  </h4>
                  <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                    Last 30 Days
                  </span>
                </div>

                {recentActivity.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-sm text-gray-500 font-medium">No recent activity recorded</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={activity.id}
                        className={`group flex gap-4 p-4 hover:bg-gray-50 transition-colors ${
                          index !== recentActivity.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 ring-4 ring-blue-50"></div>
                          {index !== recentActivity.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-100 my-1 group-hover:bg-gray-200 transition-colors"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <p className="text-sm text-gray-900 font-medium break-words"> {/* Allow breaking long words */}
                            {activity.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5"> {/* Allow wrapping */}
                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(activity.timestamp)}
                            </span>
                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(activity.timestamp)}
                            </span>
                            {activity.ip && (
                              <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[100px] sm:max-w-none"> {/* Truncate IP on small screens */}
                                {activity.ip}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};