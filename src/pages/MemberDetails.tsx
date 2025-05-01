import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface Member {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  package?: string
  history?: {
    package: string
    date: string
  }[]
}

export default function MemberDetails() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { id } = useParams()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMember = async () => {
    try {
      const response = await fetch(`/api/members/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch member details')
      }
      const data = await response.json()
      setMember(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load member details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMember()
  }, [id, toast])

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
    return <div>Loading...</div>
  }

  if (!member) {
    return <div>Member not found</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button size="sm" onClick={() => navigate(`/members/${member.id}/edit`)}>
            Edit Member
          </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
          <CardDescription className="text-xs">Member's personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{member.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{member.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{member.phone || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium">{member.address || '-'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membership Details</CardTitle>
          <CardDescription className="text-xs">Current membership status and history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Package</p>
                <p className="text-xs text-muted-foreground">{member.package || 'No active package'}</p>
              </div>
              <Badge variant={member.status === 'ACTIVE' ? 'default' : 'destructive'}>
                {member.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Membership History</p>
              <div className="space-y-2">
                {member.history?.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{entry.package}</span>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 