import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { format } from 'date-fns'
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

interface Amenities {
  lighting: boolean
  covered: boolean
  indoor: boolean
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
  surfaceTypes: string[]
  selectedSurfaces: string[]
  onSurfaceChange: (surface: string) => void
  amenities: Amenities
  onAmenityChange: (amenity: keyof Amenities) => void
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

function formatEnumValue(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

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

  const [surfaceTypes, setSurfaceTypes] = useState<string[]>([])
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([])
  const [amenities, setAmenities] = useState<Amenities>({
    lighting: false,
    covered: false,
    indoor: false
  })

  const fetchCourts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/courts/availability?date=${format(selectedDate, 'yyyy-MM-dd')}`, {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch court availability')
      }

      const data = await response.json()
      
      const courtsData = data.map((court: any, index: number) => ({
        id: court.id || `court-${index}-${Date.now()}`,
        name: court.name || 'Unknown Court',
        surface: formatEnumValue(court.surface || 'Unknown Surface'),
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

      // Update surface types (keep them formatted)
      const uniqueSurfaces = Array.from(new Set(courtsData.map((court: Court) => court.surface))) as string[]
      setSurfaceTypes(uniqueSurfaces)
      
      // If no surfaces are selected, select all by default
      if (selectedSurfaces.length === 0) {
        setSelectedSurfaces(uniqueSurfaces)
      }

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
  }, [selectedDate, toast, selectedSurfaces.length])

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

  const onSurfaceChange = (surface: string) => {
    setSelectedSurfaces(prev => 
      prev.includes(surface)
        ? prev.filter(s => s !== surface)
        : [...prev, surface]
    )
  }

  const onAmenityChange = (amenity: keyof Amenities) => {
    setAmenities(prev => ({
      ...prev,
      [amenity]: !prev[amenity]
    }))
  }

  useEffect(() => {
    fetchCourts()
  }, [fetchCourts])

  const filteredCourts = courts.filter(court => {
    if (!selectedSurfaces.includes(court.surface)) {
      return false
    }

    return true
  })

  return (
    <BookingContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        courts: filteredCourts,
        isLoading,
        error,
        selectedBooking,
        setSelectedBooking,
        handleSlotClick,
        handleBookingComplete,
        surfaceTypes,
        selectedSurfaces,
        onSurfaceChange,
        amenities,
        onAmenityChange,
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