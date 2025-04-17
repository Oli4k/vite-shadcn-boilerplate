import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Clock, Calendar, Info, Lock, Check, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export function TimelineView({ courts, onSlotClick, isLoading, timeSlots }: TimelineViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <div className="grid grid-cols-6 gap-2">
              {timeSlots.slice(0, 6).map((_, j) => (
                <Skeleton key={j} className="h-10 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (courts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Info className="h-6 w-6 text-muted-foreground mb-1.5" />
        <p className="text-sm text-muted-foreground">No courts available for the selected date</p>
      </div>
    )
  }

  const isPeakHour = (time: string) => {
    const hour = parseInt(time.split(':')[0])
    return hour >= PEAK_HOURS.start && hour < PEAK_HOURS.end
  }

  return (
    <div className="space-y-6">
      {courts.map((court) => (
        <div key={court.id} className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-medium">{court.name}</h3>
            <Badge variant="outline" className="text-xs">
              {court.surface}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {court.availableSlots.filter(slot => !slot.isBooked).length} slots available
            </Badge>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {timeSlots.map((time) => {
              const slot = court.availableSlots.find(
                (s) => s.startTime === time
              )
              const isBooked = slot?.isBooked
              const price = slot?.price
              const isPeak = isPeakHour(time)

              return (
                <TooltipProvider key={time}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isBooked ? "ghost" : isPeak ? "secondary" : "outline"}
                        size="sm"
                        className={cn(
                          "h-12 flex flex-col items-center justify-center relative group transition-all duration-200",
                          isBooked && "opacity-50 cursor-not-allowed",
                          !isBooked && "hover:scale-105 hover:shadow-md",
                          isPeak && !isBooked && "hover:bg-destructive hover:text-destructive-foreground",
                          !isPeak && !isBooked && "hover:bg-primary hover:text-primary-foreground"
                        )}
                        disabled={isBooked}
                        onClick={() =>
                          !isBooked &&
                          onSlotClick(court.id, {
                            startTime: time,
                            endTime: timeSlots[timeSlots.indexOf(time) + 1],
                          })
                        }
                      >
                        <div className="absolute top-1 right-1">
                          {isBooked ? (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Check className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <span className="text-xs font-medium leading-none">{time}</span>
                        {price && (
                          <div className="flex items-center gap-1 mt-1">
                            <DollarSign className={cn(
                              "h-3 w-3",
                              isPeak ? "text-destructive" : "text-muted-foreground"
                            )} />
                            <span className={cn(
                              "text-[10px] font-medium",
                              isPeak ? "text-destructive" : "text-muted-foreground"
                            )}>
                              {price}
                            </span>
                          </div>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="p-2">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            isBooked ? "bg-muted" : isPeak ? "bg-destructive" : "bg-primary"
                          )} />
                          <p className="text-xs font-medium">
                            {isBooked ? "Booked" : "Available"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{time} - {timeSlots[timeSlots.indexOf(time) + 1]}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{isPeak ? "Peak hours" : "Off-peak hours"}</span>
                        </div>
                        {price && (
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <DollarSign className="h-3 w-3" />
                            <span>${price} per hour</span>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
} 