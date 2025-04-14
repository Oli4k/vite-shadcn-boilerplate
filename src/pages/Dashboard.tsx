import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, CreditCard, Activity, Clock, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Today's Bookings",
    value: "12",
    icon: Calendar,
    description: "Active court bookings",
  },
  {
    title: "Total Members",
    value: "156",
    icon: Users,
    description: "Registered club members",
  },
  {
    title: "Monthly Revenue",
    value: "$8,450",
    icon: CreditCard,
    description: "Current month earnings",
  },
  {
    title: "Available Courts",
    value: "8",
    icon: Activity,
    description: "Out of 10 courts",
  },
];

const recentActivity = [
  {
    id: 1,
    member: "John Doe",
    action: "Booked Court 1",
    time: "10:00 AM",
    date: "Today",
  },
  {
    id: 2,
    member: "Jane Smith",
    action: "Extended membership",
    time: "09:30 AM",
    date: "Today",
  },
  {
    id: 3,
    member: "Mike Johnson",
    action: "Cancelled booking",
    time: "Yesterday",
    date: "Court 3",
  },
  {
    id: 4,
    member: "Sarah Wilson",
    action: "New membership",
    time: "Yesterday",
    date: "Premium Package",
  },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to Tennis Club Pro management system
        </p>
      </div>

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
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Chart will be displayed here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.member}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm font-medium">{activity.time}</p>
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