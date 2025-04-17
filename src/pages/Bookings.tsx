import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon, Clock, User } from "lucide-react";
import { usePageHeader } from '@/contexts/page-header-context'
import { useToast } from "@/hooks/use-toast";
import { Booking, getAllBookings, getBookingsByDate } from "@/services/bookings";
import { format } from "date-fns";

export function Bookings() {
  const [date, setDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setActions } = usePageHeader();
  const { toast } = useToast();

  useEffect(() => {
    setActions(
      <Button size="sm">
        <Plus className="mr-2 h-4 w-4" />
        New Booking
      </Button>
    );

    return () => setActions(null);
  }, [setActions]);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    fetchBookingsByDate();
  }, [date]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getAllBookings();
      setBookings(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingsByDate = async () => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const data = await getBookingsByDate(formattedDate);
      setFilteredBookings(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings for selected date';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Court</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.court}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {booking.member}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {booking.date} {booking.time}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{booking.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        booking.status === "Confirmed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {bookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No bookings found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Calendar
              onChange={(value) => setDate(value as Date)}
              value={date}
              className="border-0 rounded-md"
              tileClassName={({ date: tileDate }) => {
                const formattedDate = format(tileDate, 'yyyy-MM-dd');
                const hasBooking = bookings.some(
                  (booking) => booking.date === formattedDate
                );
                return hasBooking ? "bg-primary/10" : "";
              }}
            />
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Calendar className="h-4 w-4" />
              <span>{format(date, 'MMMM d, yyyy')}</span>
            </div>
            <div className="space-y-2">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium">{booking.court}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.time}
                    </p>
                  </div>
                  <Badge
                    variant={
                      booking.status === "Confirmed"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {booking.status}
                  </Badge>
                </div>
              ))}
              {filteredBookings.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  No bookings for this date
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 