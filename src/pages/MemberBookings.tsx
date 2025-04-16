import { useState, useEffect, useCallback } from 'react'
import { TimelineView } from '@/components/booking/TimelineView'
import { BookingDialog } from '@/components/booking/BookingDialog'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { format, addDays, isToday, isTomorrow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, Info, Home, CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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

// Opening hours configuration
const OPENING_HOURS = {
  start: 7, // 7 AM
  end: 22, // 10 PM
}

// Generate time slots based on opening hours
const TIME_SLOTS = Array.from(
  { length: OPENING_HOURS.end - OPENING_HOURS.start },
  (_, i) => {
    const hour = (OPENING_HOURS.start + i).toString().padStart(2, '0')
    return `${hour}:00`
  }
)

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<{
    courtId: string
    courtName: string
    startTime: string
    endTime: string
    price: number
  } | null>(null)

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

  const fetchCourts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('/courts/availability', {
        params: {
          date: format(selectedDate, 'yyyy-MM-dd'),
        },
      })
      
      // Validate and transform the response data
      const courtsData = response.data.map((court: any, index: number) => ({
        id: court.id || `court-${index}-${Date.now()}`, // Generate unique ID if not provided
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
      setError('Failed to load court availability. Using mock data for demonstration.')
      setCourts(MOCK_COURTS) // Fallback to mock data
      toast({
        title: 'Error',
        description: 'Failed to load court availability',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchCourts()
  }, [fetchCourts])

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Book a Court</h1>
        <p className="text-muted-foreground">
          Select a date and time to book your court. Peak hours are highlighted in red.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Left sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Date Selection</CardTitle>
              <CardDescription>Choose when you want to play</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant={isToday(selectedDate) ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Today
                    </Button>
                    <Button
                      variant={isTomorrow(selectedDate) ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setSelectedDate(addDays(new Date(), 1))}
                    >
                      Tomorrow
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={!isToday(selectedDate) && !isTomorrow(selectedDate) ? "default" : "outline"}
                      className="flex-1 justify-start text-left font-normal"
                      onClick={() => setShowCalendar(!showCalendar)}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {format(selectedDate, "PPP")}
                    </Button>
                  </div>
                </div>
                {showCalendar && (
                  <div className="absolute z-50">
                    <Card>
                      <CardContent className="p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) {
                              setSelectedDate(date)
                              setShowCalendar(false)
                            }
                          }}
                          initialFocus
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Court Information</CardTitle>
              <CardDescription>About our facilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Opening Hours</p>
                  <p className="text-sm text-muted-foreground">
                    {OPENING_HOURS.start}:00 - {OPENING_HOURS.end}:00
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Pricing</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Off-Peak Hours</span>
                    <Badge variant="outline">$20-25</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Peak Hours</span>
                    <Badge variant="destructive">$30-35</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="space-y-6">
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-destructive" />
                  <div className="text-destructive">{error}</div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Available Courts</CardTitle>
              <CardDescription>
                Select a time slot to make a booking. Green slots are available, red slots are booked.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimelineView 
                courts={courts} 
                onSlotClick={handleSlotClick} 
                onDateChange={setSelectedDate}
                isLoading={isLoading}
                timeSlots={TIME_SLOTS}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <BookingDialog
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
        courtId={selectedBooking?.courtId || ''}
        courtName={selectedBooking?.courtName || ''}
        startTime={selectedBooking?.startTime || ''}
        endTime={selectedBooking?.endTime || ''}
        date={selectedDate}
        price={selectedBooking?.price || 0}
        onBookingComplete={handleBookingComplete}
      />
    </div>
  )
} 