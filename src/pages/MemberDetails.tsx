import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

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
  payments: {
    id: string
    amount: number
    date: string
    status: string
  }[]
}

export function MemberDetails() {
  const { id } = useParams<{ id: string }>()
  const { getAccessToken, user } = useAuth()
  const navigate = useNavigate()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMember = async () => {
      const token = getAccessToken()
      if (!token) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/members/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch member details')
        }

        const data = await response.json()
        setMember(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchMember()
  }, [id, getAccessToken])

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
            {canManageMember && (
              <Button asChild>
                <Link to={`/members/${id}/edit`}>Edit Member</Link>
              </Button>
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
                  <dd>
                    <Badge className={getStatusColor(member.status)}>
                      {member.status}
                    </Badge>
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

          <div>
            <h2 className="text-lg font-semibold mb-4">Payment History</h2>
            {member.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {member.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={
                              payment.status === 'PAID'
                                ? 'bg-green-500'
                                : payment.status === 'PENDING'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }
                          >
                            {payment.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No payment history available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 