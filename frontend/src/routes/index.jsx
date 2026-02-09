import { Routes, Route, Navigate } from 'react-router-dom'
import LoginTypeSelector from '../pages/Auth/LoginTypeSelector'
import Login from '../pages/Auth/Login'
import DashboardLayout from '../components/layout/DashboardLayout'
import AdminDashboard from '../pages/admin/AdminDashboard'
import StudentDashboard from '../pages/student/StudentDashboard'
import StaffDashboard from '../pages/staff/StaffDashboard'
import { useAuth } from '../context/AuthContext'

// PrivateRoute Component with Role-Based Access Control
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, userRole } = useAuth()

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to login selector
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // Check if user role is allowed for this route
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on user role
    switch (userRole) {
      case 'admin':
        return <Navigate to="/dashboard" replace />
      case 'staff':
        return <Navigate to="/staff/dashboard" replace />
      case 'student':
        return <Navigate to="/student/dashboard" replace />
      default:
        return <Navigate to="/" replace />
    }
  }

  return children
}


// PublicRoute Component - Redirects authenticated users to their dashboard
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, userRole } = useAuth()

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // If authenticated, redirect to role-specific dashboard
  if (isAuthenticated) {
    switch (userRole) {
      case 'admin':
        return <Navigate to="/dashboard" replace />
      case 'staff':
        return <Navigate to="/staff/dashboard" replace />
      case 'student':
        return <Navigate to="/student/dashboard" replace />
      default:
        return <Navigate to="/dashboard" replace />
    }
  }

  return children
}


// Catch-all redirect based on authentication and role
const CatchAllRedirect = () => {
  const { isAuthenticated, userRole } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // Redirect authenticated users to their dashboard
  switch (userRole) {
    case 'admin':
      return <Navigate to="/dashboard" replace />
    case 'staff':
      return <Navigate to="/staff/dashboard" replace />
    case 'student':
      return <Navigate to="/student/dashboard" replace />
    default:
      return <Navigate to="/" replace />
  }
}


const AppRoutes = () => (
  <Routes>
    {/* PUBLIC ROUTES - Login Flow */}
    <Route
      path="/"
      element={
        <PublicRoute>
          <LoginTypeSelector />
        </PublicRoute>
      }
    />

    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />

    {/* ADMIN ROUTES - Full Dashboard with Layout */}
    <Route
      path="/dashboard"
      element={
        <PrivateRoute allowedRoles={['admin']}>
          <DashboardLayout />
        </PrivateRoute>
      }
    >
      {/* Admin Dashboard  */}
      <Route index element={<AdminDashboard />} />
      {/* Add more admin routes here if needed */}
    </Route>

    {/* STAFF ROUTES - Staff Dashboard (No Layout) */}
    <Route
      path="/staff/dashboard"
      element={
        <PrivateRoute allowedRoles={['staff']}>
          <StaffDashboard />
        </PrivateRoute>
      }
    />

    {/* STUDENT ROUTES - Student Dashboard (No Layout) */}
    <Route
      path="/student/dashboard"
      element={
        <PrivateRoute allowedRoles={['student']}>
          <StudentDashboard />
        </PrivateRoute>
      }
    />

    {/* Catch-all route - Redirects based on auth status and role */}
    <Route path="*" element={<CatchAllRedirect />} />
  </Routes>
)

export default AppRoutes
