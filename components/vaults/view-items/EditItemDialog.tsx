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
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from 'lucide-react';
import { APIVaultItem } from '@/types/vault';

interface FormData {
  name: string;
  url: string;
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
  });
  const [initialData, setInitialData] = useState<FormData | null>(null);

  console.log('Decrypted Data:', decryptedData);

  useEffect(() => {
    if (isOpen) {
      const initial = {
        name: item.name || '',
        url: item.url || '',
      };
      setFormData(initial);
      setInitialData(initial);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!initialData) return;

    const updatedData: Partial<FormData> = {};
    
    if (formData.name !== initialData.name) updatedData.name = formData.name;
    if (formData.url !== initialData.url) updatedData.url = formData.url;

    if (Object.keys(updatedData).length === 0) {
      onClose();
      return;
    }

    onSave(updatedData);
  };

  const handleCancel = () => {
    if (initialData) {
      setFormData(initialData);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Edit Item: {item.name}</DialogTitle>
          <DialogDescription>Update the name and URL for this vault item</DialogDescription>
        </DialogHeader>

        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-blue-300 text-sm">
              Currently only name and URL can be edited. To change encrypted fields (password, username, etc.), please create a new item.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="bg-gray-900 border-gray-700 text-white focus:border-blue-500"
              disabled={isEditing}
              required
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
              placeholder="https://example.com"
            />
          </div>

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