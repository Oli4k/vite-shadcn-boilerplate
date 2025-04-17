import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CreditCard, Activity, Clock, TrendingUp, Plus, BookOpen, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";

const stats = [
  {
    title: "Today's Bookings",
    value: "12",
    icon: Calendar,
    description: "Active court bookings",
    trend: "+2 from yesterday",
  },
  {
    title: "Total Members",
    value: "156",
    icon: Users,
    description: "Registered club members",
    trend: "+5 this month",
  },
  {
    title: "Monthly Revenue",
    value: "$8,450",
    icon: CreditCard,
    description: "Current month earnings",
    trend: "+12% from last month",
  },
  {
    title: "Available Courts",
    value: "8",
    icon: Activity,
    description: "Out of 10 courts",
    trend: "2 courts in maintenance",
  },
];

const upcomingBookings = [
  {
    id: 1,
    court: "Court 1",
    member: "John Doe",
    time: "10:00 AM - 11:30 AM",
    status: "confirmed",
  },
  {
    id: 2,
    court: "Court 3",
    member: "Jane Smith",
    time: "11:30 AM - 1:00 PM",
    status: "pending",
  },
  {
    id: 3,
    court: "Court 5",
    member: "Mike Johnson",
    time: "2:00 PM - 3:30 PM",
    status: "confirmed",
  },
  {
    id: 4,
    court: "Court 2",
    member: "Sarah Wilson",
    time: "4:00 PM - 5:30 PM",
    status: "confirmed",
  },
];

const recentActivity = [
  {
    id: 1,
    member: "John Doe",
    action: "Booked Court 1",
    time: "10:00 AM",
    date: "Today",
    type: "booking",
  },
  {
    id: 2,
    member: "Jane Smith",
    action: "Extended membership",
    time: "09:30 AM",
    date: "Today",
    type: "membership",
  },
  {
    id: 3,
    member: "Mike Johnson",
    action: "Cancelled booking",
    time: "Yesterday",
    date: "Court 3",
    type: "cancellation",
  },
  {
    id: 4,
    member: "Sarah Wilson",
    action: "New membership",
    time: "Yesterday",
    date: "Premium Package",
    type: "membership",
  },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Calendar className="h-4 w-4" />;
      case "membership":
        return <Users className="h-4 w-4" />;
      case "cancellation":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <p className="text-xs text-green-500 mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Bookings</CardTitle>
            <CardDescription className="text-xs">Today's scheduled court bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{booking.court}</p>
                    <p className="text-xs text-muted-foreground">{booking.member}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{booking.time}</span>
                    <Badge variant="outline" className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription className="text-xs">Latest member actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-2">
                  {getActivityIcon(activity.type)}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.member}</p>
                    <p className="text-xs text-muted-foreground">{activity.action}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 