import React from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
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
import { TeamWithMembers } from "./types";

interface DeleteTeamModalProps {
  showDeleteTeamModal: boolean;
  setShowDeleteTeamModal: (show: boolean) => void;
  selectedTeam: TeamWithMembers | null;
  setSelectedTeam: (team: TeamWithMembers | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  success: string | null;
  setSuccess: (success: string | null) => void;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  fetchTeams: () => Promise<void>;
}

export const DeleteTeamModal: React.FC<DeleteTeamModalProps> = ({
  showDeleteTeamModal,
  setShowDeleteTeamModal,
  selectedTeam,
  setSelectedTeam,
  error,
  setError,
  success,
  setSuccess,
  isPending,
  startTransition,
  fetchTeams,
}) => {
  const handleDeleteTeam = async (): Promise<void> => {
    if (!selectedTeam) return;

    startTransition(async () => {
      try {
        setError(null);
        setSuccess(null);

        const response = await axios.delete<APIResponse>(
          `/api/teams/${selectedTeam.id}`
        );

        if (response.data.success) {
          setSuccess("Team deleted successfully!");
          toast.success("Team deleted successfully!");
          await fetchTeams();
          setShowDeleteTeamModal(false);
          setSelectedTeam(null);
        } else {
          const errorMessage =
            response.data.errors?._form?.[0] || "Failed to delete team";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } catch (error: unknown) {
        let errorMessage = "Failed to delete team. Please try again.";
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

  const handleClose = () => {
    setShowDeleteTeamModal(false);
    setSelectedTeam(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <Dialog open={showDeleteTeamModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-gray-200 shadow-xl p-0 overflow-hidden gap-0 rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-xl border border-red-100">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Delete Team
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {selectedTeam && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900 mb-1">
                  Are you sure you want to delete &quot;{selectedTeam.name}&quot;?
                </p>
                <p className="text-xs text-red-700 leading-relaxed">
                  All members will be removed from this team, and any team-specific access policies will be permanently lost.
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
              onClick={handleDeleteTeam}
              className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
              disabled={isPending}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </div>
              ) : (
                "Delete Team"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};