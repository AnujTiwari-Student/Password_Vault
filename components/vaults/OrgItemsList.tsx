"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, Grid, List, Key, Users, Building, Lock, Edit } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { EnhancedItemDrawer } from "../drawer/EnhancedItemDrawer";
import { useUserMasterKey } from "@/hooks/useUserMasterKey";
import { useVaultOVK } from "@/hooks/useVaultOvk";
import { useDecryption } from "@/hooks/useDecryption";
import { canUserDecrypt, canUserEdit } from "@/utils/permission-utils";
import { APIVaultItem, User, MemberRole } from "@/types/vault";

const useOrgItems = (searchTerm: string, typeFilter: string, tagFilter: string) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<APIVaultItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [vaultInfo, setVaultInfo] = useState<{
    vault_id: string;
    vault_name: string;
    user_role: string;
    org_id: string;
  } | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (typeFilter) params.append('type', typeFilter);
      if (tagFilter) params.append('tag', tagFilter);

      const response = await fetch(`/api/items/member-items?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch organization items');
      }

      setItems(data.items || []);
      setVaultInfo({
        vault_id: data.vault_id,
        vault_name: data.vault_name,
        user_role: data.user_role,
        org_id: data.org_id
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, tagFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { loading, items, error, vaultInfo, refetch: fetchItems };
};

export const OrgItemsList: React.FC = () => {
  const router = useRouter();
  const user = useCurrentUser() as User | null;

  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<APIVaultItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [mnemonic, setMnemonic] = useState<string>("");
  const [showPassphraseInput, setShowPassphraseInput] = useState<boolean>(false);

  // @ts-expect-error Todo: need to be fixed
  const userRole: MemberRole | null = user.member.role! as MemberRole | null;
  const canDecrypt: boolean = canUserDecrypt(userRole);
  const canEdit: boolean = canUserEdit(userRole);

  const { umkCryptoKey, privateKeyBase64 } = useUserMasterKey(mnemonic || null);
  const { loading, items, error, vaultInfo, refetch } = useOrgItems(searchTerm, typeFilter, tagFilter);
  
  const ovkResult = useVaultOVK(
    umkCryptoKey,
    vaultInfo?.vault_id || null,
    'org',
    privateKeyBase64
  );

  const ovkCryptoKey = ovkResult?.ovkCryptoKey || null;
  const { decryptItem, getDecryptedItem, isDecrypting } = useDecryption(ovkCryptoKey);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (canDecrypt) {
      setShowPassphraseInput(true);
    }
  }, [canDecrypt]);

  const getDisplayUsername = (item: APIVaultItem): string => {
    const decrypted = getDecryptedItem(item.id);
    if (decrypted?.username) {
      return decrypted.username;
    }
    if (item.type.includes('login') && item.username_ct) {
      if (canDecrypt && ovkCryptoKey) {
        return '[Click to decrypt]';
      } else {
        return '[Encrypted]';
      }
    }
    return "";
  };

  const hasTotp = (item: APIVaultItem): boolean => {
    return item.type.includes('totp') && !!item.totp_seed_ct;
  };

  const getTypeDisplayString = (types: string[]): string => {
    return types.map(type => type.charAt(0).toUpperCase() + type.slice(1)).join(' + ');
  };

  const getTypeColor = (types: string[]): string => {
    if (types.length === 1) {
      switch (types[0]) {
        case 'login': return 'bg-blue-900/30 text-blue-300 border-blue-700/30';
        case 'note': return 'bg-purple-900/30 text-purple-300 border-purple-700/30';
        case 'totp': return 'bg-green-900/30 text-green-300 border-green-700/30';
        default: return 'bg-gray-900/30 text-gray-300 border-gray-700/30';
      }
    }
    return 'bg-gradient-to-r from-blue-900/30 to-green-900/30 text-white border-blue-700/30';
  };

  const getRoleBadgeColor = (role: MemberRole | null): string => {
    switch (role) {
      case 'owner': return 'bg-yellow-900/30 text-yellow-300 border-yellow-700/30';
      case 'admin': return 'bg-blue-900/30 text-blue-300 border-blue-700/30';
      case 'member': return 'bg-green-900/30 text-green-300 border-green-700/30';
      case 'viewer': return 'bg-gray-900/30 text-gray-300 border-gray-700/30';
      default: return 'bg-gray-900/30 text-gray-300 border-gray-700/30';
    }
  };

  const handleDecryptAndOpen = async (item: APIVaultItem): Promise<void> => {
    if (!getDecryptedItem(item.id) && ovkCryptoKey && mnemonic && canDecrypt) {
      await decryptItem(item);
    }
    setSelectedItem(item);
    setIsItemDrawerOpen(true);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
        <span className="ml-2 text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-4 md:space-y-6 p-3 md:p-4 lg:p-6 min-h-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div className="min-w-0 flex-shrink">
            <div className="flex items-center gap-2 mb-1">
              <Building className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white truncate">
                Org Items
              </h2>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${getRoleBadgeColor(userRole)}`}>
                <Users className="w-3 h-3" />
                <span className="text-xs">{userRole || 'Unknown'}</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              {loading ? "Loading..." : 
               error ? "Error loading items" :
               `${items.length} items${vaultInfo?.vault_name ? ` in ${vaultInfo.vault_name}` : ''}`}
            </p>
          </div>
        </div>

        {showPassphraseInput && canDecrypt && (
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-gray-400" />
              <label className="text-white font-medium text-sm">
                Master Passphrase
              </label>
              <span className={`px-2 py-0.5 rounded text-xs ${getRoleBadgeColor(userRole)}`}>
                {userRole} access
              </span>
            </div>
            <input
              type="password"
              value={mnemonic}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMnemonic(e.target.value)}
              placeholder="Enter your 24-word master passphrase to decrypt items"
              className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-gray-600 font-mono text-sm"
            />
            <div className="flex items-center gap-2">
              {ovkCryptoKey ? (
                <div className="flex items-center gap-1 text-green-400 text-xs">
                  <span>✓</span>
                  <span>Decryption key loaded for organization vault</span>
                </div>
              ) : mnemonic.trim() ? (
                <div className="flex items-center gap-1 text-yellow-400 text-xs">
                  <span>⏳</span>
                  <span>Loading organization vault key...</span>
                </div>
              ) : (
                <p className="text-gray-400 text-xs">
                  Enter passphrase to enable decryption
                </p>
              )}
              <button
                onClick={() => setShowPassphraseInput(false)}
                className="ml-auto text-xs text-gray-500 hover:text-gray-400 underline"
                type="button"
              >
                Hide
              </button>
            </div>
          </div>
        )}

        {!canDecrypt && (
          <div className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
              <h3 className="text-gray-300 font-medium text-sm">View-Only Access</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <p>You have {userRole} permissions for this organization vault. You can:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>View item names, URLs, and metadata</li>
                <li>Copy encrypted values for external decryption</li>
                {(userRole === 'member' || userRole === 'admin' || userRole === 'owner') && <li>Share items with others</li>}
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Decryption requires higher permissions or organization membership.
              </p>
            </div>
          </div>
        )}

        {!showPassphraseInput && canDecrypt && (
          <div className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-3">
            <button
              onClick={() => setShowPassphraseInput(true)}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-300 text-sm transition-colors"
              type="button"
            >
              <Key className="w-4 h-4" />
              <span>Show passphrase input to decrypt organization items</span>
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full">
          <div className="relative flex-1 min-w-0 transition-all duration-300">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <input
              type="text"
              placeholder="Search organization items..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`w-full pl-10 pr-4 py-2.5 md:py-3 bg-gray-800/50 backdrop-blur-sm border ${isSearchFocused ? 'border-gray-600' : 'border-gray-700/50'} rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-gray-600 transition-all duration-300 text-sm md:text-base`}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 flex-shrink-0">
            <select
              value={typeFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
              className="flex-shrink-0 p-2.5 md:p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white text-sm focus:border-gray-600 focus:outline-none min-w-[100px]"
            >
              <option value="">All Types</option>
              <option value="login">Login</option>
              <option value="note">Note</option>
              <option value="totp">TOTP</option>
            </select>

            <select
              value={tagFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTagFilter(e.target.value)}
              className="flex-shrink-0 p-2.5 md:p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white text-sm focus:border-gray-600 focus:outline-none min-w-[100px]"
            >
              <option value="">All Tags</option>
              {Array.from(new Set(items.flatMap(item => item.tags || []))).map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="flex-shrink-0 p-2.5 md:p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
              type="button"
            >
              {viewMode === "grid" ? (
                <List className="w-4 h-4 text-gray-400" />
              ) : (
                <Grid className="w-4 h-4 text-gray-400" />
              )}
            </button>

            <button 
              onClick={refetch}
              className="flex-shrink-0 p-2.5 md:p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
              type="button"
            >
              <Filter className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-4 text-gray-300 w-full">
            <p className="font-semibold">Error loading organization items:</p>
            <p className="text-sm mt-1 break-words text-gray-400">{error}</p>
            <button
              onClick={refetch}
              className="mt-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg text-sm transition-colors"
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
            <span className="ml-2 text-gray-400">Loading organization items...</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-400 w-full">
                <Building className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No organization items found</p>
                <p className="text-sm">Items shared by your organization will appear here.</p>
              </div>
            ) : (
              <div className={`w-full grid gap-3 md:gap-4 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              } auto-rows-max`}>
                {items.map((item: APIVaultItem) => {
                  const isItemDecrypting: boolean = isDecrypting(item.id);
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleDecryptAndOpen(item)}
                      className="group bg-gray-800/30 backdrop-blur-sm hover:bg-gray-700/40 border border-gray-700/30 hover:border-gray-600/50 rounded-xl md:rounded-2xl p-4 md:p-5 cursor-pointer transition-all duration-300 hover:scale-[1.01] md:hover:scale-[1.02] w-full min-w-0"
                    >
                      <div className="flex items-start justify-between mb-2 md:mb-3 min-w-0">
                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className="text-white font-semibold text-base md:text-lg group-hover:text-gray-200 transition-colors truncate">
                            {item.name}
                          </h4>
                          {getDisplayUsername(item) && (
                            <p className="text-gray-400 text-xs md:text-sm mt-1 truncate">
                              {getDisplayUsername(item)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                          <span className={`px-2 py-0.5 md:py-1 text-xs rounded-md md:rounded-lg border whitespace-nowrap ${getTypeColor(item.type)}`}>
                            {getTypeDisplayString(item.type)}
                          </span>
                          {hasTotp(item) && (
                            <div
                              className="w-2 h-2 bg-green-500/70 rounded-full animate-pulse flex-shrink-0"
                              title="2FA Enabled"
                            />
                          )}
                          {isItemDecrypting && (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                          )}
                          {canEdit && (
                            <Edit
                              className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          )}
                        </div>
                      </div>

                      {item.url && (
                        <p className="text-gray-400 text-xs mb-2 truncate hover:text-gray-300 transition-colors">
                          🌐 {item.url}
                        </p>
                      )}

                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 md:mb-3 min-w-0">
                          {item.tags.slice(0, 3).map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-700/30 text-gray-400 text-xs rounded-md flex-shrink-0"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-700/30 text-gray-500 text-xs rounded-md flex-shrink-0">
                              +{item.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 min-w-0">
                        <span className="truncate">
                          Updated {new Date(item.updated_at).toLocaleDateString()}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                          <span className="text-gray-400 whitespace-nowrap">
                            {canDecrypt && ovkCryptoKey ? "View & decrypt →" : 
                             canDecrypt ? "View details →" : 
                             "View →"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <EnhancedItemDrawer
          isOpen={isItemDrawerOpen}
          onClose={() => setIsItemDrawerOpen(false)}
          item={selectedItem}
          decryptedData={selectedItem ? getDecryptedItem(selectedItem.id) : null}
          userRole={userRole}
          canDecrypt={canDecrypt}
          canEdit={canEdit}
          onEdit={() => console.log("Edit clicked")}
        />
      </div>
    </div>
  );
};
