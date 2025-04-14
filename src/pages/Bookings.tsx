import { useState } from "react";
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
import { Plus, Calendar as CalendarIcon, Clock, User } from "lucide-react";

const bookings = [
  {
    id: 1,
    court: "Court 1",
    member: "John Doe",
    date: "2024-04-15",
    time: "10:00 - 11:30",
    status: "Confirmed",
    type: "Tennis",
  },
  {
    id: 2,
    court: "Court 2",
    member: "Jane Smith",
    date: "2024-04-15",
    time: "14:00 - 15:30",
    status: "Pending",
    type: "Padel",
  },
  {
    id: 3,
    court: "Court 3",
    member: "Mike Johnson",
    date: "2024-04-16",
    time: "09:00 - 10:30",
    status: "Confirmed",
    type: "Tennis",
  },
];

export function Bookings() {
  const [date, setDate] = useState<Date>(new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bookings</h2>
          <p className="text-muted-foreground">
            Manage court bookings and schedules
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Booking
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-md border p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Upcoming Bookings</h3>
          </div>
          <div className="rounded-md border">
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
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-md border p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Calendar</h3>
          </div>
          <div className="flex justify-center">
            <Calendar
              onChange={(value) => setDate(value as Date)}
              value={date}
              className="border-0 rounded-md"
              tileClassName={({ date }) => {
                const hasBooking = bookings.some(
                  (booking) => booking.date === date.toISOString().split("T")[0]
                );
                return hasBooking ? "bg-primary/10" : "";
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Selected Date: {date.toDateString()}</h4>
            <div className="space-y-2">
              {bookings
                .filter(
                  (booking) =>
                    booking.date === date.toISOString().split("T")[0]
                )
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted"
                  >
                    <div>
                      <p className="font-medium">{booking.court}</p>
                      <p className="text-sm text-muted-foreground">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 