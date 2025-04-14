import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/protected-route'
import { MainLayout } from './components/layout/MainLayout'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Courts } from './pages/Courts'
import { Members } from './pages/Members'
import { MemberDetail } from './pages/MemberDetail'
import { Bookings } from './pages/Bookings'
import { Packages } from './pages/Packages'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="courts" element={<Courts />} />
        <Route path="members" element={<Members />} />
        <Route path="members/:id" element={<MemberDetail />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="packages" element={<Packages />} />
      </Route>
    </Routes>
  )
}
