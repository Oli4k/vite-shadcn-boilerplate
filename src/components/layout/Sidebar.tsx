import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Square,
  Users,
  Calendar,
  Package,
} from "lucide-react";

const navigation = [
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
    name: "Bookings",
    href: "/bookings",
    icon: Calendar,
  },
  {
    name: "Packages",
    href: "/packages",
    icon: Package,
  },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-1 p-4 pt-4">
        {navigation.map((item) => {
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
        })}
      </nav>
    </div>
  );
} 