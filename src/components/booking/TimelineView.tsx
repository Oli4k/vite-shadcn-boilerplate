import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Clock, Calendar, Info, Lock, AlertCircle, Wrench, Star, MapPin, CircleDot } from 'lucide-react'
import { cn } from '@/lib/utils'

type SlotStatus = 'available' | 'booked' | 'peak' | 'maintenance' | 'special'

interface Court {
  id: string
  name: string
  surface: string
  availableSlots: Array<{
    startTime: string
    endTime: string
    isBooked: boolean
    status?: SlotStatus
    bookedBy?: string
  }>
}

interface TimelineViewProps {
  courts: Court[]
  onSlotClick: (courtId: string, slot: { startTime: string; endTime: string }) => void
  isLoading: boolean
  timeSlots: string[]
}

// Define peak hours (e.g., 17:00 to 20:00)
const PEAK_HOURS = {
  start: 17,
  end: 20,
}

const STATUS_CONFIG = {
  available: {
    color: 'bg-primary',
    icon: null,
    label: 'Available',
    description: 'This slot is available for booking'
  },
  booked: {
    color: 'bg-muted',
    icon: Lock,
    label: 'Booked',
    description: 'This slot has been booked'
  },
  peak: {
    color: 'bg-orange-500',
    icon: AlertCircle,
    label: 'Peak Hours',
    description: 'High demand period'
  },
  maintenance: {
    color: 'bg-yellow-500',
    icon: Wrench,
    label: 'Maintenance',
    description: 'Court under maintenance'
  },
  special: {
    color: 'bg-purple-500',
    icon: Star,
    label: 'Special Event',
    description: 'Reserved for special event'
  }
} as const

export function TimelineView({ courts, onSlotClick, isLoading, timeSlots }: TimelineViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {Array(8).fill(0).map((_, j) => (
                  <Skeleton key={j} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (courts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <Info className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="font-medium">No Courts Available</p>
          <p className="text-sm text-muted-foreground mt-1">Try selecting a different date</p>
        </CardContent>
      </Card>
    )
  }

  const getSlotStatus = (slot: Court['availableSlots'][0] | undefined, time: string): SlotStatus => {
    if (!slot) return 'available'
    if (slot.isBooked) return 'booked'
    const hour = parseInt(time.split(':')[0])
    if (hour >= PEAK_HOURS.start && hour < PEAK_HOURS.end) return 'peak'
    return 'available'
  }

  return (
    <div className="space-y-6">
      {courts.map((court) => {
        const availableCount = court.availableSlots.filter(slot => !slot.isBooked).length;
        const totalSlots = timeSlots.length;
        const availabilityPercentage = Math.round((availableCount / totalSlots) * 100);

        return (
          <Card key={court.id}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">{court.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CircleDot className="h-3.5 w-3.5" />
                      <span>{court.surface}</span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div 
                      className={cn(
                        "flex items-center gap-1.5",
                        availabilityPercentage > 50 ? "text-green-600 dark:text-green-500" :
                        availabilityPercentage > 20 ? "text-orange-600 dark:text-orange-500" :
                        "text-red-600 dark:text-red-500"
                      )}
                    >
                      <span className="font-medium">{availableCount}</span>
                      <span className="text-muted-foreground">slots available</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {timeSlots.map((time) => {
                    const slot = court.availableSlots.find(s => s.startTime === time)
                    const status = getSlotStatus(slot, time)
                    const endTime = timeSlots[timeSlots.indexOf(time) + 1]
                    const StatusIcon = STATUS_CONFIG[status].icon

                    return (
                      <TooltipProvider key={time}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-auto w-full p-3 flex flex-col items-start gap-2 group transition-all duration-200",
                                status === 'booked' && "opacity-60 cursor-not-allowed bg-muted",
                                status === 'available' && "hover:border-primary hover:shadow-sm",
                                status === 'peak' && "bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30",
                              )}
                              disabled={status !== 'available'}
                              onClick={() =>
                                status === 'available' &&
                                onSlotClick(court.id, { startTime: time, endTime })
                              }
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-medium">{time}</span>
                                {StatusIcon && (
                                  <StatusIcon className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "h-2 w-2 rounded-full",
                                  STATUS_CONFIG[status].color
                                )} />
                                <p className="font-medium">
                                  {STATUS_CONFIG[status].label}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{time} - {endTime}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {STATUS_CONFIG[status].description}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 