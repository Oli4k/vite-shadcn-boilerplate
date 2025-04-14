import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Courts } from "@/pages/Courts";
import { Members } from "@/pages/Members";
import { Bookings } from "@/pages/Bookings";
import { Packages } from "@/pages/Packages";
import { Login } from "@/pages/Login";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="courts" element={<Courts />} />
        <Route path="members" element={<Members />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="packages" element={<Packages />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
