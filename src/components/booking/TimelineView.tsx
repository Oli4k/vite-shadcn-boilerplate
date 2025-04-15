import { useState } from 'react'
import { format, addDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

interface TimelineViewProps {
  courts: Array<{
    id: string
    name: string
    surface: string
    availableSlots: Array<{
      startTime: string
      endTime: string
      isBooked: boolean
      bookedBy?: string
      price?: number
    }>
  }>
  onSlotClick: (courtId: string, slot: { startTime: string; endTime: string }) => void
  onDateChange: (date: Date) => void
  isLoading?: boolean
}

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return `${hour}:00`
})

const PEAK_HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

export function TimelineView({ courts, onSlotClick, onDateChange, isLoading = false }: TimelineViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())

  const handlePreviousDay = () => {
    const newDate = addDays(selectedDate, -1)
    setSelectedDate(newDate)
    onDateChange(newDate)
  }

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1)
    setSelectedDate(newDate)
    onDateChange(newDate)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-10" />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div className="grid grid-cols-[120px_repeat(24,60px)] gap-px bg-border">
              <Skeleton className="h-8" />
              {TIME_SLOTS.map(time => (
                <Skeleton key={time} className="h-8" />
              ))}
            </div>
            {[1, 2].map(court => (
              <div key={court} className="grid grid-cols-[120px_repeat(24,60px)] gap-px bg-border">
                <Skeleton className="h-12" />
                {TIME_SLOTS.map(time => (
                  <Skeleton key={time} className="h-12" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={handlePreviousDay}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        <Button variant="outline" size="icon" onClick={handleNextDay}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <div className="min-w-max">
          {/* Time slots header */}
          <div className="grid grid-cols-[120px_repeat(24,60px)] gap-px bg-muted">
            <div className="bg-background p-2 text-sm font-semibold">Court</div>
            {TIME_SLOTS.map(time => (
              <div 
                key={time} 
                className={`bg-background p-2 text-xs ${
                  PEAK_HOURS.includes(time) ? 'text-destructive font-semibold' : 'text-muted-foreground'
                }`}
              >
                {time}
              </div>
            ))}
          </div>

          {/* Courts rows */}
          {courts.map(court => (
            <div key={court.id} className="grid grid-cols-[120px_repeat(24,60px)] gap-px bg-muted">
              <div className="bg-background p-2 text-sm font-semibold truncate">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>{court.name}</TooltipTrigger>
                    <TooltipContent>
                      <p>{court.surface}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {TIME_SLOTS.map(time => {
                const slot = court.availableSlots.find(
                  s => s.startTime === time
                )
                const isBooked = slot?.isBooked || false
                const isAvailable = slot && !isBooked
                const isPeakHour = PEAK_HOURS.includes(time)

                return (
                  <TooltipProvider key={`${court.id}-${time}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-12 p-1">
                          {isBooked ? (
                            <div className="h-full w-full flex items-center justify-center bg-destructive/10 rounded-sm">
                              <Badge variant="destructive" className="text-[10px]">
                                {slot?.bookedBy || 'Booked'}
                              </Badge>
                            </div>
                          ) : isAvailable ? (
                            <Button
                              variant={isPeakHour ? "default" : "outline"}
                              size="sm"
                              className="h-full w-full text-[10px] p-0"
                              onClick={() =>
                                onSlotClick(court.id, {
                                  startTime: time,
                                  endTime: TIME_SLOTS[TIME_SLOTS.indexOf(time) + 1] || '24:00',
                                })
                              }
                            >
                              <div className="flex flex-col items-center">
                                <span>{isPeakHour ? 'Peak' : 'Free'}</span>
                                {slot?.price && (
                                  <span className="text-[8px]">${slot.price}</span>
                                )}
                              </div>
                            </Button>
                          ) : (
                            <div className="h-full w-full bg-muted rounded-sm" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isBooked ? (
                          <div className="space-y-1">
                            <p className="font-semibold">Booked</p>
                            <p className="text-sm">By: {slot?.bookedBy || 'someone'}</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="font-semibold">
                              {time} - {TIME_SLOTS[TIME_SLOTS.indexOf(time) + 1] || '24:00'}
                            </p>
                            {slot?.price && <p className="text-sm">Price: ${slot.price}</p>}
                            {isPeakHour && (
                              <Badge variant="destructive" className="text-xs">
                                Peak hour
                              </Badge>
                            )}
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 