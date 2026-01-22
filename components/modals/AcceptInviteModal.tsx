"use client";

import React, { useState } from 'react';
import { Key, Building2, Crown, Shield, Users, Check, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from '../auth/form-error';
import { FormSuccess } from '../auth/form-success';
import { toast } from "sonner";
import { 
  deriveUMKData, 
  encryptWithRSA 
} from '@/utils/client-crypto';

interface Invitation {
  id: string;
  org_id: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'pending';
  expires_at: string;
  invited_by: string;
  created_at: string;
  org: {
    id: string;
    name: string;
    owner_user_id: string;
  };
  invitedBy: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface AcceptInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: Invitation | null;
  onAccepted: () => void;
}

export const AcceptInviteModal: React.FC<AcceptInviteModalProps> = ({
  isOpen,
  onClose,
  invitation,
  onAccepted
}) => {
  const [masterPassphrase, setMasterPassphrase] = useState<string>('');
  const [accepting, setAccepting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAccept = async (): Promise<void> => {
    if (!invitation || !masterPassphrase.trim()) return;

    const words = masterPassphrase.trim().split(/\s+/);
    if (words.length !== 24) {
      setError('Master passphrase must be exactly 24 words');
      return;
    }

    try {
      setAccepting(true);
      setError(null);
      setSuccess(null);

      const saltResponse = await axios.get('/api/user/umk-salt');
      const { umk_salt, public_key } = saltResponse.data;

      if (!umk_salt || !public_key) {
        throw new Error('User crypto data not found. Please complete your account setup.');
      }

      const { master_passphrase_verifier } = await deriveUMKData(
        masterPassphrase.trim(),
        umk_salt
      );

      const verifyResponse = await axios.post('/api/user/verify-passphrase', {
        master_passphrase_verifier
      });

      if (!verifyResponse.data.success) {
        setError('Invalid master passphrase. Please check your 24-word phrase.');
        return;
      }

      const ovkResponse = await axios.get(`/api/orgs/${invitation.org_id}/raw-ovk`);
      const { raw_ovk } = ovkResponse.data;

      if (!raw_ovk) {
        throw new Error('Organization vault key not found');
      }

      const wrappedOVK = await encryptWithRSA(raw_ovk, public_key);

      const response = await axios.post('/api/invites/accept', {
        invitation_id: invitation.id,
        ovk_wrapped_for_user: wrappedOVK
      });

      if (response.data.success) {
        setSuccess('Invitation accepted successfully!');
        toast.success(`Welcome to ${invitation.org.name}!`);
        
        setTimeout(() => {
          onAccepted();
          handleClose();
          window.location.reload();
        }, 2000);
      } else {
        const errorMessage = response.data.errors?._form?.[0] || 'Failed to accept invitation';
        setError(errorMessage);
      }
    } catch (error) {
      let errorMessage = "Failed to accept invitation. Please try again.";
      if (axios.isAxiosError(error) && error.response?.data?.errors?._form?.[0]) {
        errorMessage = error.response.data.errors._form[0];
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async (): Promise<void> => {
    if (!invitation) return;

    try {
      const response = await axios.post('/api/invites/reject', {
        invitation_id: invitation.id
      });

      if (response.data.success) {
        toast.success('Invitation rejected');
        onAccepted(); 
        handleClose();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to reject invitation');
    }
  };

  const handleClose = (): void => {
    setMasterPassphrase('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return Crown;
      case 'admin':
        return Shield;
      default:
        return Users;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-50 text-amber-700 border-amber-200 border';
      case 'admin':
        return 'bg-blue-50 text-blue-700 border-blue-200 border';
      case 'member':
        return 'bg-gray-100 text-gray-700 border-gray-200 border';
      case 'viewer':
        return 'bg-purple-50 text-purple-700 border-purple-200 border';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200 border';
    }
  };

  if (!invitation) return null;

  const RoleIcon = getRoleIcon(invitation.role);
  const wordCount = masterPassphrase.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md sm:max-w-lg bg-white border border-gray-200 shadow-xl p-0 gap-0 overflow-hidden sm:rounded-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-gray-900">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              Accept Invitation
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          
          {/* Invitation Card */}
          <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 space-y-1">
                <h3 className="font-bold text-lg text-gray-900 leading-tight">
                  {invitation.org.name}
                </h3>
                <p className="text-sm text-gray-500">
                  Invited by <span className="font-semibold text-gray-700">{invitation.invitedBy.name}</span>
                </p>
              </div>
              
              <div className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide self-start
                ${getRoleBadgeColor(invitation.role)}
              `}>
                <RoleIcon className="w-3.5 h-3.5" />
                {invitation.role}
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <span>Organization Invite</span>
              <span>Expires {new Date(invitation.expires_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Role Permissions */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <p className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Access & Permissions
            </p>
            <ul className="space-y-1.5">
              {invitation.role === 'owner' && (
                <>
                  <li className="text-xs text-blue-700 flex items-start gap-2">• Full control over the organization</li>
                  <li className="text-xs text-blue-700 flex items-start gap-2">• Manage all members and settings</li>
                </>
              )}
              {invitation.role === 'admin' && (
                <>
                  <li className="text-xs text-blue-700 flex items-start gap-2">• Manage organization members and teams</li>
                  <li className="text-xs text-blue-700 flex items-start gap-2">• Access all organizational resources</li>
                </>
              )}
              {invitation.role === 'member' && (
                <>
                  <li className="text-xs text-blue-700 flex items-start gap-2">• Access assigned organizational resources</li>
                  <li className="text-xs text-blue-700 flex items-start gap-2">• Collaborate with team members</li>
                </>
              )}
              {invitation.role === 'viewer' && (
                <>
                  <li className="text-xs text-blue-700 flex items-start gap-2">• View organizational resources</li>
                  <li className="text-xs text-blue-700 flex items-start gap-2">• Read-only access to shared content</li>
                </>
              )}
            </ul>
          </div>

          {/* Passphrase Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Key className="w-4 h-4 text-gray-400" />
                Master Passphrase
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                wordCount === 24 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : wordCount > 0 
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {wordCount}/24 words
              </span>
            </div>
            
            <Textarea
              value={masterPassphrase}
              onChange={(e) => setMasterPassphrase(e.target.value)}
              placeholder="Enter your 24-word master passphrase to verify identity..."
              className="min-h-25 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl resize-none font-mono text-sm shadow-sm transition-all"
              disabled={accepting}
            />
            
            <p className="text-xs text-gray-500 flex items-start gap-1.5 pl-1">
              <AlertCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
              Required to securely unwrap the organization vault key.
            </p>
          </div>

          <FormError message={error} />
          <FormSuccess message={success} />
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col-reverse sm:flex-row gap-3">
          <Button
            onClick={handleReject}
            variant="outline"
            className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 h-11 rounded-xl"
            disabled={accepting}
          >
            <X className="w-4 h-4 mr-2" />
            Reject Invite
          </Button>
          <Button
            onClick={handleAccept}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent h-11 rounded-xl shadow-sm hover:shadow-md transition-all"
            disabled={wordCount !== 24 || accepting}
          >
            {accepting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 font-semibold">
                <Check className="w-4 h-4" />
                Accept & Join
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};