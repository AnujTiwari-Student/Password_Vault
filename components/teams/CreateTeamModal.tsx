import React, { useState } from 'react';
import { Users } from 'lucide-react';
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
      <DialogContent className="sm:max-w-md bg-gray-900/95 border-gray-700/50 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-gray-400" />
            Create New Team
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#bfbfbf]">Team Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Banking Team, Dev Team"
                        className="text-white bg-gray-800/50 border-gray-700/50 focus:border-gray-600"
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
                    <FormLabel className="text-[#bfbfbf]">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Brief description of this team's purpose"
                        className="text-white bg-gray-800/50 border-gray-700/50 focus:border-gray-600 resize-none"
                        rows={3}
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
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Create Team
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
