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

  return (
    <Dialog open={showDeleteTeamModal} onOpenChange={setShowDeleteTeamModal}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Delete Team
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {selectedTeam && (
            <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
              <p className="text-sm font-semibold text-white mb-2">
                Are you sure you want to delete the {selectedTeam.name} team?
              </p>
              <p className="text-xs text-red-300">
                This action cannot be undone. All team members will lose their
                team-specific access.
              </p>
            </div>
          )}

          <FormError message={error} />
          <FormSuccess message={success} />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteTeamModal(false);
                setSelectedTeam(null);
                setError(null);
                setSuccess(null);
              }}
              className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTeam}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isPending}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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