"use client"

import React, { useState } from 'react';
import { Lock, Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';
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
  title = "Authentication Required",
  description = "Please enter your master passphrase to decrypt and view this secured item."
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
        toast.success('Access granted');
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
      <DialogContent className="bg-white border border-gray-200 shadow-2xl sm:max-w-md sm:rounded-2xl p-0 overflow-hidden gap-0">
        
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-100">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 shrink-0">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-1 mt-1">
                <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 leading-relaxed">
                  {description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                Master Passphrase
              </label>
              <div className="relative group">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter your secret passphrase..."
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 shadow-sm"
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
                  disabled={loading}
                  tabIndex={-1}
                >
                  {showPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !passphrase.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Unlock Item
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};