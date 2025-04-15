import { Court, CreateCourtData, CourtSurface, CourtType, CourtStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface CourtFormProps {
  court?: Court
  onSubmit: (data: CreateCourtData) => void
  onCancel: () => void
}

const SURFACE_OPTIONS: { value: CourtSurface; label: string }[] = [
  { value: 'HARD', label: 'Hard' },
  { value: 'CLAY', label: 'Clay' },
  { value: 'GRASS', label: 'Grass' },
  { value: 'ARTIFICIAL_GRASS', label: 'Artificial Grass' },
]

const TYPE_OPTIONS: { value: CourtType; label: string }[] = [
  { value: 'INDOOR', label: 'Indoor' },
  { value: 'OUTDOOR', label: 'Outdoor' },
]

const STATUS_OPTIONS: { value: CourtStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'CLOSED', label: 'Closed' },
]

export function CourtForm({ court, onSubmit, onCancel }: CourtFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: CreateCourtData = {
      name: formData.get('name') as string,
      surface: formData.get('surface') as CourtSurface,
      type: formData.get('type') as CourtType,
      status: (formData.get('status') as CourtStatus) || 'ACTIVE',
      hasLights: formData.get('hasLights') === 'on',
    }
    onSubmit(data)
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{court ? 'Edit Court' : 'Add New Court'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={court?.name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surface">Surface</Label>
            <Select name="surface" defaultValue={court?.surface}>
              <SelectTrigger>
                <SelectValue placeholder="Select surface" />
              </SelectTrigger>
              <SelectContent>
                {SURFACE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select name="type" defaultValue={court?.type}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={court?.status || 'ACTIVE'}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="hasLights"
              name="hasLights"
              defaultChecked={court?.hasLights}
            />
            <Label htmlFor="hasLights">Has Lights</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {court ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 