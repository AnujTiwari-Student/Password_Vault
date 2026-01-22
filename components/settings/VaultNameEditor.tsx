"use client";

import React, { useState, useEffect } from 'react';
import { Edit, Save, X, Loader2, Check, ChevronsUpDown, Database } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface VaultOption {
  id: string;
  name: string;
  type: string;
  created_at: Date;
  org_name?: string | null;
  can_edit: boolean;
}

export const VaultNameEditor: React.FC = () => {
  const [vaults, setVaults] = useState<VaultOption[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [vaultName, setVaultName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchLoading, setFetchLoading] = useState<boolean>(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchVaults();
  }, []);

  const fetchVaults = async (): Promise<void> => {
    try {
      const response = await fetch('/api/vault');
      const data = await response.json();

      if (response.ok) {
        setVaults(data.vaults);
        if (data.vaults.length > 0) {
          setSelectedVaultId(data.vaults[0].id);
          setVaultName(data.vaults[0].name);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch vaults');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch vaults';
      console.error('Error fetching vaults:', error);
      toast.error(errorMessage);
    } finally {
      setFetchLoading(false);
    }
  };

  const selectedVault = vaults.find(v => v.id === selectedVaultId);

  const handleVaultChange = (vaultId: string): void => {
    const vault = vaults.find(v => v.id === vaultId);
    if (vault) {
      setSelectedVaultId(vaultId);
      setVaultName(vault.name);
      setIsEditing(false);
      setOpen(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!selectedVault) return;

    if (vaultName.trim() === selectedVault.name || !vaultName.trim()) {
      setIsEditing(false);
      setVaultName(selectedVault.name);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/vault/${selectedVaultId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: vaultName.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Vault name updated successfully');
        setIsEditing(false);
        await fetchVaults();
        setVaultName(vaultName.trim());
      } else {
        throw new Error(data.error || 'Failed to update vault name');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update vault name';
      console.error('Error updating vault name:', error);
      toast.error(errorMessage);
      setVaultName(selectedVault.name);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (): void => {
    if (selectedVault) {
      setVaultName(selectedVault.name);
    }
    setIsEditing(false);
  };

  if (fetchLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 font-medium">Loading vaults...</span>
        </div>
      </div>
    );
  }

  if (vaults.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-gray-200">
            <Database size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No Organization Found</h3>
          <p className="text-sm text-gray-500 mt-1">Unable to locate organization data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
          <Edit className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Organization Name</h3>
      </div>
      
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Vault
          </label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={isEditing}
                className="w-full justify-between bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed h-11 font-medium"
              >
                <span className="truncate">
                  {selectedVault
                    ? `${selectedVault.name}${selectedVault.org_name ? ` (${selectedVault.org_name})` : ''}`
                    : "Select vault..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-white border-gray-200 shadow-lg" align="start">
              <Command className="bg-white">
                <CommandInput 
                  placeholder="Search vault..." 
                  className="text-gray-900 border-gray-200"
                />
                <CommandEmpty className="text-gray-500 py-6 text-center text-sm">
                  No vault found.
                </CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {vaults.map((vault) => (
                    <CommandItem
                      key={vault.id}
                      value={`${vault.name} ${vault.org_name || ''} ${vault.type}`}
                      onSelect={() => handleVaultChange(vault.id)}
                      className="text-gray-900 hover:bg-gray-100 cursor-pointer py-3"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-blue-600",
                          selectedVaultId === vault.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-semibold text-gray-900 truncate">{vault.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {vault.org_name && (
                            <span className="text-xs text-gray-500">{vault.org_name}</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            vault.type === 'personal' 
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}>
                            {vault.type === 'personal' ? 'Personal' : 'Organization'}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vault Name
              </label>
              <input
                type="text"
                value={vaultName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVaultName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter vault name..."
                maxLength={50}
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1.5">
                {vaultName.length}/50 characters
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={loading || !vaultName.trim() || vaultName.trim() === selectedVault?.name}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-colors font-semibold flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-base font-semibold text-gray-900 truncate">
                    {selectedVault?.name}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wide border-2 flex-shrink-0 ${
                    selectedVault?.type === 'personal' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                    {selectedVault?.type === 'personal' ? 'Personal' : 'Organization'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {selectedVault?.can_edit 
                    ? 'Click edit to change your vault name' 
                    : 'You do not have permission to edit this vault'}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                disabled={!selectedVault?.can_edit}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg transition-colors flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
