"use client";


import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Grid,
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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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


  useEffect(() => {
    if (user) {
      console.log('👤 USER OBJECT:', JSON.stringify(user, null, 2));
    }
  }, [user]);


  const hasOrgAccess = useMemo(() => {
    if (user?.org?.id) {
      console.log('✅ User owns org:', user.org.id);
      return true;
    }
    
    if (user?.member) {
      console.log('✅ User has member data');
      return true;
    }
    
    console.log('❌ No org access');
    return false;
  }, [user]);


  const isOrgOnlyAccount = useMemo(() => {
    const isOrgOwner = user?.account_type === 'org';
    const hasPersonalVault = !!user?.vault?.id;
    console.log('🔍 Account check:', { isOrgOwner, hasPersonalVault, isOrgOnly: isOrgOwner && !hasPersonalVault });
    return isOrgOwner && !hasPersonalVault;
  }, [user]);


  const showPersonalVault = useMemo(() => {
    const show = !!user?.vault?.id;
    console.log('🔍 Show personal vault:', show);
    return show;
  }, [user]);


  const showVaultSelector = useMemo(() => {
    const show = showPersonalVault && hasOrgAccess;
    console.log('🔍 Show vault selector:', show);
    return show;
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
      if (orgIdFromUrl) {
        console.log('🔍 Using org from URL:', orgIdFromUrl);
        return orgIdFromUrl;
      }
      
      if (user?.org?.id) {
        console.log('🔍 Using owned org:', user.org.id);
        return user.org.id;
      }
      
      if (user?.member) {
        const members = Array.isArray(user.member) ? user.member : [user.member];
        const orgId = members[0]?.org_id;
        console.log('🔍 Using member org:', orgId);
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
          console.log('📡 Fetching org vault for org:', currentOrgId);
          const response = await axios.get(`/api/vaults/org/${currentOrgId}`);
          if (response.data.vault?.id) {
            setOrgVaultId(response.data.vault.id);
            console.log('✅ Org vault ID fetched:', response.data.vault.id);
            
            if (response.data.membership?.role) {
              setFetchedRole(response.data.membership.role as UserRole);
              console.log('✅ Role fetched:', response.data.membership.role);
            }
          }
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error("❌ Failed to fetch org vault:", error.response?.data || error.message);
          } else {
            console.error("❌ Failed to fetch org vault:", error);
          }
        }
      }
    };


    fetchOrgVault();
  }, [vaultType, currentOrgId]);


  const vaultId = useMemo(() => {
    if (vaultType === "personal") {
      const id = user?.vault?.id || null;
      console.log('🔍 Personal vault ID:', id);
      return id;
    } else {
      if (orgVaultId) {
        console.log('🔍 Org vault ID (fetched):', orgVaultId);
        return orgVaultId;
      }


      if (user?.org?.vault_id) {
        console.log('🔍 Org vault ID (from user.org):', user.org.vault_id);
        return user.org.vault_id;
      }


      console.log('❌ No vault ID found');
      return null;
    }
  }, [vaultType, user, orgVaultId]);


  const userRole = useMemo((): UserRole | null => {
    if (vaultType === "personal") {
      console.log('🔍 Personal vault role: owner');
      return "owner";
    }
    
    if (fetchedRole) {
      console.log('🔍 Using fetched role:', fetchedRole);
      return fetchedRole;
    }
    
    if (user?.org?.id === currentOrgId && user?.org?.owner_user_id === user?.id) {
      console.log('🔍 Org role: owner (owns org)');
      return "owner";
    }
    
    if (user?.member) {
      const members = Array.isArray(user.member) ? user.member : [user.member];
      const member = members.find((m: MemberWithOrg) => m.org_id === currentOrgId);
      const role = member?.role as UserRole | undefined;
      console.log('🔍 Org role (from member):', role);
      return role || null;
    }
    
    console.log('❌ No role found, defaulting to owner for org account');
    if (user?.account_type === 'org' && user?.org?.id === currentOrgId) {
      return 'owner';
    }
    
    return null;
  }, [vaultType, user, currentOrgId, fetchedRole]);


  const canEdit = useMemo(() => {
    const result = userRole ? canUserEdit(userRole) : false;
    console.log('🔍 Can edit:', result, 'Role:', userRole);
    return result;
  }, [userRole]);


  const fetchItems = useCallback(async () => {
    if (!vaultId) {
      setLoading(false);
      setIsFetching(false);
      console.log('❌ No vault ID, skipping fetch');
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
        if (!currentOrgId) {
          throw new Error("Organization ID is missing");
        }
        endpoint = "/api/items/member-items";
        params = {
          vault_id: vaultId,
          org_id: currentOrgId,
        };
      }


      console.log("📡 Fetching items:", { endpoint, params, vaultType });


      const queryString = new URLSearchParams(params).toString();
      const response = await axios.get(`${endpoint}?${queryString}`);


      setItems(response.data.items || []);
      setError(null);
      
      if (response.data.user_role && !fetchedRole) {
        console.log('✅ Got role from items API:', response.data.user_role);
        setFetchedRole(response.data.user_role as UserRole);
      }
      
      console.log("✅ Items loaded:", response.data.items?.length || 0);
    } catch (error) {
      console.error("❌ Failed to fetch items:", error);


      let errorMessage = "Failed to load vault items";


      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          errorMessage = error.response?.data?.message || "Invalid request.";
        } else if (error.response?.status === 403) {
          errorMessage = error.response?.data?.message || "Access denied";
        } else if (error.response?.status === 404) {
          errorMessage = error.response?.data?.message || "Vault not found";
        }
      }


      setError(errorMessage);
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
    console.log('🔘 Add button clicked. canEdit:', canEdit, 'vaultId:', vaultId, 'userRole:', userRole);
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
    console.log('🔄 Switching vault type to:', newType);
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
      return <Globe className="w-5 h-5 text-blue-400" />;
    if (type.includes("totp"))
      return <Shield className="w-5 h-5 text-green-400" />;
    if (type.includes("note"))
      return <FileText className="w-5 h-5 text-purple-400" />;
    return <Lock className="w-5 h-5 text-gray-400" />;
  };


  const getTypeColor = (type: string) => {
    switch (type) {
      case "login":
        return "bg-blue-900/30 text-blue-300 border-blue-700/30";
      case "note":
        return "bg-purple-900/30 text-purple-300 border-purple-700/30";
      case "totp":
        return "bg-green-900/30 text-green-300 border-green-700/30";
      default:
        return "bg-gray-900/30 text-gray-300 border-gray-700/30";
    }
  };


  const orgName = useMemo(() => {
    if (vaultType !== 'org') return null;
    
    if (user?.org?.name) {
      return user.org.name;
    }
    
    if (user?.member) {
      const members = Array.isArray(user.member) ? user.member : [user.member];
      const member = members.find((m: MemberWithOrg) => m.org_id === currentOrgId);
      if (member?.org?.name) return member.org.name;
    }
    
    return "Organization";
  }, [user, vaultType, currentOrgId]);


  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400 text-base">Loading user data...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-700/50">
        {showVaultSelector ? (
          <Select value={vaultType} onValueChange={handleVaultTypeChange}>
            <SelectTrigger className="w-full sm:w-[320px] bg-gray-800/50 border-0 text-white hover:bg-gray-800 transition-colors py-6 px-4">
              <SelectValue>
                <div className="flex items-center gap-3 py-2">
                  {vaultType === "personal" ? (
                    <>
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <UserIcon className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-white">Personal Vault</span>
                        <span className="text-xs text-gray-400">Your private items</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Building className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-white">Organization Vault</span>
                        {userRole ? (
                          <span className="text-xs text-gray-400 capitalize">
                            Role: {userRole}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Shared with team</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-2 border-gray-700 min-w-[320px]">
              {showPersonalVault && (
                <SelectItem 
                  value="personal" 
                  className="hover:bg-gray-700 cursor-pointer focus:bg-gray-700"
                >
                  <div className="flex items-center gap-3 py-3 px-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <UserIcon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-white">Personal Vault</span>
                      <span className="text-xs text-gray-400">Your private items</span>
                    </div>
                  </div>
                </SelectItem>
              )}
              {hasOrgAccess && (
                <SelectItem 
                  value="org" 
                  className="hover:bg-gray-700 cursor-pointer focus:bg-gray-700"
                >
                  <div className="flex items-center gap-3 py-3 px-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Building className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-white">Organization Vault</span>
                      <span className="text-xs text-gray-400">Shared with team</span>
                    </div>
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Building className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg text-white">
                {orgName} Vault
              </span>
              <span className="text-xs text-gray-400 capitalize">
                {userRole === 'owner' ? 'Administrator Access' : `${userRole} Access`}
              </span>
            </div>
          </div>
        )}


        <button
          onClick={handleAddItem}
          disabled={!canEdit || !vaultId}
          title={
            !vaultId 
              ? "Loading vault..." 
              : !canEdit 
              ? "You don't have permission to add items" 
              : "Add a new item"
          }
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg ${
            canEdit && vaultId
              ? "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-500/50 hover:scale-105"
              : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
          }`}
        >
          {!vaultId ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          <span>Add Item</span>
        </button>
      </div>


      <div className="flex items-center gap-4">
        <div
          className={`p-3 rounded-xl ${
            vaultType === "org"
              ? "bg-blue-500/20 border border-blue-500/30"
              : "bg-purple-500/20 border border-purple-500/30"
          }`}
        >
          {vaultType === "org" ? (
            <Building className="w-7 h-7 text-blue-400" />
          ) : (
            <UserIcon className="w-7 h-7 text-purple-400" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            {vaultType === "org" ? "Organization Vault" : "Personal Vault"}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-400">
              {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
            </p>
            {items.length !== filteredItems.length && (
              <span className="text-xs text-gray-500">
                • Filtered from {items.length}
              </span>
            )}
          </div>
        </div>
      </div>


      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-800 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>


        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
              showFilters
                ? "bg-blue-600/20 border-2 border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/20"
                : "bg-gray-800/50 border-2 border-gray-700 text-gray-300 hover:bg-gray-700/50 hover:border-gray-600"
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
            {(selectedType !== "all" || selectedTag) && (
              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {(selectedType !== "all" ? 1 : 0) + (selectedTag ? 1 : 0)}
              </span>
            )}
          </button>


          <div className="flex bg-gray-800/50 border-2 border-gray-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-3 transition-all ${
                viewMode === "grid"
                  ? "bg-blue-600/30 text-blue-300 shadow-inner"
                  : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/30"
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <div className="w-px bg-gray-700"></div>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-3 transition-all ${
                viewMode === "list"
                  ? "bg-blue-600/30 text-blue-300 shadow-inner"
                  : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/30"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>


      {showFilters && (
        <div className="bg-gray-800/30 backdrop-blur-sm border-2 border-gray-700/50 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Options
            </h3>
            <button
              onClick={() => {
                setSelectedType("all");
                setSelectedTag(null);
              }}
              className="text-sm text-gray-400 hover:text-white px-3 py-1.5 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              Clear all
            </button>
          </div>


          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Item Type
              </label>
              <div className="flex flex-wrap gap-2">
                {(["all", "login", "note", "totp"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type === "all" ? "all" : type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedType === type
                        ? type === "all"
                          ? "bg-gray-700 border-2 border-gray-600 text-white shadow-lg scale-105"
                          : `${getTypeColor(type)} border-2 shadow-lg scale-105`
                        : "bg-gray-700/30 border-2 border-transparent text-gray-400 hover:bg-gray-700/50 hover:text-gray-300"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>


            {availableTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Tags ({availableTags.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() =>
                        setSelectedTag(tag === selectedTag ? null : tag)
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedTag === tag
                          ? "bg-blue-600/30 border-2 border-blue-500/50 text-blue-300 shadow-lg scale-105"
                          : "bg-gray-700/30 border-2 border-transparent text-gray-400 hover:bg-gray-700/50 hover:text-gray-300"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {error && !isFetching && (
        <div className="bg-red-900/20 border-2 border-red-700/50 rounded-xl p-5 flex items-start gap-4 shadow-lg">
          <div className="p-2 bg-red-500/20 rounded-lg flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-red-300 font-semibold mb-1">
              Error Loading Items
            </h3>
            <p className="text-red-200/80 text-sm">{error}</p>
          </div>
        </div>
      )}


      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-gray-400 text-lg">Loading vault items...</p>
            <p className="text-gray-500 text-sm mt-1">Please wait</p>
          </div>
        </div>
      ) : filteredItems.length === 0 && !error ? (
        <div className="text-center py-16 bg-gray-800/20 rounded-xl border-2 border-dashed border-gray-700/50">
          <div className="p-4 bg-gray-700/30 w-fit mx-auto rounded-full mb-4">
            <Lock className="w-12 h-12 text-gray-500" />
          </div>
          <p className="text-gray-400 text-lg font-medium mb-2">
            {items.length === 0
              ? "No items in this vault"
              : "No items match your filters"}
          </p>
          <p className="text-gray-500 text-sm mb-6">
            {items.length === 0
              ? "Add your first item to get started"
              : "Try adjusting your search or filters"}
          </p>
          {items.length === 0 && canEdit && (
            <button
              onClick={handleAddItem}
              disabled={!vaultId}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg hover:shadow-blue-500/50 disabled:bg-gray-700/50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Add your first item
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              : "space-y-4"
          }
        >
          {filteredItems.map((item) => {
            const itemTags = item.tags || [];
            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`bg-gray-800/40 backdrop-blur-sm border-2 border-gray-700/50 rounded-xl p-5 hover:bg-gray-700/40 hover:border-gray-600 hover:shadow-xl transition-all cursor-pointer group ${
                  viewMode === "list" ? "flex items-center gap-4" : ""
                }`}
              >
                <div className={`flex items-start ${viewMode === "list" ? "gap-4 flex-1" : "justify-between mb-4"}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2.5 bg-gray-700/50 rounded-xl group-hover:bg-gray-600/50 group-hover:scale-110 transition-all flex-shrink-0">
                      {getItemIcon(item.type as ItemType[])}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate mb-1 group-hover:text-blue-300 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                        {item.url ? (
                          <>
                            <Globe className="w-3 h-3 flex-shrink-0" />
                            {item.url}
                          </>
                        ) : (
                          "No URL"
                        )}
                      </p>
                    </div>
                  </div>
                </div>


                <div className={`flex flex-wrap gap-2 ${viewMode === "list" ? "" : "mb-3"}`}>
                  {item.type.map((type, index) => (
                    <span
                      key={index}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg ${getTypeColor(
                        type
                      )} border`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  ))}
                </div>


                {itemTags.length > 0 && (
                  <div className={`flex flex-wrap gap-2 ${viewMode === "list" ? "" : "mb-3"}`}>
                    {itemTags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-700/40 text-gray-300 border border-gray-600/30"
                      >
                        #{tag}
                      </span>
                    ))}
                    {itemTags.length > 3 && (
                      <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-700/40 text-gray-400 border border-gray-600/30">
                        +{itemTags.length - 3} more
                      </span>
                    )}
                  </div>
                )}


                <div className="text-xs text-gray-500 flex items-center gap-1 pt-2 border-t border-gray-700/50">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Updated {new Date(item.updated_at).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}


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
        // @ts-expect-error TODO fix this any type
        onDelete={() => {
          toast.success("Item deleted (API not implemented yet)");
          fetchItems();
        }}
        onEdit={() => {
          toast.info("Edit feature coming soon");
        }}
      />
    </div>
  );
};
