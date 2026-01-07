"use client"

import { useFormState } from "react-dom"
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
import { Shield } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [state, formAction] = useFormState(resetPassword, undefined)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center p-4">
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
          
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                className="bg-gray-750 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/50 h-12"
                placeholder="Enter new password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="bg-gray-750 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/50 h-12"
                placeholder="Confirm new password"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 border-none text-white font-medium h-12 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Set New Password
            </Button>
          </form>
          
          <div className="text-center pt-6 border-t border-gray-700/50">
            <Link href="/auth/login" className="text-sm text-gray-400 hover:text-blue-400">
              ← Back to Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
