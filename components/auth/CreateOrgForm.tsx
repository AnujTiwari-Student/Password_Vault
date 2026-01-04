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
import { Eye, EyeOff } from "lucide-react";
import { 
  generateRandomBytes, 
  bufferToBase64, 
  deriveUMKData, 
  wrapKey 
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
        
        const umkData = await deriveUMKData(data.masterPassphrase, user.umk_salt);
        const ovkWrappedForUser = await wrapKey(ovkRawBase64, umkData.umkCryptoKey);

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
        <form className='space-y-4' onSubmit={form.handleSubmit(handleSubmit)}>
          <div className='space-y-4'>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-[#bfbfbf]'>Organization Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Enter organization name"
                      className="text-white"
                      disabled={isPending}
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
                  <FormLabel className='text-[#bfbfbf]'>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Brief description of your organization"
                      className="text-white resize-none"
                      rows={3}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="masterPassphrase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-[#bfbfbf]'>Master Passphrase</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassphrase ? 'text' : 'password'}
                        placeholder="Enter your master passphrase"
                        className="text-white pr-10"
                        disabled={isPending}
                      />
                      <div
                        onClick={() => setShowPassphrase(!showPassphrase)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-[#bfbfbf] hover:text-white"
                      >
                        {showPassphrase ? <EyeOff size={20} /> : <Eye size={20} />}
                      </div>
                    </div>
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
              className="flex-1 bg-blue-500 hover:bg-gray-600 hover:text-white"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 bg-blue-500 hover:bg-gray-600 hover:text-white`}
              disabled={isPending}
            >
              {isPending ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default CreateOrgForm;
