import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormError } from "../auth/form-error";
import { FormSuccess } from "../auth/form-success";
import { APIResponse } from "@/types/api-responses";
import { toast } from "sonner";
import { OrganizationMember } from "./types";

interface RemoveMemberModalProps {
  showRemoveMemberModal: boolean;
  setShowRemoveMemberModal: (show: boolean) => void;
  selectedMember: OrganizationMember | null;
  setSelectedMember: (member: OrganizationMember | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  success: string | null;
  setSuccess: (success: string | null) => void;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  fetchMembers: () => Promise<void>;
  userId: string;
  currentOrgId: string;
}

export const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({
  showRemoveMemberModal,
  setShowRemoveMemberModal,
  selectedMember,
  setSelectedMember,
  error,
  setError,
  success,
  setSuccess,
  isPending,
  startTransition,
  fetchMembers,
  userId,
  currentOrgId,
}) => {

  const handleRemoveMember = async (): Promise<void> => {
    if (!selectedMember) {
      setError("No member selected");
      return;
    }

    console.log(userId, currentOrgId);

    startTransition(async () => {
      try {
        setError(null);
        setSuccess(null);

        const url = `/api/members?id=${selectedMember.id}&org_id=${selectedMember.org_id}`;
        console.log("DELETE URL:", url);
        console.log("Membership ID:", selectedMember.id);
        console.log("Organization ID:", selectedMember.org_id);

        const response = await axios.delete<APIResponse>(url);

        if (response.data.success) {
          const orgName = selectedMember.org?.name || '';
          const successMsg = orgName 
            ? `Member removed from ${orgName} successfully!`
            : "Member removed successfully!";
          
          console.log("Member removed successfully");
          setSuccess(successMsg);
          toast.success(successMsg);
          
          await fetchMembers();
          
          setTimeout(() => {
            setShowRemoveMemberModal(false);
            setSelectedMember(null);
            setSuccess(null);
          }, 1000);
        } else {
          const errorMessage =
            response.data.errors?._form?.[0] || "Failed to remove member";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } catch (error: unknown) {
        let errorMessage = "Failed to remove member. Please try again.";
        if (
          axios.isAxiosError(error) &&
          error.response?.data?.errors?._form?.[0]
        ) {
          errorMessage = error.response.data.errors._form[0];
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        console.error("Remove member error:", error);
        setError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  const handleClose = () => {
    setShowRemoveMemberModal(false);
    setSelectedMember(null);
    setError(null);
    setSuccess(null);
  };

  const orgName = selectedMember?.org?.name || '';
  const memberName = selectedMember?.user?.name || "this member";

  return (
    <Dialog
      open={showRemoveMemberModal}
      onOpenChange={handleClose}
    >
      <DialogContent className="sm:max-w-md bg-white border-gray-200 shadow-xl p-0 overflow-hidden gap-0 rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-xl border border-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Remove Member
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                Revoke access to the organization.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {selectedMember && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <div className="mt-0.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-red-900">
                  Remove {memberName}?
                </p>
                <p className="text-xs text-red-700 leading-relaxed">
                  Are you sure you want to remove this user from <span className="font-semibold">{orgName || 'the organization'}</span>? 
                  They will immediately lose access to all vaults and resources.
                </p>
              </div>
            </div>
          )}

          <FormError message={error} />
          <FormSuccess message={success} />

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRemoveMember}
              className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
              disabled={isPending || !selectedMember}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removing...
                </div>
              ) : (
                "Remove Member"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};