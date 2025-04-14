import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api'

interface MemberDetailProps {
  member: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    status: string
  }
}

export function MemberDetail({ member }: MemberDetailProps) {
  const [verificationCode, setVerificationCode] = useState('')
  const { toast } = useToast()

  const handleVerifyEmail = async () => {
    try {
      await api.post(`/members/${member.id}/verify-email`, { code: verificationCode })
      toast({
        title: 'Success',
        description: 'Email verified successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid verification code',
        variant: 'destructive',
      })
    }
  }

  const handleSendInvite = async () => {
    try {
      await api.post(`/members/${member.id}/send-invite`)
      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{member.name}</h2>
        <p className="text-gray-500">{member.email}</p>
        <p className="text-sm">
          Email Status: {member.emailVerified ? 'Verified' : 'Not Verified'}
        </p>
        <p className="text-sm">
          Status: {member.status}
        </p>
      </div>

      {!member.emailVerified && (
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Enter 6-digit verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
          />
          <Button onClick={handleVerifyEmail}>Verify Email</Button>
        </div>
      )}

      {member.status === 'PENDING' && (
        <Button onClick={handleSendInvite}>
          Send Invite
        </Button>
      )}
    </div>
  )
} 