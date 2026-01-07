import { LoginSchema } from "@/schema/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { login } from "@/actions/login";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

type AuthFormValues = z.infer<typeof LoginSchema>;

function LoginForm({error: propError}: {error?: string | null}) {
    const router = useRouter();
    const { update } = useSession();
    
    const [showPassword, setShowPassword] = React.useState(false);  
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [isPending, startTransition] = React.useTransition();

    const form = useForm<AuthFormValues>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        }
    })

    const handleSubmit = async (data: AuthFormValues) => {
        try {
            startTransition(async () => {
                setIsLoading(true);
                setError(null);
                setSuccess(null);

                const res = await login(data);

                if (res.success) {
                    if (res.requires2FA === true) {
                        router.push(`/verify-2fa?email=${encodeURIComponent(data.email)}`);
                        toast.success("2FA code sent to your email");
                    } else {
                        setSuccess(res.message || "Login successful!");
                        toast.success(res.message || "Login successful!");
                        await update();
                        router.push("/dashboard");
                    }
                } else {
                    setError(res.errors?._form?.[0] || res.errors?.email?.[0] || res.errors?.password?.[0] || "Login failed. Please try again.");
                }

                setIsLoading(false);
            })
        } catch (error) {
            console.error("Login error:", error);
            setError("An unexpected error occurred. Please try again.");
            setIsLoading(false);
        }
    }

    return (
        <div className='w-full'>
            <Form {...form}>
                <form className='space-y-4' onSubmit={form.handleSubmit(handleSubmit)}>
                    <div className='space-y-4'>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className='text-[#bfbfbf]'>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="email"
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
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <div className='flex items-center justify-between'>
                                        <FormLabel className='text-[#bfbfbf]'>Password</FormLabel>
                                        <span className='text-[13px] font-[600] text-blue-400 hover:underline cursor-pointer'>
                                            <Link href="/auth/reset">Forgot Password?</Link>
                                        </span>
                                    </div>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                {...field}
                                                type={showPassword ? 'text' : 'password'}
                                                className="pr-10 text-white"
                                                disabled={isPending}
                                            />
                                            <div
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-[#bfbfbf]"
                                            >
                                                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormError message={error || propError} />
                    <FormSuccess message={success} />
                    <Button
                        type="submit"
                        size="lg"
                        className={`w-full flex items-center justify-center gap-2 ${!isPending ? 'text-black' : 'text-[#bfbfbf]'}`}
                        variant="outline"
                        disabled={isPending || isLoading}
                    >
                        {isPending || isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
            </Form>
        </div>
    )
}

export default LoginForm
