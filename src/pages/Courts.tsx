import { useState, useEffect } from 'react'
import { getAllCourts, createCourt, updateCourt, deleteCourt } from '@/services/courts'
import { Court } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CourtForm } from '@/components/courts/CourtForm'
import { CourtList } from '@/components/courts/CourtList'
import { useToast } from '@/hooks/use-toast'

export function Courts() {
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  const { toast } = useToast()

  const fetchCourts = async () => {
    try {
      setLoading(true)
      const data = await getAllCourts()
      setCourts(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching courts:', err)
      setError('Failed to fetch courts')
      toast({
        title: 'Error',
        description: 'Failed to fetch courts',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourts()
  }, [])

  const handleCreate = async (data: Partial<Court>) => {
    try {
      const newCourt = await createCourt(data)
      setCourts([...courts, newCourt])
      setIsFormOpen(false)
      toast({
        title: 'Success',
        description: 'Court created successfully',
      })
    } catch (err) {
      console.error('Error creating court:', err)
      toast({
        title: 'Error',
        description: 'Failed to create court',
        variant: 'destructive',
      })
    }
  }

  const handleUpdate = async (id: number, data: Partial<Court>) => {
    try {
      const updatedCourt = await updateCourt(id, data)
      setCourts(courts.map(court => 
        court.id === id ? updatedCourt : court
      ))
      setEditingCourt(null)
      toast({
        title: 'Success',
        description: 'Court updated successfully',
      })
    } catch (err) {
      console.error('Error updating court:', err)
      toast({
        title: 'Error',
        description: 'Failed to update court',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteCourt(id)
      setCourts(courts.filter(court => court.id !== id))
      toast({
        title: 'Success',
        description: 'Court deleted successfully',
      })
    } catch (err) {
      console.error('Error deleting court:', err)
      toast({
        title: 'Error',
        description: 'Failed to delete court',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Courts</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Court
        </Button>
      </div>

      <CourtList
        courts={courts}
        onEdit={setEditingCourt}
        onDelete={handleDelete}
      />

      {isFormOpen && (
        <CourtForm
          onSubmit={handleCreate}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {editingCourt && (
        <CourtForm
          court={editingCourt}
          onSubmit={(data) => handleUpdate(editingCourt.id, data)}
          onCancel={() => setEditingCourt(null)}
        />
      )}
    </div>
  )
} 