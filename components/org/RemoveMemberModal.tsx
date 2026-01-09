import React from "react";
import { AlertTriangle } from "lucide-react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
}) => {
  const handleRemoveMember = async (): Promise<void> => {
    if (!selectedMember) return;

    startTransition(async () => {
      try {
        setError(null);
        setSuccess(null);

        const url = `/api/members?id=${selectedMember.id}`;
        console.log("DELETE URL:", url);
        console.log("Member ID:", selectedMember.id);

        const response = await axios.delete<APIResponse>(url);

        if (response.data.success) {
          setSuccess("Member removed from organization successfully!");
          toast.success("Member removed successfully!");
          await fetchMembers();
          setShowRemoveMemberModal(false);
          setSelectedMember(null);
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
        setError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  return (
    <Dialog
      open={showRemoveMemberModal}
      onOpenChange={setShowRemoveMemberModal}
    >
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Remove Member
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {selectedMember && (
            <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
              <p className="text-sm font-semibold text-white mb-2">
                Are you sure you want to remove{" "}
                {selectedMember.user?.name || "this member"} from the
                organization?
              </p>
              <p className="text-xs text-red-300">
                This action cannot be undone. They will lose access to all
                organization resources.
              </p>
            </div>
          )}

          <FormError message={error} />
          <FormSuccess message={success} />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveMemberModal(false);
                setSelectedMember(null);
                setError(null);
                setSuccess(null);
              }}
              className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRemoveMember}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isPending}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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