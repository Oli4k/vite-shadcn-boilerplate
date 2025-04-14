import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "../UserMenu";

export function MainLayout() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b flex items-center justify-end px-4 bg-background">
          <UserMenu />
        </header>
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
} 