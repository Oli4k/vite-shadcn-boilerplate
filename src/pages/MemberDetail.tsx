import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
}

export function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const { getAccessToken } = useAuth()
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
          throw new Error('Failed to fetch member')
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Member Details</h1>
        <Button asChild>
          <a href="/members">Back to Members</a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{member.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h3 className="font-semibold">Email</h3>
              <p>{member.email}</p>
            </div>
            <div>
              <h3 className="font-semibold">Phone</h3>
              <p>{member.phone || '-'}</p>
            </div>
            <div>
              <h3 className="font-semibold">Address</h3>
              <p>{member.address || '-'}</p>
            </div>
            <div>
              <h3 className="font-semibold">Membership Type</h3>
              <Badge className={getMembershipTypeColor(member.membershipType)}>
                {member.membershipType}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold">Status</h3>
              <Badge className={getStatusColor(member.status)}>
                {member.status}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold">Managed By</h3>
              <p>{member.managedBy?.name || '-'}</p>
            </div>
            <div>
              <h3 className="font-semibold">Created At</h3>
              <p>{new Date(member.createdAt).toLocaleDateString()}</p>
            </div>
            {member.notes && (
              <div>
                <h3 className="font-semibold">Notes</h3>
                <p>{member.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 