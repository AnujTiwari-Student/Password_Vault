"use client"

import React, { useState } from 'react';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

interface MasterPassphraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (passphrase: string) => Promise<boolean>;
  title?: string;
  description?: string;
}

export const MasterPassphraseModal: React.FC<MasterPassphraseModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  title = "Enter Master Passphrase",
  description = "Enter your master passphrase to decrypt and view this item"
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passphrase.trim()) {
      toast.error('Master passphrase is required');
      return;
    }

    setLoading(true);
    
    try {
      const isValid = await onVerify(passphrase);
      
      if (isValid) {
        toast.success('Successfully decrypted');
        setPassphrase('');
        onClose();
      } else {
        toast.error('Invalid master passphrase');
      }
    } catch (error: unknown) {
      console.error('Passphrase verification error:', error);
      toast.error('Failed to verify passphrase');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassphrase('');
    setShowPassphrase(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Lock className="w-5 h-5 text-blue-400" />
            </div>
            <DialogTitle className="text-white text-xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Master Passphrase
            </label>
            <div className="relative">
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter your master passphrase"
                className="w-full px-4 py-2.5 pr-12 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-300"
                disabled={loading}
              >
                {showPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !passphrase.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Unlock
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
