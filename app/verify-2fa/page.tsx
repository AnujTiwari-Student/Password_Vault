"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/auth/form-error";
import { FormSuccess } from "@/components/auth/form-success";
import { verify2faCode } from "@/actions/verify-2fa";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { ArrowLeft, Shield } from "lucide-react";

export default function Verify2FAPage() {
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const router = useRouter();
    const { update } = useSession();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            setError("Email parameter missing");
            return;
        }

        if (code.length !== 6) {
            setError("Please enter a 6-digit code");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await verify2faCode({ email, code });
            
            if (result.success) {
                setSuccess(result.message || "2FA verified successfully!");
                toast.success("Login successful!");
                await update();
                router.push("/dashboard");
            } else {
                setError(result.error || "Verification failed");
            }
        } catch (error) {
            console.error("2FA verification error:", error);
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 6) {
            setCode(value);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-700 shadow-2xl">
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="bg-blue-600 rounded-full p-3">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                Two-Factor Authentication
                            </h1>
                            <p className="text-gray-400 text-sm sm:text-base">
                                Enter the 6-digit code sent to your email
                            </p>
                            {email && (
                                <p className="text-blue-400 text-sm font-medium bg-gray-900 px-3 py-1 rounded-lg inline-block">
                                    {email}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <Input
                                    type="text"
                                    placeholder="000000"
                                    value={code}
                                    onChange={handleCodeChange}
                                    maxLength={6}
                                    className="w-full text-center text-xl sm:text-2xl tracking-widest font-mono bg-gray-900 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 h-12 sm:h-14"
                                    disabled={isLoading}
                                />
                            </div>
                            
                            <div className="text-center">
                                <p className="text-gray-400 text-xs sm:text-sm">
                                    Did not receive the code?{" "}
                                    <button
                                        type="button"
                                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                        onClick={() => toast.info("Please check your spam folder or try again")}
                                    >
                                        Resend code
                                    </button>
                                </p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <FormError message={error} />
                            <FormSuccess message={success} />
                            
                            <Button 
                                type="submit" 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 h-12 sm:h-14 text-base sm:text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isLoading || code.length !== 6}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Verifying...
                                    </div>
                                ) : (
                                    "Verify Code"
                                )}
                            </Button>
                        </div>
                    </form>
                    
                    <div className="mt-6 pt-6 border-t border-gray-700">
                        <Button
                            variant="ghost"
                            onClick={() => router.push("/login")}
                            className="w-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Button>
                    </div>
                </div>
                
                <div className="text-center space-y-4">
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-600/20 rounded-full p-1 mt-0.5">
                                <Shield className="w-3 h-3 text-blue-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-white text-sm font-medium">Security Notice</h3>
                                <p className="text-gray-400 text-xs mt-1">
                                    This code will expire in 10 minutes for your security. Never share this code with anyone.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
