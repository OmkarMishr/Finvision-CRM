import { Routes, Route, Navigate, useOutlet } from 'react-router-dom'
import Login from '../pages/Auth/Login'
import DashboardLayout from '../components/layout/DashboardLayout'
import Dashboard from '../pages/Dashboard/Dashboard'
import { useAuth } from '../context/AuthContext'

//  PrivateRoute Component
const PrivateRouteContent = () => {
  const { isAuthenticated, loading } = useAuth()
  const outlet = useOutlet()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? outlet : <Navigate to="/login" replace />
}

// PublicRoute Component
const PublicRouteContent = () => {
  const { isAuthenticated } = useAuth()
  const outlet = useOutlet()

  return isAuthenticated ? <Navigate to="/" replace /> : outlet
}

const AppRoutes = () => (
  <Routes>
    {/* PUBLIC ROUTES */}
    <Route path="/login" element={
      <PublicRouteContent />
    }>
      <Route index element={<Login />} />
    </Route>

    {/* PRIVATE ROUTES */}
    <Route path="/" element={
      <PrivateRouteContent />
    }>
      <Route element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
      </Route>
    </Route>

    {/* CATCH ALL */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

export default AppRoutes
