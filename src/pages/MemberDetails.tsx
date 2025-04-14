import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useToast } from '@/hooks/use-toast'

interface Member {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  membershipType: 'REGULAR' | 'PREMIUM' | 'VIP'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  notes?: string
  managedBy?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
  payments?: {
    id: string
    amount: number
    date: string
    status: string
  }[]
  invitationToken?: string
}

export default function MemberDetails() {
  const { toast } = useToast()
  const { id } = useParams()
  const { getAccessToken, user } = useAuth()
  const navigate = useNavigate()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchMember = async () => {
    try {
      const token = getAccessToken()
      if (!token) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/members/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch member')
      }
      const data = await response.json()
      setMember(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch member')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMember()
  }, [id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500'
      case 'INACTIVE':
        return 'bg-gray-500'
      case 'SUSPENDED':
        return 'bg-red-500'
      case 'PENDING':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getMembershipTypeColor = (type: string) => {
    switch (type) {
      case 'REGULAR':
        return 'bg-blue-500'
      case 'PREMIUM':
        return 'bg-purple-500'
      case 'VIP':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const canManageMember = user?.role === 'ADMIN' || 
    (user?.role === 'STAFF' && member?.managedBy?.id === user.id)

  const handleSendInvite = async () => {
    try {
      const response = await fetch(`/api/members/${id}/send-invite`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to send invite')
      }

      toast({
        title: 'Invite sent',
        description: 'An invitation email has been sent to the member.',
      })
      fetchMember() // Refresh member data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invite. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this member?')) return

    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete member')
      }

      toast({
        title: 'Member deleted',
        description: 'The member has been successfully deleted.',
      })
      navigate('/members')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete member. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      toast({
        title: 'Status updated',
        description: `Member status has been updated to ${newStatus.toLowerCase()}.`,
      })
      fetchMember() // Refresh member data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <div className="container mx-auto py-10">Loading...</div>
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-red-500">Member not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Member Details</h1>
          <div className="space-x-4">
            {user?.role === 'ADMIN' && (
              <>
                {member.status === 'PENDING' && (
                  <Button onClick={handleSendInvite}>
                    {member.invitationToken ? 'Resend Invite' : 'Send Invite'}
                  </Button>
                )}
                <Button asChild>
                  <Link to={`/members/${id}/edit`}>Edit Member</Link>
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => navigate('/members')}>
              Back to Members
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Basic Information</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">Name</dt>
                  <dd>{member.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Email</dt>
                  <dd>{member.email}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Phone</dt>
                  <dd>{member.phone || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Address</dt>
                  <dd>{member.address || '-'}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Membership Details</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">Membership Type</dt>
                  <dd>
                    <Badge className={getMembershipTypeColor(member.membershipType)}>
                      {member.membershipType}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd className="flex items-center gap-2">
                    <Badge className={getStatusColor(member.status)}>
                      {member.status}
                    </Badge>
                    {member.status === 'PENDING' && member.invitationToken && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Invite Sent
                      </Badge>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Managed By</dt>
                  <dd>{member.managedBy?.name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Member Since</dt>
                  <dd>{new Date(member.createdAt).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>
          </div>

          {member.notes && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Notes</h2>
              <p className="text-gray-700">{member.notes}</p>
            </div>
          )}

          {member.payments && member.payments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
              <div className="space-y-4">
                {member.payments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">${payment.amount}</p>
                        <p className="text-sm text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={payment.status === 'COMPLETED' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 