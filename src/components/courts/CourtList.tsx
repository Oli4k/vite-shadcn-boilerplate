import { Court } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface CourtListProps {
  courts: Court[]
  onEdit: (court: Court) => void
  onDelete: (id: number) => void
}

export function CourtList({ courts, onEdit, onDelete }: CourtListProps) {
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-500'
      case 'MAINTENANCE':
        return 'bg-yellow-500'
      case 'CLOSED':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatEnumValue = (value: string) => {
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Surface</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Lights</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courts.map(court => (
            <TableRow key={court.id}>
              <TableCell>{court.name}</TableCell>
              <TableCell>{formatEnumValue(court.surface)}</TableCell>
              <TableCell>{formatEnumValue(court.type)}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(court.status)}>
                  {formatEnumValue(court.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={court.hasLights ? 'default' : 'secondary'}>
                  {court.hasLights ? 'Yes' : 'No'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  className="mr-2"
                  onClick={() => onEdit(court)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => onDelete(court.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 