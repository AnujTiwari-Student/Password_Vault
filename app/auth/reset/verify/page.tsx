"use client"

import { useFormState } from "react-dom"
import { verifyOtp } from "@/actions/verify-otp"
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
import { ShieldCheck, Loader2, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function VerifyOtpPage() {
  const [state, formAction, isPending] = useFormState(verifyOtp, undefined)
  const [timeLeft, setTimeLeft] = useState(600)
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', ''])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleOtpChange = (index: number, value: string) => {
    if (/[0-9]/.test(value) || value === '') {
      const newOtp = [...otpInputs]
      newOtp[index] = value
      setOtpInputs(newOtp)
      
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('')
      while (newOtp.length < 6) newOtp.push('')
      setOtpInputs(newOtp)
      document.getElementById(`otp-${Math.min(pastedData.length, 5)}`)?.focus()
    }
  }

  const otpValue = otpInputs.join('')
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800/80 backdrop-blur-lg border-gray-700/50 shadow-2xl">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/30">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter the 6-digit code sent to your email
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
              <Label htmlFor="otp-0" className="text-[#bfbfbf]">
                Verification Code
              </Label>
              <div className="grid grid-cols-6 gap-2" onPaste={handlePaste}>
                {otpInputs.map((value, index) => (
                  <Input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isPending}
                    className="h-14 w-full text-2xl font-mono font-bold text-center bg-gray-900/50 border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-blue-500/50 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
              <input type="hidden" name="otp" value={otpValue} />
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 bg-gray-900/30 rounded-lg p-3 border border-gray-700/30">
              <Clock className="w-4 h-4" />
              <span className="font-mono">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </span>
              {timeLeft === 0 && (
                <span className="text-red-400 font-semibold ml-2">Code Expired</span>
              )}
            </div>

            {/* ✅ FIXED: type="submit" button */}
            <Button 
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-none text-white font-medium h-12 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:from-gray-700 disabled:to-gray-800 disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
              disabled={timeLeft === 0 || otpValue.length !== 6 || isPending}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify Code'
              )}
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm text-gray-400">
                Didn not receive the code?{' '}
                <button 
                  type="button"
                  onClick={() => window.location.href = '/auth/reset'}
                  className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                  disabled={timeLeft > 0 || isPending}
                >
                  Resend
                </button>
              </p>
            </div>
          </form>
          
          <div className="text-center pt-6 border-t border-gray-700/50">
            <Link 
              href="/auth/login" 
              className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
            >
              ← Back to Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
