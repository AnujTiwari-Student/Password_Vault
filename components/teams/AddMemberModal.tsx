import React, { useState, useEffect } from "react";
import { UserPlus, Mail, Building2, AlertCircle } from "lucide-react";
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
  DialogDescription,
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
import { useCurrentUser } from "@/hooks/useCurrentUser";

// Extended schema to include org selection
const ExtendedAddMemberSchema = z.object({
  org_id: z.string().min(1, "Please select an organization"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["member", "admin", "viewer"]),
});

type ExtendedAddMemberFormValues = z.infer<typeof ExtendedAddMemberSchema>;

interface Organization {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onMemberAdded,
}) => {
  const user = useCurrentUser();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  const form = useForm<ExtendedAddMemberFormValues>({
    resolver: zodResolver(ExtendedAddMemberSchema),
    defaultValues: {
      org_id: "",
      email: "",
      role: "member",
    },
  });

  // Fetch organizations where user is owner or admin
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchOrganizations();
    }
  }, [isOpen, user?.id]);

  const fetchOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const response = await axios.get('/api/orgs/data', {
        params: { userId: user?.id }
      });
      
      if (response.data.success) {
        // Filter only orgs where user is owner or admin
        const adminOrgs = (response.data.data.organizations || []).filter(
          (org: Organization) => org.role === 'owner' || org.role === 'admin'
        );
        setOrganizations(adminOrgs);

        // Auto-select if only one org
        if (adminOrgs.length === 1) {
          form.setValue('org_id', adminOrgs[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleSubmit = async (data: ExtendedAddMemberFormValues): Promise<void> => {
    let response: Awaited<ReturnType<typeof axios.post>> | null = null;
    let externalError: unknown = null;

    setError(null);
    setSuccess(null);

    try {
      console.log("Sending invitation:", {
        org_id: data.org_id,
        email: data.email.trim(),
        role: data.role,
      });

      response = await axios.post<APIResponse<InviteResponse>>("/api/invites", {
        org_id: data.org_id,
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
        const selectedOrg = organizations.find(org => org.id === data.org_id);
        const successMsg = selectedOrg 
          ? `Invitation sent to ${selectedOrg.name} successfully!`
          : "Invitation sent successfully!";
        
        setSuccess(successMsg);
        toast.success(successMsg);
        onMemberAdded();
        form.reset();

        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 1500);

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

  const selectedOrgName = organizations.find(
    org => org.id === form.watch('org_id')
  )?.name;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gray-900/95 border-gray-700/50 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <UserPlus className="w-5 h-5 text-gray-400" />
            Add Member to Organization
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Invite a new member to join your organization
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="space-y-4">
              {/* Organization Selector */}
              <FormField
                control={form.control}
                name="org_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#bfbfbf]">
                      Organization *
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending || loadingOrgs}
                    >
                      <FormControl>
                        <SelectTrigger className="text-white bg-gray-800/50 border-gray-700/50 focus:border-gray-600">
                          {loadingOrgs ? (
                            <span className="text-gray-400">Loading organizations...</span>
                          ) : (
                            <SelectValue placeholder="Select organization" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {organizations.length === 0 ? (
                          <div className="p-2 text-center text-gray-400 text-sm">
                            No organizations found where you are owner/admin
                          </div>
                        ) : (
                          organizations.map((org) => (
                            <SelectItem
                              key={org.id}
                              value={org.id}
                              className="text-white hover:bg-gray-700"
                            >
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-400" />
                                <div className="flex flex-col items-start">
                                  <span>{org.name}</span>
                                  <span className="text-xs text-gray-400 capitalize">
                                    Your role: {org.role}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Input */}
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
                          disabled={isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role Selector */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#bfbfbf]">Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
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
                          value="viewer"
                          className="text-white hover:bg-gray-700"
                        >
                          <div className="flex flex-col items-start">
                            <span>Viewer</span>
                            <span className="text-xs text-gray-400">
                              Can only view resources
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

            {/* Info Box */}
            <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-400">
                  {selectedOrgName ? (
                    <p>
                      An invitation will be sent to join{" "}
                      <strong className="text-white">{selectedOrgName}</strong>.
                      They will need to accept the invitation to join.
                    </p>
                  ) : (
                    <p>
                      Select an organization and enter the members email address
                      to send an invitation.
                    </p>
                  )}
                </div>
              </div>
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
                className="flex-1 bg-blue-600/90 hover:bg-blue-600 text-white"
                disabled={isPending || organizations.length === 0}
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