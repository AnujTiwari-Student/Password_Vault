"use client";

import { CreateOrgSchema } from "@/schema/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";
import { useSession } from "next-auth/react";
import { Eye, EyeOff, Building2, FileText, KeyRound, Loader2 } from "lucide-react";
import { 
  generateRandomBytes, 
  bufferToBase64, 
  encryptWithRSA
} from "@/utils/client-crypto";
import axios from "axios";

const CreateOrgWithPassphraseSchema = CreateOrgSchema.extend({
  masterPassphrase: z.string().min(1, "Master passphrase is required"),
});

type CreateOrgFormValues = z.infer<typeof CreateOrgWithPassphraseSchema>;

interface CreateOrgFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

function CreateOrgForm({ onSuccess, onClose }: CreateOrgFormProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [showPassphrase, setShowPassphrase] = React.useState(false);

  const form = useForm<CreateOrgFormValues>({
    resolver: zodResolver(CreateOrgWithPassphraseSchema),
    defaultValues: {
      name: "",
      description: "",
      masterPassphrase: "",
    }
  });

  const handleSubmit = async (data: CreateOrgFormValues) => {
    if (!user?.public_key) {
      setError("User public key not found. Please complete setup first.");
      return;
    }

    try {
      startTransition(async () => {
        setError(null);
        setSuccess(null);

        const ovkRaw = generateRandomBytes(32);
        const ovkRawBase64 = bufferToBase64(ovkRaw);
        
        const ovkWrappedForUser = await encryptWithRSA(ovkRawBase64, user.public_key as string);

        const response = await axios.post('/api/orgs/data', {
          name: data.name,
          description: data.description,
          ovk_raw: ovkRawBase64,
          ovk_wrapped_for_user: ovkWrappedForUser,
          public_key: user.public_key
        });

        if (response.data.success) {
          setSuccess("Organization created successfully!");
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1000);
        } else {
          setError(response.data.error || "Failed to create organization");
        }
      });
    } catch (error: unknown) {
      console.error("Create organization error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className='w-full'>
      <Form {...form}>
        <form className='space-y-5' onSubmit={form.handleSubmit(handleSubmit)}>
          <div className='space-y-5'>
            {/* Organization Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    Organization Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="e.g. Acme Corp, Engineering Team"
                      className="h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-xs font-medium" />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    Description (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Brief description of your organization..."
                      className="min-h-20 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl resize-none"
                      rows={3}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-xs font-medium" />
                </FormItem>
              )}
            />

            {/* Master Passphrase */}
            <FormField
              control={form.control}
              name="masterPassphrase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                    <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                    Master Passphrase
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Input
                        {...field}
                        type={showPassphrase ? 'text' : 'password'}
                        placeholder="Enter your master passphrase to encrypt the org vault"
                        className="h-11 pr-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl"
                        disabled={isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassphrase(!showPassphrase)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isPending}
                      >
                        {showPassphrase ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500 text-xs font-medium" />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-2 space-y-3">
            <FormError message={error} />
            <FormSuccess message={success} />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100 mt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 h-11 rounded-xl transition-all font-medium"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-xl shadow-sm hover:shadow-md transition-all font-medium disabled:opacity-70"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default CreateOrgForm;