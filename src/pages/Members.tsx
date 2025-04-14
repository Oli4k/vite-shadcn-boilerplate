import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

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

export function Members() {
  const { getAccessToken, user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMembers = async () => {
      const token = getAccessToken()
      if (!token) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/members', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch members')
        }

        const data = await response.json()
        setMembers(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [getAccessToken])

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

  const canManageMembers = user?.role === 'ADMIN' || user?.role === 'STAFF'

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

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Members</h1>
        {canManageMembers && (
          <Button asChild>
            <Link to="/members/create">Add Member</Link>
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Membership Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Managed By</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.phone || '-'}</TableCell>
                <TableCell>
                  <Badge className={getMembershipTypeColor(member.membershipType)}>
                    {member.membershipType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(member.status)}>
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {member.managedBy?.name || '-'}
                </TableCell>
                <TableCell>
                  {new Date(member.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/members/${member.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      {canManageMembers && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to={`/members/${member.id}/edit`}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/members/${member.id}/payments`}>View Payments</Link>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 