"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  List,
  Plus,
  Loader2,
  Building,
  User as UserIcon,
  Lock,
  Globe,
  Shield,
  FileText,
  AlertCircle,
  X,
  LayoutGrid,
  FolderOpen
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { toast } from "sonner";
import { canUserEdit } from "@/utils/permission-utils";
import { APIVaultItem } from "@/types/vault";
import { ExtendedUser, MemberWithOrg } from "@/types/user";
import { ViewItemModal } from "@/components/modals/ViewItemModal";
import AddingItemsModal from "../modals/AddingItems";

type VaultType = "personal" | "org";
type ItemType = "login" | "note" | "totp";
type UserRole = "owner" | "admin" | "member" | "viewer";

export const UnifiedVaultList: React.FC = () => {
  const user = useCurrentUser() as ExtendedUser | null;
  const searchParams = useSearchParams();
  const orgIdFromUrl = searchParams.get("org");

  const [vaultType, setVaultType] = useState<VaultType>("personal");
  const [items, setItems] = useState<APIVaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<ItemType | "all">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orgVaultId, setOrgVaultId] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedRole, setFetchedRole] = useState<UserRole | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<APIVaultItem | null>(null);

  const hasOrgAccess = useMemo(() => {
    if (user?.org?.id) return true;
    if (user?.member) return true;
    return false;
  }, [user]);

  const isOrgOnlyAccount = useMemo(() => {
    const isOrgOwner = user?.account_type === 'org';
    const hasPersonalVault = !!user?.vault?.id;
    return isOrgOwner && !hasPersonalVault;
  }, [user]);

  const showPersonalVault = useMemo(() => {
    return !!user?.vault?.id;
  }, [user]);

  const showVaultSelector = useMemo(() => {
    return showPersonalVault && hasOrgAccess;
  }, [showPersonalVault, hasOrgAccess]);

  useEffect(() => {
    if (isOrgOnlyAccount) {
      setVaultType("org");
    } else if (orgIdFromUrl && hasOrgAccess) {
      setVaultType("org");
    } else if (showPersonalVault) {
      setVaultType("personal");
    } else if (hasOrgAccess) {
      setVaultType("org");
    }
  }, [orgIdFromUrl, hasOrgAccess, isOrgOnlyAccount, showPersonalVault]);

  const currentOrgId = useMemo(() => {
    if (vaultType === "org") {
      if (orgIdFromUrl) return orgIdFromUrl;
      if (user?.org?.id) return user.org.id;
      if (user?.member) {
        const members = Array.isArray(user.member) ? user.member : [user.member];
        const orgId = members[0]?.org_id;
        return orgId || null;
      }
    }
    return null;
  }, [vaultType, user, orgIdFromUrl]);

  useEffect(() => {
    const fetchOrgVault = async () => {
      if (vaultType === "org" && currentOrgId) {
        setOrgVaultId(null);
        setFetchedRole(null);
        try {
          const response = await axios.get(`/api/vaults/org/${currentOrgId}`);
          if (response.data.vault?.id) {
            setOrgVaultId(response.data.vault.id);
            if (response.data.membership?.role) {
              setFetchedRole(response.data.membership.role as UserRole);
            }
          }
        } catch (error) {
          setError("Failed to fetch org vault");
          console.error("Failed to fetch org vault", error);
        }
      }
    };
    fetchOrgVault();
  }, [vaultType, currentOrgId]);

  const vaultId = useMemo(() => {
    if (vaultType === "personal") {
      return user?.vault?.id || null;
    } else {
      if (orgVaultId) return orgVaultId;
      if (user?.org?.vault_id) return user.org.vault_id;
      return null;
    }
  }, [vaultType, user, orgVaultId]);

  const userRole = useMemo((): UserRole | null => {
    if (vaultType === "personal") return "owner";
    if (fetchedRole) return fetchedRole;
    if (user?.org?.id === currentOrgId && user?.org?.owner_user_id === user?.id) return "owner";
    if (user?.member) {
      const members = Array.isArray(user.member) ? user.member : [user.member];
      const member = members.find((m: MemberWithOrg) => m.org_id === currentOrgId);
      const role = member?.role as UserRole | undefined;
      return role || null;
    }
    if (user?.account_type === 'org' && user?.org?.id === currentOrgId) return 'owner';
    return null;
  }, [vaultType, user, currentOrgId, fetchedRole]);

  const canEdit = useMemo(() => {
    return userRole ? canUserEdit(userRole) : false;
  }, [userRole]);

  const fetchItems = useCallback(async () => {
    if (!vaultId) {
      setLoading(false);
      setIsFetching(false);
      return;
    }
    setIsFetching(true);
    setLoading(true);
    try {
      let endpoint = "";
      let params: Record<string, string> = {};
      if (vaultType === "personal") {
        endpoint = "/api/items";
        params = { id: vaultId };
      } else {
        if (!currentOrgId) throw new Error("Organization ID is missing");
        endpoint = "/api/items/member-items";
        params = {
          vault_id: vaultId,
          org_id: currentOrgId,
        };
      }
      const queryString = new URLSearchParams(params).toString();
      const response = await axios.get(`${endpoint}?${queryString}`);
      setItems(response.data.items || []);
      setError(null);
      if (response.data.user_role && !fetchedRole) {
        setFetchedRole(response.data.user_role as UserRole);
      }
    } catch (error) {
      console.error("Failed to fetch vault items", error);
      setError("Failed to load vault items");
      setItems([]);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [vaultId, vaultType, currentOrgId, fetchedRole]);

  useEffect(() => {
    if (user && vaultId) {
      setError(null);
      fetchItems();
    } else if (user && !vaultId) {
      setLoading(false);
      setIsFetching(false);
    }
  }, [user, vaultId, fetchItems]);

  const handleItemClick = (item: APIVaultItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleAddItem = () => {
    if (!canEdit) {
      toast.error("You do not have permission to add items");
      return;
    }
    if (!vaultId) {
      toast.error("Vault not loaded yet. Please wait.");
      return;
    }
    setShowAddModal(true);
  };

  const handleVaultTypeChange = (newType: VaultType) => {
    if (newType === "org" && !hasOrgAccess) {
      toast.error("You are not a member of any organization");
      return;
    }
    setVaultType(newType);
    setSearchTerm("");
    setSelectedType("all");
    setSelectedTag(null);
    setError(null);
    setOrgVaultId(null);
    setFetchedRole(null);
    setItems([]);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const itemTags = item.tags || [];
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemTags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesType =
        selectedType === "all" || item.type.includes(selectedType as ItemType);
      const matchesTag = !selectedTag || itemTags.includes(selectedTag);
      return matchesSearch && matchesType && matchesTag;
    });
  }, [items, searchTerm, selectedType, selectedTag]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((item) => {
      const itemTags = item.tags || [];
      itemTags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [items]);

  const getItemIcon = (type: ItemType[]) => {
    if (type.includes("login"))
      return <Globe className="w-5 h-5 text-blue-600" />;
    if (type.includes("totp"))
      return <Shield className="w-5 h-5 text-emerald-600" />;
    if (type.includes("note"))
      return <FileText className="w-5 h-5 text-purple-600" />;
    return <Lock className="w-5 h-5 text-gray-400" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "login":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "note":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "totp":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const orgName = useMemo(() => {
    if (vaultType !== 'org') return null;
    if (user?.org?.name) return user.org.name;
    if (user?.member) {
      const members = Array.isArray(user.member) ? user.member : [user.member];
      const member = members.find((m: MemberWithOrg) => m.org_id === currentOrgId);
      if (member?.org?.name) return member.org.name;
    }
    return "Organization";
  }, [user, vaultType, currentOrgId]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-100 w-full bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 text-sm font-medium">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* 1. Header Card - New Pattern */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          {/* Title Section */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm shrink-0">
              <FolderOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Vault Items
              </h1>
              <p className="text-gray-500 text-sm font-medium">
                Manage your secure credentials, notes, and keys.
              </p>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Context Switcher */}
            {showVaultSelector ? (
              <Select value={vaultType} onValueChange={handleVaultTypeChange}>
                <SelectTrigger className="w-full sm:w-65 h-14 py-7 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all focus:ring-2 focus:ring-blue-100/50 [&>span]:w-full text-left group">
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-lg border shadow-sm transition-colors ${
                        vaultType === "personal"
                          ? "bg-purple-50 border-purple-100 text-purple-600 group-hover:bg-purple-100"
                          : "bg-blue-50 border-blue-100 text-blue-600 group-hover:bg-blue-100"
                      }`}
                    >
                      {vaultType === "personal" ? (
                        <UserIcon className="w-5 h-5" />
                      ) : (
                        <Building className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-sm text-gray-900 leading-none mb-1 truncate">
                        {vaultType === "personal" ? "Personal Vault" : "Organization Vault"}
                      </span>
                      <span className="text-[11px] font-medium text-gray-500 truncate group-hover:text-gray-700 transition-colors">
                        {vaultType === "personal"
                          ? "Private • Owner"
                          : userRole
                          ? `Role: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}`
                          : "Shared Access"}
                      </span>
                    </div>
                  </div>
                </SelectTrigger>

                <SelectContent
                  className="w-65 p-1.5 bg-white border border-gray-200 shadow-xl rounded-xl"
                  align="start"
                  sideOffset={4}
                >
                  <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Switch Context
                  </div>

                  {showPersonalVault && (
                    <SelectItem
                      value="personal"
                      className="rounded-lg py-2.5 px-2 cursor-pointer focus:bg-purple-50 focus:text-purple-900 mb-1 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-gray-50 border border-gray-200 rounded-md text-gray-500 group-focus:bg-purple-100 group-focus:border-purple-200 group-focus:text-purple-600 transition-colors">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">Personal Vault</span>
                          <span className="text-[10px] text-gray-500 group-focus:text-purple-600/80">
                            Private Items
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  )}

                  {hasOrgAccess && (
                    <SelectItem
                      value="org"
                      className="rounded-lg py-2.5 px-2 cursor-pointer focus:bg-blue-50 focus:text-blue-900 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-gray-50 border border-gray-200 rounded-md text-gray-500 group-focus:bg-blue-100 group-focus:border-blue-200 group-focus:text-blue-600 transition-colors">
                          <Building className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">Organization Vault</span>
                          <span className="text-[10px] text-gray-500 group-focus:text-blue-600/80">
                            Team Items
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <div className="h-14 px-2 pr-4 flex items-center gap-3 bg-white border border-gray-200 rounded-xl shadow-sm min-w-50">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg">
                  <Building className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-gray-900 leading-none mb-1 truncate max-w-37.5">
                    {orgName}
                  </span>
                  <span className="text-[11px] font-medium text-gray-500">
                    Active Vault
                  </span>
                </div>
              </div>
            )}

            {/* Add Button */}
            <button
              onClick={handleAddItem}
              disabled={!canEdit || !vaultId}
              className={`
                h-14 px-6 flex items-center justify-center gap-2 rounded-xl font-bold text-sm shadow-sm transition-all
                ${canEdit && vaultId
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-md hover:-translate-y-0.5"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                }
              `}
            >
              {!vaultId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>New Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Toolbar & Search Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Search items, tags, or urls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-12 pr-10 bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-white focus:bg-white rounded-xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-medium transition-all border shadow-sm ${
                showFilters
                  ? "bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-100"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {(selectedType !== "all" || selectedTag) && (
                <span className="flex items-center justify-center min-w-5 h-5 px-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full ml-1">
                  {(selectedType !== "all" ? 1 : 0) + (selectedTag ? 1 : 0)}
                </span>
              )}
            </button>

            <div className="flex p-1 bg-gray-100 border border-gray-200 rounded-xl h-11 items-center">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 h-full aspect-square flex items-center justify-center rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 h-full aspect-square flex items-center justify-center rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                Filter by Type
              </h3>
              <button
                onClick={() => {
                  setSelectedType("all");
                  setSelectedTag(null);
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Reset filters
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {(["all", "login", "note", "totp"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type === "all" ? "all" : type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      selectedType === type
                        ? type === "all"
                          ? "bg-gray-900 border-gray-900 text-white shadow-sm"
                          : `${getTypeColor(type)} shadow-sm ring-1 ring-inset ring-black/5`
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {availableTags.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          selectedTag === tag
                            ? "bg-blue-600 border-blue-600 text-white shadow-md"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Content Grid/List */}
      <div className="min-h-100">
        {error && !isFetching && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4 mb-6 shadow-sm">
            <div className="bg-red-100 p-2 rounded-full">
               <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-red-900 font-bold text-sm">Unable to load items</h3>
              <p className="text-red-700 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-200 shadow-sm border-dashed">
            <div className="relative">
              <div className="w-10 h-10 border-4 border-blue-100 rounded-full animate-spin border-t-blue-600"></div>
            </div>
            <p className="text-gray-900 font-semibold mt-4">Syncing vault...</p>
          </div>
        ) : filteredItems.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-white shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 relative group">
              <Lock className="w-8 h-8 text-gray-300 group-hover:text-blue-400 transition-colors" />
            </div>
            <h3 className="text-gray-900 font-bold text-lg mb-1">
              {items.length === 0 ? "Vault is Empty" : "No Matches Found"}
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mb-6">
              {items.length === 0
                ? "Secure your first item now."
                : "Try adjusting filters or search terms."}
            </p>
            
            {items.length === 0 && canEdit && (
              <button
                onClick={handleAddItem}
                disabled={!vaultId}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                : "flex flex-col gap-3"
            }
          >
            {filteredItems.map((item) => {
              const itemTags = item.tags || [];
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer relative ${
                    viewMode === "list" ? "flex items-center gap-6 py-4" : "flex flex-col h-full"
                  }`}
                >
                  <div className={`flex items-start ${viewMode === "list" ? "gap-4 flex-1" : "justify-between mb-4"}`}>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all shrink-0">
                        {getItemIcon(item.type as ItemType[])}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 font-bold truncate text-base mb-0.5 group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1.5 font-medium">
                          {item.url ? (
                            <>
                              <Globe className="w-3 h-3 shrink-0 text-gray-400" />
                              <span className="truncate hover:text-gray-700">{item.url}</span>
                            </>
                          ) : (
                            <span className="text-gray-400 italic">No URL linked</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`flex flex-wrap gap-2 ${viewMode === "list" ? "" : "mb-4 mt-auto"}`}>
                    {item.type.map((type, index) => (
                      <span
                        key={index}
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getTypeColor(type)}`}
                      >
                        {type}
                      </span>
                    ))}
                  </div>

                  {itemTags.length > 0 && (
                    <div className={`flex flex-wrap gap-1.5 ${viewMode === "list" ? "hidden sm:flex" : "mb-5"}`}>
                      {itemTags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-[10px] font-medium rounded-md bg-gray-50 text-gray-600 border border-gray-200"
                        >
                          #{tag}
                        </span>
                      ))}
                      {itemTags.length > 3 && (
                        <span className="px-2 py-1 text-[10px] font-medium rounded-md bg-gray-50 text-gray-400 border border-gray-200">
                          +{itemTags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className={`text-[10px] font-medium text-gray-400 flex items-center gap-2 ${viewMode === "list" ? "hidden md:flex ml-auto" : "pt-4 border-t border-gray-50 w-full"}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-400 transition-colors"></div>
                    Edited {new Date(item.updated_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {vaultId && (
        <AddingItemsModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          vaultId={vaultId}
          vaultType={vaultType}
          orgId={vaultType === "org" ? currentOrgId || undefined : undefined}
          onSuccess={fetchItems}
        />
      )}

      {/* UPDATED: Pass userRole here! */}
      <ViewItemModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        canEdit={canEdit}
        vaultType={vaultType}
        orgId={vaultType === "org" ? currentOrgId : null}
        // @ts-expect-error userRole prop added now
        userRole={userRole} 
        onDelete={() => {
          toast.success("Item deleted");
          fetchItems();
        }}
        onEdit={() => {
          // handled inside ViewItemModal now via its own Edit dialog
        }}
      />
    </div>
  );
};