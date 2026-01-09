"use client";
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
import { APIVaultItem } from '@/types/vault';

interface FormData {
  name: string;
  url: string;
  username: string;
  password: string;
  totp_seed: string;
  note: string;
}

interface EditItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FormData>) => void;
  item: APIVaultItem;
  decryptedData: { [key: string]: string } | null;
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
  const [formData, setFormData] = useState<FormData>({
    name: '',
    url: '',
    username: '',
    password: '',
    totp_seed: '',
    note: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (decryptedData) {
      setFormData({
        name: decryptedData.name || item.name || '',
        url: decryptedData.url || item.url || '',
        username: decryptedData.username || '',
        password: decryptedData.password || '',
        totp_seed: decryptedData.totp_seed || '',
        note: decryptedData.note || '',
      });
    }
  }, [decryptedData, item]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData: Partial<FormData> = {};
    
    if (formData.name !== item.name) updatedData.name = formData.name;
    if (formData.url !== item.url) updatedData.url = formData.url || '';
    if (formData.username !== decryptedData?.username) updatedData.username = formData.username;
    if (formData.password !== decryptedData?.password) updatedData.password = formData.password;
    if (formData.totp_seed !== decryptedData?.totp_seed) updatedData.totp_seed = formData.totp_seed;
    if (formData.note !== decryptedData?.note) updatedData.note = formData.note;

    onSave(updatedData);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Edit Item: {item.name}</DialogTitle>
          <DialogDescription>Update the details for this vault item</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="bg-gray-900 border-gray-700 text-white focus:border-blue-500"
              disabled={isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Website</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              className="bg-gray-900 border-gray-700 text-white focus:border-blue-500"
              disabled={isEditing}
            />
          </div>

          {item.username_ct && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white focus:border-blue-500"
                disabled={isEditing}
              />
            </div>
          )}

          {item.password_ct && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
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
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {item.totp_seed_ct && (
            <div className="space-y-2">
              <Label htmlFor="totp_seed">TOTP Secret</Label>
              <Input
                id="totp_seed"
                value={formData.totp_seed}
                onChange={(e) => handleChange('totp_seed', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white focus:border-blue-500 font-mono"
                disabled={isEditing}
              />
            </div>
          )}

          {item.note_ct && (
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => handleChange('note', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white focus:border-blue-500 min-h-[120px]"
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
