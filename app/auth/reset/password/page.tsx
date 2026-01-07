"use client"

import { useFormState } from "react-dom"
import { useState } from "react"
import { resetPassword } from "@/actions/resetPassword"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useFormState(resetPassword, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800/80 backdrop-blur-lg border-gray-700/50 shadow-2xl">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 border border-green-500/30">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            New Password
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3">
              <p className="text-red-300 text-sm">{state.error}</p>
            </div>
          )}
          
          {/* ✅ FIXED: Proper form wrapper */}
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#bfbfbf]">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500/50 h-12 pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter new password"
                  required
                  disabled={isPending}
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-[#bfbfbf] hover:text-white transition-colors"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#bfbfbf]">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500/50 h-12 pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Confirm new password"
                  required
                  disabled={isPending}
                />
                <div
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-[#bfbfbf] hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </div>
              </div>
            </div>

            {/* ✅ FIXED: type="submit" button */}
            <Button 
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 border-none text-white font-medium h-12 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:from-gray-700 disabled:to-gray-800 disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Resetting...
                </span>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
          
          <div className="text-center pt-6 border-t border-gray-700/50">
            <Link 
              href="/auth/login" 
              className="text-[13px] font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
            >
              ← Back to Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
