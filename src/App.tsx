import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/protected-route'
import { MainLayout } from '@/components/layout/MainLayout'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Dashboard } from '@/pages/Dashboard'
import { Courts } from '@/pages/Courts'
import Members from '@/pages/Members'
import MemberDetails from '@/pages/MemberDetails'
import { CreateMember } from '@/pages/CreateMember'
import EditMember from '@/pages/EditMember'
import { Bookings } from '@/pages/Bookings'
import { Packages } from '@/pages/Packages'
import AcceptInvitation from '@/pages/AcceptInvitation'

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
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
                <Bookings />
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
      </Routes>
      <Toaster />
    </AuthProvider>
  )
}
