import { format, addDays, isToday, isTomorrow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CalendarDays } from 'lucide-react'
import { useState } from 'react'

interface DateSelectorProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const [showCalendar, setShowCalendar] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            variant={isToday(selectedDate) ? "default" : "outline"}
            className="flex-1"
            onClick={() => onDateChange(new Date())}
          >
            Today
          </Button>
          <Button
            variant={isTomorrow(selectedDate) ? "default" : "outline"}
            className="flex-1"
            onClick={() => onDateChange(addDays(new Date(), 1))}
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
          <div className="rounded-md border bg-background shadow-md">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  onDateChange(date)
                  setShowCalendar(false)
                }
              }}
              initialFocus
            />
          </div>
        </div>
      )}
    </div>
  )
} 