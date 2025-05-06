import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'

interface Member {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  membershipType: 'REGULAR' | 'PREMIUM' | 'VIP'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  notes: string | null
  managedBy: {
    id: string
    name: string | null
  } | null
}

export default function EditMember() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMember()
  }, [id])

  const fetchMember = async () => {
    try {
      const response = await fetch(`/api/members/${id}`, {
        credentials: 'include',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!member) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(member),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update member')
      }

      toast({
        title: 'Member updated',
        description: 'The member has been updated successfully.',
      })
      navigate(`/members/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (!member) {
    return <div>Member not found</div>
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Member</CardTitle>
          <CardDescription>Update member information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={member.name}
                  onChange={(e) => setMember({ ...member, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={member.email}
                  onChange={(e) => setMember({ ...member, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={member.phone || ''}
                  onChange={(e) => setMember({ ...member, phone: e.target.value || null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={member.address || ''}
                  onChange={(e) => setMember({ ...member, address: e.target.value || null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="membershipType">Membership Type</Label>
                <Select
                  value={member.membershipType}
                  onValueChange={(value: 'REGULAR' | 'PREMIUM' | 'VIP') =>
                    setMember({ ...member, membershipType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select membership type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGULAR">Regular</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={member.status}
                  onValueChange={(value: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING') =>
                    setMember({ ...member, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={member.notes || ''}
                onChange={(e) => setMember({ ...member, notes: e.target.value || null })}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate(`/members/${id}`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 