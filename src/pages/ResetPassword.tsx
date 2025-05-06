import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { VerificationCodeInput } from '@/components/ui/verification-code-input'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'

type Step = 'email' | 'code' | 'password' | 'success'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<Step>(searchParams.get('email') ? 'code' : 'email')
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const navigate = useNavigate()

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [resendCooldown])

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset code')
      }

      toast.success('If an account exists with this email, you will receive a reset code')
      setStep('code')
      setResendCooldown(60) // 60 seconds cooldown
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset code')
      }

      toast.success('A new code has been sent to your email')
      setResendCooldown(60) // Reset cooldown
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/verify-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid or expired code')
      }

      setStep('password')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          token: code,
          password: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setStep('success')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 h-full flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="p-3">
          <CardTitle className="text-base">
            {step === 'email' && 'Reset Password'}
            {step === 'code' && 'Enter Verification Code'}
            {step === 'password' && 'Set New Password'}
            {step === 'success' && 'Password Reset Successful'}
          </CardTitle>
          <CardDescription className="text-xs">
            {step === 'email' && 'Enter your email address to receive a reset code'}
            {step === 'code' && `Enter the 6-digit code sent to ${email}`}
            {step === 'password' && 'Please enter your new password'}
            {step === 'success' && 'Your password has been successfully reset'}
          </CardDescription>
        </CardHeader>

        {step === 'email' && (
          <form onSubmit={handleSendCode}>
            <CardContent className="p-3">
              <div className="grid w-full items-center gap-3">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="email" className="text-sm">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-3 flex flex-col gap-3">
              <Button type="submit" className="w-full text-sm" disabled={loading}>
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full text-sm"
              >
                Back to Login
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode}>
            <CardContent className="p-3">
              <div className="grid w-full items-center gap-3">
                <div className="flex flex-col space-y-1.5">
                  <Label className="text-sm">Verification Code</Label>
                  <VerificationCodeInput
                    onChange={setCode}
                    className="justify-center"
                  />
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResendCode}
                    disabled={loading || resendCooldown > 0}
                    className="w-full mt-2 text-xs"
                  >
                    {loading
                      ? 'Sending Code...'
                      : resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : 'Resend Code'}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-3 flex flex-col gap-3">
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('email')}
                  className="flex-1 text-sm"
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1 text-sm" disabled={loading || code.length !== 6}>
                  {loading ? 'Verifying...' : 'Verify Code'}
                </Button>
              </div>
            </CardFooter>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleResetPassword}>
            <CardContent className="p-3">
              <div className="grid w-full items-center gap-3">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="newPassword" className="text-sm">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="text-sm"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-3 flex flex-col gap-3">
              <Button type="submit" className="w-full text-sm" disabled={loading}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 'success' && (
          <CardFooter className="p-3 flex flex-col gap-3">
            <Button onClick={() => navigate('/login')} className="w-full text-sm">
              Back to Login
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
} 