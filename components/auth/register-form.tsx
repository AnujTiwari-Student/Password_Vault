import { RegisterSchema } from "@/schema/zod-schema";
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
import { register } from "@/actions/register";

type AuthFormValues = z.infer<typeof RegisterSchema>;

function RegisterForm() {

    const router = useRouter();
    
    const [showPassword, setShowPassword] = React.useState(false);  
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [isPending, startTransition] = React.useTransition();

    const form = useForm<AuthFormValues>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        }
    })

    const handleSubmit = async (data: AuthFormValues) => {
        try {
            
            startTransition( async () => {
                setIsLoading(true);
                setError(null);
                setSuccess(null);

                const res = await register(data);

                if (res.success) {
                    setSuccess(res.message || "Registration successful!");
                    router.push("/auth/login");
                } else {
                    setError(res.errors?._form?.[0] || "Registration failed. Please try again.");
                }

                setIsLoading(false);
            })

        } catch (error) {
            console.error("Registration error:", error);
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
                                    </div>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                {...field}
                                                type={showPassword ? 'text' : 'password'}
                                                className="pr-10 text-white"
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
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <div className='flex items-center justify-between'>
                                        <FormLabel className='text-[#bfbfbf]'>Confirm Password</FormLabel>
                                    </div>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                {...field}
                                                type={showPassword ? 'text' : 'password'}
                                                className="pr-10 text-white"
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
                    <FormError message={error} />
                    <FormSuccess message={success} />
                    <Button
                        type="submit"
                        size="lg"
                        className={`w-full flex items-center justify-center gap-2 ${!isPending ? 'text-[#949494]' : 'text-[#bfbfbf]'}`}
                        variant="outline"
                    >
                        {isLoading || isPending ? 'Registering...' : 'Register'}
                    </Button>
                </form>
            </Form>
        </div>
    )
}   

export default RegisterForm;