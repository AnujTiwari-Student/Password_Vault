"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, PencilLine } from 'lucide-react';
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
      <DialogContent className="max-w-xl bg-white border border-gray-200 text-gray-900 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
        
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
              <PencilLine className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">Edit Item</DialogTitle>
              <DialogDescription className="text-gray-500 mt-0.5">
                Update the basic details for <span className="font-medium text-gray-900">{item.name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-blue-700 text-sm leading-relaxed">
              <span className="font-semibold">Note:</span> Currently only name and URL can be edited. To change encrypted fields (password, username), please create a new version of this item.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 h-11 rounded-xl transition-all"
                disabled={isEditing}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url" className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Website URL
              </Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                className="bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 h-11 rounded-xl transition-all placeholder:text-gray-400"
                disabled={isEditing}
                placeholder="https://example.com"
              />
            </div>

            {/* Footer placed inside form to handle submit naturally, but styled at bottom */}
            <div className="pt-2 flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isEditing}
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 px-5 rounded-xl h-11 font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isEditing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl h-11 font-medium shadow-sm hover:shadow-md transition-all"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};