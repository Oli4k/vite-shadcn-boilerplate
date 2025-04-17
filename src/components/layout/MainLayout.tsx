import { Sidebar } from "./Sidebar";
import { UserMenu } from "../UserMenu";
import { PageHeader } from "./PageHeader";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { PageHeaderProvider } from "@/contexts/page-header-context";

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
};

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const currentPage = pageTitles[location.pathname] || {
    title: "Page",
    description: "",
  };

  return (
    <PageHeaderProvider>
      <div className="flex flex-col h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold">Tennis Club Pro</span>
            </Link>
            <UserMenu />
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r bg-background">
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