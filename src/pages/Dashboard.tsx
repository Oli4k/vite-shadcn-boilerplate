import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CreditCard, Activity, Clock, TrendingUp, Plus, BookOpen, UserPlus, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/error-boundary";

interface Stats {
  todayBookings: number;
  totalMembers: number;
  availableCourts: number;
  maintenanceCourts: number;
}

interface Booking {
  id: number;
  court_name: string;
  member_name: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface Activity {
  id: number;
  member_name: string;
  action_type: string;
  description: string;
  created_at: string;
}

function DashboardContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    todayBookings: 0,
    totalMembers: 0,
    availableCourts: 0,
    maintenanceCourts: 0,
  });
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        
        // Fetch stats
        const statsResponse = await fetch('/api/dashboard/stats');
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        const statsData = await statsResponse.json();
        if (statsData.error) {
          throw new Error(statsData.error);
        }
        setStats(statsData);

        // Fetch upcoming bookings
        const bookingsResponse = await fetch('/api/dashboard/bookings');
        if (!bookingsResponse.ok) {
          throw new Error('Failed to fetch upcoming bookings');
        }
        const bookingsData = await bookingsResponse.json();
        if (bookingsData.error) {
          throw new Error(bookingsData.error);
        }
        setUpcomingBookings(bookingsData);

        // Fetch recent activity
        const activityResponse = await fetch('/api/dashboard/activity');
        if (!activityResponse.ok) {
          throw new Error('Failed to fetch recent activity');
        }
        const activityData = await activityResponse.json();
        if (activityData.error) {
          throw new Error(activityData.error);
        }
        setRecentActivity(activityData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "booking":
        return <Calendar className="h-4 w-4" />;
      case "membership":
        return <Users className="h-4 w-4" />;
      case "admin":
        return <Activity className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const dashboardStats = [
    {
      title: "Today's Bookings",
      value: stats.todayBookings.toString(),
      icon: Calendar,
      description: "Active court bookings",
    },
    {
      title: "Total Members",
      value: stats.totalMembers.toString(),
      icon: Users,
      description: "Registered club members",
    },
    {
      title: "Available Courts",
      value: stats.availableCourts.toString(),
      icon: Activity,
      description: `${stats.maintenanceCourts} courts in maintenance`,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Error loading dashboard</h2>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dashboardStats.map((stat) => (
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
                    <p className="text-sm font-medium">{booking.court_name}</p>
                    <p className="text-xs text-muted-foreground">{booking.member_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Badge variant="outline" className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {upcomingBookings.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming bookings</p>
              )}
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
                  {getActivityIcon(activity.action_type)}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.member_name}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
} 