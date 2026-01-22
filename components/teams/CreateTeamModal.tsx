import React, { useState } from 'react';
import { Users, Loader2, Plus } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from 'axios';
import { Team } from '@/types/team';
import { CreateTeamSchema } from "@/schema/zod-schema";
import { APIResponse, CreateTeamResponse } from '@/types/api-responses';
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormError } from '../auth/form-error';
import { FormSuccess } from '../auth/form-success';
import { toast } from "sonner";

type CreateTeamFormValues = z.infer<typeof CreateTeamSchema>;

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: (team: Team) => void;
  orgId: string;
  vaultId: string;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onTeamCreated,
  orgId,
  vaultId
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<CreateTeamFormValues>({
    resolver: zodResolver(CreateTeamSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  });

  const handleSubmit = async (data: CreateTeamFormValues): Promise<void> => {
    try {
      startTransition(async () => {
        setError(null);
        setSuccess(null);

        const response = await axios.post<APIResponse<CreateTeamResponse>>('/api/teams', {
          action: 'create_team',
          org_id: orgId,
          vault_id: vaultId,
          name: data.name.trim(),
          description: data.description?.trim() || ""
        });

        if (response.data.success && response.data.data) {
          setSuccess("Team created successfully!");
          toast.success("Team created successfully!");
          onTeamCreated(response.data.data.team);
          form.reset();
          
          setTimeout(() => {
            onClose();
            setSuccess(null);
          }, 1000);
        } else {
          const errorMessage = response.data.errors?._form?.[0] || 'Failed to create team';
          throw new Error(errorMessage);
        }
      });
    } catch (error: unknown) {
      let errorMessage = "Failed to create team. Please try again.";
      
      if (axios.isAxiosError(error) && error.response?.data?.errors?._form?.[0]) {
        errorMessage = error.response.data.errors._form[0];
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error("Create team error:", error);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleClose = (): void => {
    form.reset();
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-gray-200 shadow-xl p-0 overflow-hidden gap-0 rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Create New Team
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                Organize members into a focused group.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Team Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Engineering, Finance, Q1 Project"
                          className="h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl"
                          maxLength={50}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="What is this team responsible for?"
                          className="min-h-[100px] bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl resize-none"
                          maxLength={200}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  disabled={isPending}
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create Team
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