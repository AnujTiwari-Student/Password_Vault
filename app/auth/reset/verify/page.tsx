"use client"

import { useFormState } from "react-dom"
import { verifyOtp } from "@/actions/verify-otp"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"

export default function VerifyOtpPage() {
  const [state, formAction] = useFormState(verifyOtp, undefined)
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

  const otpValue = otpInputs.join('')

  useEffect(() => {
    if (otpValue.length === 6) {
      const input = document.querySelector('input[name="otp"]') as HTMLInputElement
      input.value = otpValue
      input.form?.requestSubmit()
    }
  }, [otpValue])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center p-4">
      <Dialog open={true}>
        <DialogContent className="sm:max-w-md bg-gray-800/95 backdrop-blur-xl border-gray-700/50 p-0 max-w-sm mx-auto">
          <Card className="w-full border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20">
              <div className="flex items-center justify-center gap-2 mb-4">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Secure Verification</Badge>
              </div>
              <DialogTitle className="text-2xl text-white text-center">Enter Verification Code</DialogTitle>
              <DialogDescription className="text-gray-400 text-center">
                We sent a 6-digit code to your email
              </DialogDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {state?.error && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4">
                  <p className="text-red-300 text-sm font-medium">{state.error}</p>
                </div>
              )}
              
              <form action={formAction} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-white font-medium">Verification Code</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {otpInputs.map((value, index) => (
                      <Input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        value={value}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        className="h-14 text-xl font-mono text-center bg-gray-750 border-gray-600 focus:border-blue-500 focus:ring-blue-500/50 text-white tracking-wider rounded-lg"
                      />
                    ))}
                  </div>
                  <input type="hidden" name="otp" />
                </div>
                
                <div className="space-y-2 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                    {timeLeft === 0 && <span className="text-red-400">Expired</span>}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium h-12 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={timeLeft === 0}
                >
                  Verify Code
                </Button>
              </form>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  )
}
