import React from "react";
import { Crown, Loader2, ShieldCheck } from "lucide-react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

  const handleClose = () => {
    setShowRoleModal(false);
    setSelectedMember(null);
    setNewRole("");
    setError(null);
    setSuccess(null);
  };

  return (
    <Dialog open={showRoleModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-gray-200 shadow-xl p-0 overflow-hidden gap-0 rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Change Member Role
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                Update access permissions for this user.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {selectedMember && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-900">
                  {selectedMember.user?.name || "Unknown User"}
                </p>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-200 text-gray-600 uppercase tracking-wide">
                  Current: {selectedMember.role}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {selectedMember.user?.email || "No email"}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Select New Role
            </label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="h-11 bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl shadow-sm transition-all">
                <SelectValue placeholder="Select role permission" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-xl rounded-xl">
                <SelectItem
                  value="admin"
                  className="text-gray-900 hover:bg-gray-50 cursor-pointer py-2.5 rounded-lg mb-1"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium flex items-center gap-2">
                      Admin
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                    </span>
                    <span className="text-[10px] text-gray-500">Full management access</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="member"
                  className="text-gray-900 hover:bg-gray-50 cursor-pointer py-2.5 rounded-lg mb-1"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Member</span>
                    <span className="text-[10px] text-gray-500">Standard resource access</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="viewer"
                  className="text-gray-900 hover:bg-gray-50 cursor-pointer py-2.5 rounded-lg"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Viewer</span>
                    <span className="text-[10px] text-gray-500">Read-only permissions</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              onClick={handleRoleChange}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
              disabled={isPending || !newRole}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
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