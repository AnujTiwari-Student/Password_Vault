import React, { useState, useEffect } from 'react';
import { Edit, Save, X, Loader2, Check, ChevronsUpDown } from 'lucide-react';
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
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span className="ml-3 text-gray-400">Loading vaults...</span>
        </div>
      </div>
    );
  }

  if (vaults.length === 0) {
    return (
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Edit className="w-5 h-5" />
          Vault Name
        </h3>
        <p className="text-gray-400">No vaults found</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Edit className="w-5 h-5" />
        Vault Name
      </h3>
      
      <div className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Select Vault
          </label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={isEditing}
                className="w-full justify-between bg-gray-700/50 border-gray-600/50 text-white hover:bg-gray-700/70 hover:text-white disabled:opacity-50"
              >
                {selectedVault
                  ? `${selectedVault.name} ${selectedVault.org_name ? `(${selectedVault.org_name})` : ''} - ${selectedVault.type === 'personal' ? 'Personal' : 'Organization'}`
                  : "Select vault..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
              <Command className="bg-gray-800 w-full">
                <CommandInput placeholder="Search vault..." className="text-white" />
                <CommandEmpty className="text-gray-400 py-6 text-center text-sm">No vault found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {vaults.map((vault) => (
                    <CommandItem
                      key={vault.id}
                      value={`${vault.name} ${vault.org_name || ''} ${vault.type}`}
                      onSelect={() => handleVaultChange(vault.id)}
                      className="text-white hover:bg-gray-700/50 cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedVaultId === vault.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{vault.name}</span>
                        <span className="text-xs text-gray-400">
                          {vault.org_name ? `${vault.org_name} - ` : ''}{vault.type === 'personal' ? 'Personal' : 'Organization'}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <div className="flex-1 flex items-center gap-3">
              <input
                type="text"
                value={vaultName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVaultName(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter vault name..."
                maxLength={50}
                disabled={loading}
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={loading || !vaultName.trim()}
                className="px-4 py-3 bg-blue-600/90 hover:bg-blue-700/90 disabled:bg-gray-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-3 bg-gray-600/50 hover:bg-gray-700/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-white">{selectedVault?.name}</p>
                <p className="text-sm text-gray-400">
                  {selectedVault?.can_edit 
                    ? 'Click edit to change your vault name' 
                    : 'You do not have permission to edit this vault'}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                disabled={!selectedVault?.can_edit}
                className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};