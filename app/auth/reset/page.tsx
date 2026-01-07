"use client"

import { useFormState } from "react-dom"
import { sendOtp } from "@/actions/send-otp"
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
import Link from "next/link"
import { Mail } from "lucide-react"

export default function ResetRequestPage() {
  const [state, formAction] = useFormState(sendOtp, undefined)

  return (
    <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800/80 backdrop-blur-lg border-gray-700/50 shadow-2xl">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/30">
            <Mail className="w-8 h-8 text-blue-400" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Reset Password
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter your email to receive a verification code
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
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                className="bg-gray-750 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/50"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-none text-white font-medium h-11 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Send Verification Code
            </Button>
          </form>
          <div className="text-center pt-6 border-t border-gray-700/50">
            <p className="text-sm text-gray-400">
              Back to <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
