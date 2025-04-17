import { useState } from "react";
import { useBooking } from "@/contexts/booking-context";
import { DateSelector } from "@/components/booking/DateSelector";
import { TimelineView } from "@/components/booking/TimelineView";
import { BookingDialog } from "@/components/booking/BookingDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Opening hours configuration
const OPENING_HOURS = {
  start: 7,
  end: 22,
};

// Generate time slots
const TIME_SLOTS = Array.from({ length: (OPENING_HOURS.end - OPENING_HOURS.start) * 2 }, (_, i) => {
  const hour = Math.floor(i / 2) + OPENING_HOURS.start;
  const minutes = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

export default function MemberBookings() {
  const { 
    selectedDate, 
    setSelectedDate, 
    courts, 
    isLoading, 
    error, 
    handleSlotClick,
    selectedBooking,
    setSelectedBooking,
    handleBookingComplete
  } = useBooking();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-base">Select Date</CardTitle>
              <CardDescription className="text-xs">Choose a date for your booking</CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              <DateSelector
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-base">Available Courts</CardTitle>
            <CardDescription className="text-xs">View and select available courts for the selected date</CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="w-full overflow-hidden">
                <TimelineView
                  courts={courts}
                  onSlotClick={handleSlotClick}
                  isLoading={isLoading}
                  timeSlots={TIME_SLOTS}
                />
              </div>
            )}
          </CardContent>
        </Card>
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
  );
} 