import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

interface Court {
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
}

interface TimelineViewProps {
  courts: Court[]
  onSlotClick: (courtId: string, slot: { startTime: string; endTime: string }) => void
  isLoading?: boolean
  timeSlots: string[]
}

const PEAK_HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

export function TimelineView({ courts, onSlotClick, isLoading = false, timeSlots }: TimelineViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div className="grid grid-cols-[120px_repeat(auto-fill,60px)] gap-px bg-border">
              <Skeleton className="h-8" />
              {timeSlots.map(time => (
                <Skeleton key={`time-${time}`} className="h-8" />
              ))}
            </div>
            {[1, 2].map(court => (
              <div key={`skeleton-court-${court}`} className="grid grid-cols-[120px_repeat(auto-fill,60px)] gap-px bg-border">
                <Skeleton className="h-12" />
                {timeSlots.map(time => (
                  <Skeleton key={`skeleton-slot-${court}-${time}`} className="h-12" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!courts || courts.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        No courts available for the selected date.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <div className="min-w-max">
        {/* Time slots header */}
        <div className="grid grid-cols-[120px_repeat(auto-fill,60px)] gap-px bg-muted">
          <div className="bg-background p-2 text-sm font-semibold">Court</div>
          {timeSlots.map(time => (
            <div 
              key={`header-${time}`}
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
          <div key={`court-${court.id}`} className="grid grid-cols-[120px_repeat(auto-fill,60px)] gap-px bg-muted">
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
            {timeSlots.map(time => {
              const slot = court.availableSlots?.find(
                s => s.startTime === time
              )
              const isBooked = slot?.isBooked || false
              const isAvailable = slot && !isBooked
              const isPeakHour = PEAK_HOURS.includes(time)

              return (
                <TooltipProvider key={`slot-${court.id}-${time}`}>
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
                                endTime: timeSlots[timeSlots.indexOf(time) + 1] || '24:00',
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
                            {time} - {timeSlots[timeSlots.indexOf(time) + 1] || '24:00'}
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
  )
} 