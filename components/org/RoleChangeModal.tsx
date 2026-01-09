import React from "react";
import { Crown } from "lucide-react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormError } from "../auth/form-error";
import { FormSuccess } from "../auth/form-success";
import { APIResponse } from "@/types/api-responses";
import { toast } from "sonner";
import { OrganizationMember } from "./types";

interface RoleChangeModalProps {
  showRoleModal: boolean;
  setShowRoleModal: (show: boolean) => void;
  selectedMember: OrganizationMember | null;
  setSelectedMember: (member: OrganizationMember | null) => void;
  newRole: string;
  setNewRole: (role: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  success: string | null;
  setSuccess: (success: string | null) => void;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  fetchMembers: () => Promise<void>;
}

export const RoleChangeModal: React.FC<RoleChangeModalProps> = ({
  showRoleModal,
  setShowRoleModal,
  selectedMember,
  setSelectedMember,
  newRole,
  setNewRole,
  error,
  setError,
  success,
  setSuccess,
  isPending,
  startTransition,
  fetchMembers,
}) => {
  const handleRoleChange = async (): Promise<void> => {
    if (!selectedMember || !newRole) return;

    startTransition(async () => {
      try {
        setError(null);
        setSuccess(null);

        const response = await axios.patch<APIResponse>(
          `/api/members?id=${selectedMember.id}`,
          {
            role: newRole,
          }
        );

        if (response.data.success) {
          setSuccess(`Role updated to ${newRole} successfully!`);
          toast.success(`Role updated successfully!`);
          await fetchMembers();
          setShowRoleModal(false);
          setSelectedMember(null);
          setNewRole("");
        } else {
          const errorMessage =
            response.data.errors?._form?.[0] || "Failed to update role";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } catch (error: unknown) {
        let errorMessage = "Failed to update role. Please try again.";
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
    <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <Crown className="w-5 h-5 text-yellow-400" />
            Change Member Role
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {selectedMember && (
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-sm font-semibold text-white">
                {selectedMember.user?.name || "Unknown User"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {selectedMember.user?.email || "No email"}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Current role:{" "}
                <span className="text-white font-medium">
                  {selectedMember.role}
                </span>
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              New Role
            </label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-blue-500 text-white">
                <SelectValue placeholder="Select new role" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem
                  value="admin"
                  className="text-white hover:bg-gray-700"
                >
                  Admin - Can manage organization
                </SelectItem>
                <SelectItem
                  value="member"
                  className="text-white hover:bg-gray-700"
                >
                  Member - Can access resources
                </SelectItem>
                <SelectItem
                  value="viewer"
                  className="text-white hover:bg-gray-700"
                >
                  Viewer - Read-only access
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <FormError message={error} />
          <FormSuccess message={success} />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowRoleModal(false);
                setSelectedMember(null);
                setNewRole("");
                setError(null);
                setSuccess(null);
              }}
              className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isPending || !newRole}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Updating...
                </div>
              ) : (
                "Update Role"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};