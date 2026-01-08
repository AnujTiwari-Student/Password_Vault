

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { APIVaultItem, DecryptedItemData } from '@/types/vault';

interface EditItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: Partial<DecryptedItemData>) => void;
  item: APIVaultItem;
  decryptedData: DecryptedItemData | null;
  isEditing: boolean;
}

export const EditItemDialog: React.FC<EditItemDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
  decryptedData,
  isEditing,
}) => {
  const [formData, setFormData] = useState<Partial<DecryptedItemData>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (decryptedData) {
      setFormData({
        username: decryptedData.username || '',
        password: decryptedData.password || '',
        totp_seed: decryptedData.totp_seed || '',
        note: decryptedData.note || '',
      });
    }
  }, [decryptedData]);

  const handleChange = (field: keyof DecryptedItemData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleCancel = () => {
    setFormData({
      username: decryptedData?.username || '',
      password: decryptedData?.password || '',
      totp_seed: decryptedData?.totp_seed || '',
      note: decryptedData?.note || '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Item: {item.name}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Update the details for this vault item
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {item.username_ct && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username || ''}
                onChange={(e) => handleChange('username', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white focus:border-blue-500"
                disabled={isEditing}
              />
            </div>
          )}

          {item.password_ct && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password || ''}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white focus:border-blue-500 pr-12"
                  disabled={isEditing}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  disabled={isEditing}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {item.totp_seed_ct && (
            <div className="space-y-2">
              <Label htmlFor="totp_seed" className="text-gray-300">
                TOTP Secret
              </Label>
              <Input
                id="totp_seed"
                type="text"
                value={formData.totp_seed || ''}
                onChange={(e) => handleChange('totp_seed', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white focus:border-blue-500 font-mono"
                disabled={isEditing}
              />
            </div>
          )}

          {item.note_ct && (
            <div className="space-y-2">
              <Label htmlFor="note" className="text-gray-300">
                Note
              </Label>
              <Textarea
                id="note"
                value={formData.note || ''}
                onChange={(e) => handleChange('note', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white focus:border-blue-500 min-h-[120px] resize-none"
                disabled={isEditing}
              />
            </div>
          )}

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isEditing}
              className="bg-transparent hover:bg-gray-700 text-gray-300 border-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isEditing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEditing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};