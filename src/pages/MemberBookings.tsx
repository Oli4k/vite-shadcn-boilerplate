import { useState, useEffect } from 'react'
import { TimelineView } from '@/components/booking/TimelineView'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { format } from 'date-fns'

interface Court {
  id: string
  name: string
  surface: string
  availableSlots: Array<{
    startTime: string
    endTime: string
    isBooked: boolean
    price?: number
    bookedBy?: string
  }>
}

// Mock data for testing
const MOCK_COURTS: Court[] = [
  {
    id: '1',
    name: 'Court 1',
    surface: 'Hard Court',
    availableSlots: [
      { startTime: '09:00', endTime: '10:00', isBooked: false, price: 30 },
      { startTime: '10:00', endTime: '11:00', isBooked: true, bookedBy: 'John D.' },
      { startTime: '11:00', endTime: '12:00', isBooked: false, price: 25 },
      { startTime: '14:00', endTime: '15:00', isBooked: false, price: 20 },
      { startTime: '15:00', endTime: '16:00', isBooked: true, bookedBy: 'Sarah M.' },
    ],
  },
  {
    id: '2',
    name: 'Court 2',
    surface: 'Clay Court',
    availableSlots: [
      { startTime: '09:00', endTime: '10:00', isBooked: true, bookedBy: 'Mike R.' },
      { startTime: '10:00', endTime: '11:00', isBooked: false, price: 30 },
      { startTime: '11:00', endTime: '12:00', isBooked: false, price: 25 },
      { startTime: '14:00', endTime: '15:00', isBooked: true, bookedBy: 'Emma L.' },
      { startTime: '15:00', endTime: '16:00', isBooked: false, price: 20 },
    ],
  },
]

export default function MemberBookings() {
  const { toast } = useToast()
  const [courts, setCourts] = useState<Court[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleSlotClick = async (courtId: string, slot: { startTime: string; endTime: string }) => {
    try {
      await api.post('/bookings', {
        courtId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        date: format(selectedDate, 'yyyy-MM-dd'),
      })
      toast({
        title: 'Success',
        description: 'Booking created successfully',
      })
      fetchCourts()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create booking',
        variant: 'destructive',
      })
    }
  }

  const fetchCourts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('/courts/availability', {
        params: {
          date: format(selectedDate, 'yyyy-MM-dd'),
        },
      })
      setCourts(response.data)
    } catch (error) {
      console.error('Failed to fetch courts:', error)
      setError('Failed to load court availability. Using mock data for demonstration.')
      setCourts(MOCK_COURTS) // Fallback to mock data
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCourts()
  }, [selectedDate])

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Book a Court</h1>
      {error && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-md">
          {error}
        </div>
      )}
      <TimelineView 
        courts={courts} 
        onSlotClick={handleSlotClick} 
        onDateChange={setSelectedDate}
        isLoading={isLoading}
      />
    </div>
  )
} 