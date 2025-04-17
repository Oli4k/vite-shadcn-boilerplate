import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { ArrowUpDown, Plus } from 'lucide-react'

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

export default function Members() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [membershipFilter, setMembershipFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<keyof Member>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members', {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }
      const data = await response.json()
      setMembers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch members')
      toast({
        title: 'Error',
        description: 'Failed to load members. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

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

  const filteredMembers = members.filter((member) => {
    const matchesSearch = searchTerm === '' || 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesMembership = membershipFilter === 'all' || member.membershipType === membershipFilter
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter

    return matchesSearch && matchesMembership && matchesStatus
  })

  const handleSort = (field: keyof Member) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedAndFilteredMembers = [...filteredMembers].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    const direction = sortDirection === 'asc' ? 1 : -1

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction * aValue.localeCompare(bValue)
    }
    return 0
  })

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
    <div className="space-y-4">
      <div className="flex justify-end">
        {user?.role === 'ADMIN' && (
          <Button asChild size="sm">
            <Link to="/members/create">
              <Plus className="mr-2 h-4 w-4" />
              Add New Member
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="col-span-1 md:col-span-2">
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select value={membershipFilter} onValueChange={setMembershipFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Membership Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="REGULAR">Regular</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('name')} className="p-0">
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('email')} className="p-0">
                      Email
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('membershipType')} className="p-0">
                      Membership Type
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('status')} className="p-0">
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Managed By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredMembers.map((member) => (
                  <TableRow key={member.id} className="group">
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
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
                    <TableCell>{member.managedBy?.name || '-'}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="ghost" className="hover:bg-primary hover:text-primary-foreground">
                        <Link to={`/members/${member.id}`}>View Details</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {sortedAndFilteredMembers.length === 0 && (
            <div className="text-center py-10 text-sm text-muted-foreground">
              No members found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 