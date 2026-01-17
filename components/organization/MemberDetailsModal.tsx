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
  Check
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
        return "bg-yellow-900/30 text-yellow-300 border-yellow-700/30";
      case "admin":
        return "bg-blue-900/30 text-blue-300 border-blue-700/30";
      case "member":
        return "bg-green-900/30 text-green-300 border-green-700/30";
      case "viewer":
        return "bg-gray-700/50 text-gray-400 border-gray-600/30";
      default:
        return "bg-gray-700/50 text-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
      <DialogContent className="sm:max-w-2xl bg-gray-900 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            Member Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            {member.user?.image ? (
              <Image
                src={member.user.image}
                alt={member.user?.name || "User"}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full ring-2 ring-blue-500/20"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center ring-2 ring-blue-500/20">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white">
                  {member.user?.name || "Unknown User"}
                </h3>
                <Badge className={`${getRoleBadgeColor(member.role)} border`}>
                  {member.role}
                </Badge>
              </div>
              
              {orgName && (
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Building2 className="w-4 h-4" />
                  <span>{orgName}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                {/* @ts-expect-error `created_at` is a string */}
                <span>Joined {formatDate(member.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-medium">Email</span>
                </div>
                <button
                  onClick={() => copyToClipboard(member.user?.email || '', 'Email')}
                  className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                >
                  {copiedField === 'Email' ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-500" />
                  )}
                </button>
              </div>
              <p className="text-sm text-white font-medium break-all">
                {member.user?.email || "No email"}
              </p>
            </div>

            <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Key className="w-4 h-4" />
                <span className="text-xs font-medium">Member ID</span>
              </div>
              <p className="text-sm text-white font-mono">
                {member.id.substring(0, 12)}...
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 bg-gray-800" />
              <Skeleton className="h-32 bg-gray-800" />
            </div>
          ) : (
            <>
              {stats && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-lg border border-blue-700/30">
                    <div className="flex items-center gap-2 text-blue-400 mb-1">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs font-medium">Total Logins</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {stats.totalLogins}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-900/20 to-green-800/10 rounded-lg border border-green-700/30">
                    <div className="flex items-center gap-2 text-green-400 mb-1">
                      <Shield className="w-4 h-4" />
                      <span className="text-xs font-medium">Items Accessed</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {stats.itemsAccessed}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-lg border border-purple-700/30">
                    <div className="flex items-center gap-2 text-purple-400 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium">Last Login</span>
                    </div>
                    <p className="text-xs font-semibold text-white mt-1">
                      {stats.lastLogin ? getRelativeTime(stats.lastLogin) : 'Never'}
                    </p>
                  </div>
                </div>
              )}

              {stats?.invitedBy && (
                <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">
                    Invited By
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-700/50 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {stats.invitedBy.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {stats.invitedBy.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Separator className="bg-gray-700/50" />

              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">
                  Recent Activity
                </h4>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No recent activity
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-colors"
                      >
                        <div className="p-1.5 bg-blue-500/10 rounded">
                          <Activity className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {formatDate(activity.timestamp)}
                            </span>
                            <span className="text-xs text-gray-600">•</span>
                            <span className="text-xs text-gray-500">
                              {activity.ip}
                            </span>
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