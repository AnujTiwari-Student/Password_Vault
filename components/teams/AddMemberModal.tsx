import React, { useState, useEffect } from "react";
import { UserPlus, Mail, Building2, AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
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

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchOrganizations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <DialogContent className="sm:max-w-md bg-white border-gray-200 shadow-xl p-0 overflow-hidden gap-0 rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Add New Member
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                Invite someone to collaborate in your organization.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              <div className="space-y-4">
                {/* Organization Selector */}
                <FormField
                  control={form.control}
                  name="org_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Organization <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isPending || loadingOrgs}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl">
                            {loadingOrgs ? (
                              <span className="text-gray-400 flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Loading...
                              </span>
                            ) : (
                              <SelectValue placeholder="Select organization" />
                            )}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-gray-200 shadow-lg rounded-xl">
                          {organizations.length === 0 ? (
                            <div className="p-3 text-center text-gray-500 text-sm">
                              No organizations found where you are owner/admin
                            </div>
                          ) : (
                            organizations.map((org) => (
                              <SelectItem
                                key={org.id}
                                value={org.id}
                                className="text-gray-900 hover:bg-gray-50 cursor-pointer py-2.5"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-blue-50 rounded-lg">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium text-sm">{org.name}</span>
                                    <span className="text-[10px] text-gray-500 capitalize">
                                      Role: {org.role}
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
                      <FormLabel className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Email Address <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="colleague@company.com"
                            className="h-11 pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl"
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
                      <FormLabel className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Role Permission
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-gray-200 shadow-lg rounded-xl p-1">
                          <SelectItem
                            value="member"
                            className="text-gray-900 hover:bg-gray-50 cursor-pointer rounded-lg mb-1"
                          >
                            <div className="flex flex-col items-start py-1">
                              <span className="font-medium text-sm">Member</span>
                              <span className="text-[10px] text-gray-500">
                                Can view and use resources
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem
                            value="admin"
                            className="text-gray-900 hover:bg-gray-50 cursor-pointer rounded-lg mb-1"
                          >
                            <div className="flex flex-col items-start py-1">
                              <span className="font-medium text-sm">Admin</span>
                              <span className="text-[10px] text-gray-500">
                                Can manage and invite members
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem
                            value="viewer"
                            className="text-gray-900 hover:bg-gray-50 cursor-pointer rounded-lg"
                          >
                            <div className="flex flex-col items-start py-1">
                              <span className="font-medium text-sm">Viewer</span>
                              <span className="text-[10px] text-gray-500">
                                Read-only access to resources
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
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700 leading-relaxed">
                  {selectedOrgName ? (
                    <p>
                      Invitation will be sent to join <strong className="font-semibold">{selectedOrgName}</strong>. 
                      They will receive an email to accept the invitation.
                    </p>
                  ) : (
                    <p>
                      Select an organization first to see where the invitation will be sent.
                    </p>
                  )}
                </div>
              </div>

              <FormError message={error} />
              <FormSuccess message={success} />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-11 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium"
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
                  disabled={isPending || organizations.length === 0}
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
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
        </div>
      </DialogContent>
    </Dialog>
  );
};