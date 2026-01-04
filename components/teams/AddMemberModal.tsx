import React, { useState } from "react";
import { UserPlus, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { AddMemberSchema } from "@/schema/zod-schema";
import { APIResponse, InviteResponse } from "@/types/api-responses";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";

type AddMemberFormValues = z.infer<typeof AddMemberSchema>;

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
  orgId: string;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onMemberAdded,
  orgId,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<AddMemberFormValues>({
    resolver: zodResolver(AddMemberSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const handleSubmit = async (data: AddMemberFormValues): Promise<void> => {
    let response: Awaited<ReturnType<typeof axios.post>> | null = null;
    let externalError: unknown = null;

    setError(null);
    setSuccess(null);

    try {
      response = await axios.post<APIResponse<InviteResponse>>("/api/invites", {
        org_id: orgId,
        email: data.email.trim(),
        role: data.role,
      });
    } catch (error: unknown) {
      externalError = error;
    }

    startTransition(() => {
      let errorMessage: string | null =
        "Failed to invite member. Please try again.";

      if (externalError) {
        if (axios.isAxiosError(externalError) && externalError.response) {
          const apiResponse = externalError.response
            .data as APIResponse<unknown>;

          if (apiResponse.errors?._form?.[0]) {
            errorMessage = apiResponse.errors._form[0];
          } else {
            errorMessage = `Request failed with status ${externalError.response.status}.`;
          }
        } else if (externalError instanceof Error) {
          errorMessage = externalError.message;
        }

        console.error("Add member error:", externalError);
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // @ts-expect-error Type invalid
      if (response?.data.success && response.data.data) {
        setSuccess("Invitation sent successfully!");
        toast.success("Member invitation sent successfully!");
        onMemberAdded();
        form.reset();

        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 1000);

        // @ts-expect-error Type invalid
      } else if (response?.data.errors?._form?.[0]) {
        // @ts-expect-error Type invalid
        errorMessage = response.data.errors._form[0];
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  const handleClose = (): void => {
    form.reset();
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gray-900/95 border-gray-700/50 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <UserPlus className="w-5 h-5 text-gray-400" />
            Add Member to Organization
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#bfbfbf]">
                      Email Address *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="member@example.com"
                          className="pl-10 text-white bg-gray-800/50 border-gray-700/50 focus:border-gray-600"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#bfbfbf]">Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="text-white bg-gray-800/50 border-gray-700/50 focus:border-gray-600">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem
                          value="member"
                          className="text-white hover:bg-gray-700"
                        >
                          <div className="flex flex-col items-start">
                            <span>Member</span>
                            <span className="text-xs text-gray-400">
                              Can view and use resources
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem
                          value="admin"
                          className="text-white hover:bg-gray-700"
                        >
                          <div className="flex flex-col items-start">
                            <span>Admin</span>
                            <span className="text-xs text-gray-400">
                              Can manage and invite members
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem
                          value="owner"
                          className="text-white hover:bg-gray-700"
                        >
                          <div className="flex flex-col items-start">
                            <span>Owner</span>
                            <span className="text-xs text-gray-400">
                              Can manage and invite members
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem
                          value="viewer"
                          className="text-white hover:bg-gray-700"
                        >
                          <div className="flex flex-col items-start">
                            <span>Viewer</span>
                            <span className="text-xs text-gray-400">
                              Can view and use resources
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
              <p className="text-xs text-gray-400">
                An invitation will be sent to this email address. They will need
                to accept the invitation to join the organization.
              </p>
            </div>

            <FormError message={error} />
            <FormSuccess message={success} />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 bg-gray-700/50 border-gray-600/50 text-white hover:bg-gray-600/50"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gray-600/70 hover:bg-gray-600/90 text-white"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Send Invitation
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
