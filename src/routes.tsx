import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { BookingProvider } from '@/contexts/booking-context'
import { ProtectedRoute } from '@/components/protected-route'
import { MainLayout } from '@/components/layout/MainLayout'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import { Dashboard } from '@/pages/Dashboard'
import { Courts } from '@/pages/Courts'
import Members from '@/pages/Members'
import MemberDetails from '@/pages/MemberDetails'
import { CreateMember } from '@/pages/members/create'
import EditMember from '@/pages/EditMember'
import MemberBookings from '@/pages/MemberBookings'
import { Packages } from '@/pages/Packages'
import AcceptInvitation from '@/pages/AcceptInvitation'
import News from '@/pages/News'
import AdminNews from '@/pages/AdminNews'
import { Settings } from '@/pages/Settings'
import { ThemeConfig } from '@/pages/admin/ThemeConfig'

function RootRedirect() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
}

export function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courts"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Courts />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Members />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/members/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MemberDetails />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/members/:id/edit"
          element={
            <ProtectedRoute>
              <MainLayout>
                <EditMember />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/members/create"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CreateMember />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BookingProvider>
                  <MemberBookings />
                </BookingProvider>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/packages"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Packages />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Settings />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/news"
          element={
            <MainLayout>
              <News />
            </MainLayout>
          }
        />
        <Route
          path="/admin/news"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AdminNews />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/theme"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ThemeConfig />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
} 