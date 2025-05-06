import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Square,
  Users,
  Calendar,
  Package,
  Settings,
  Shield,
  Newspaper
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ScrollArea } from "@/components/ui/scroll-area";

// Common navigation items accessible to all users
const commonNavigation = [
  {
    name: "Bookings",
    href: "/bookings",
    icon: Calendar,
  },
  {
    name: "Club News",
    href: "/news",
    icon: Newspaper,
  },
];

// Staff and admin navigation items
const staffNavigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Courts",
    href: "/courts",
    icon: Square,
  },
  {
    name: "Members",
    href: "/members",
    icon: Users,
  },
  {
    name: "Packages",
    href: "/packages",
    icon: Package,
  },
  {
    name: "Manage News",
    href: "/admin/news",
    icon: Newspaper,
  },
];

// Admin-only navigation items
const adminNavigation = [
  {
    name: "Theme Config",
    href: "/admin/theme",
    icon: Settings,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  
  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const NavLink = ({ item }: { item: typeof commonNavigation[0] }) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        key={item.name}
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.name}
      </Link>
    );
  };

  return (
    <ScrollArea className="h-full py-6">
      <nav className="space-y-6 px-4 pt-4 md:pt-0">
        <div className="space-y-1">
          {commonNavigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        {isStaff && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Staff
                </span>
              </div>
            </div>

            <div className="space-y-1">
              {staffNavigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </div>
          </>
        )}

        {isAdmin && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Admin
                </span>
              </div>
            </div>

            <div className="space-y-1">
              {adminNavigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </div>
          </>
        )}
      </nav>
    </ScrollArea>
  );
} 