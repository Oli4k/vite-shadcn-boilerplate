import { Sidebar } from "./Sidebar";
import { UserMenu } from "../UserMenu";
import { PageHeader } from "./PageHeader";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { PageHeaderProvider } from "@/contexts/page-header-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

const pageTitles: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Overview of your club's activities",
  },
  "/courts": {
    title: "Courts",
    description: "Manage and view court availability",
  },
  "/members": {
    title: "Members",
    description: "Manage club members and their details",
  },
  "/bookings": {
    title: "Bookings",
    description: "View and manage court bookings",
  },
  "/packages": {
    title: "Packages",
    description: "Manage membership and booking packages",
  },
  "/news": {
    title: "Club News",
    description: "Latest updates and announcements",
  },
  "/admin/news": {
    title: "Manage News",
    description: "Create and manage club news articles",
  },
  "/admin/theme": {
    title: "Theme Configuration",
    description: "Customize the application's theme and colors",
  },
  "/settings": {
    title: "Settings",
    description: "Manage your account settings and preferences",
  },
};

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const currentPage = pageTitles[location.pathname] || {
    title: "Page",
    description: "",
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sheet when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <PageHeaderProvider>
      <div className="flex flex-col h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              {isMobile && (
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0">
                    <Sidebar />
                  </SheetContent>
                </Sheet>
              )}
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold">Tennis Club Pro</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden md:block w-64 border-r bg-background">
            <Sidebar />
          </div>
          <main className="flex-1 overflow-auto p-6">
            <PageHeader
              title={currentPage.title}
              description={currentPage.description}
            />
            {children}
          </main>
        </div>
      </div>
    </PageHeaderProvider>
  );
} 