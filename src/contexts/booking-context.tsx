import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

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

interface BookingContextType {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  courts: Court[]
  isLoading: boolean
  error: string | null
  selectedBooking: {
    courtId: string
    courtName: string
    startTime: string
    endTime: string
    price: number
  } | null
  setSelectedBooking: (booking: any) => void
  handleSlotClick: (courtId: string, slot: { startTime: string; endTime: string }) => void
  handleBookingComplete: () => void
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export function BookingProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [courts, setCourts] = useState<Court[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<{
    courtId: string
    courtName: string
    startTime: string
    endTime: string
    price: number
  } | null>(null)

  const fetchCourts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('/courts/availability', {
        params: {
          date: format(selectedDate, 'yyyy-MM-dd'),
        },
      })
      
      const courtsData = response.data.map((court: any, index: number) => ({
        id: court.id || `court-${index}-${Date.now()}`,
        name: court.name || 'Unknown Court',
        surface: court.surface || 'Unknown Surface',
        availableSlots: Array.isArray(court.availableSlots) 
          ? court.availableSlots.map((slot: any) => ({
              startTime: slot.startTime || '',
              endTime: slot.endTime || '',
              isBooked: Boolean(slot.isBooked),
              price: slot.price,
              bookedBy: slot.bookedBy,
            }))
          : [],
      }))

      setCourts(courtsData)
    } catch (error) {
      console.error('Failed to fetch courts:', error)
      setError('Failed to load court availability')
      toast({
        title: 'Error',
        description: 'Failed to load court availability',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate, toast])

  const handleSlotClick = (courtId: string, slot: { startTime: string; endTime: string }) => {
    const court = courts.find(c => c.id === courtId)
    if (!court) return

    const slotData = court.availableSlots.find(s => s.startTime === slot.startTime)
    if (!slotData) return

    setSelectedBooking({
      courtId,
      courtName: court.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      price: slotData.price || 0,
    })
  }

  const handleBookingComplete = () => {
    fetchCourts()
  }

  // Fetch courts when selectedDate changes
  useEffect(() => {
    fetchCourts()
  }, [fetchCourts])

  return (
    <BookingContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        courts,
        isLoading,
        error,
        selectedBooking,
        setSelectedBooking,
        handleSlotClick,
        handleBookingComplete,
      }}
    >
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider')
  }
  return context
} 