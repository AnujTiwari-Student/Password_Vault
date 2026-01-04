import React, { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Vault } from '@/types/vault';
import { toast } from 'sonner';

interface VaultNameEditorProps {
  vault: Vault;
}

export const VaultNameEditor: React.FC<VaultNameEditorProps> = ({ vault }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [vaultName, setVaultName] = useState<string>(vault.name);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSave = async (): Promise<void> => {
    if (vaultName.trim() === vault.name || !vaultName.trim()) {
      setIsEditing(false);
      setVaultName(vault.name);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/vault/${vault.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: vaultName.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Vault name updated successfully');
        setIsEditing(false);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error(data.error || 'Failed to update vault name');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update vault name';
      console.error('Error updating vault name:', error);
      toast.error(errorMessage);
      setVaultName(vault.name);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (): void => {
    setVaultName(vault.name);
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Edit className="w-5 h-5" />
        Vault Name
      </h3>
      
      <div className="space-y-4">
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
                <p className="text-lg font-medium text-white">{vault.name}</p>
                <p className="text-sm text-gray-400">Click edit to change your vault name</p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg transition-colors flex items-center gap-2"
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