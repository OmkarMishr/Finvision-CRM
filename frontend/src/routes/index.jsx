import { Routes, Route, Navigate } from 'react-router-dom'
import LoginTypeSelector from '../pages/Auth/LoginTypeSelector'
import Login from '../pages/Auth/Login'
import DashboardLayout from '../components/layout/DashboardLayout'
import Dashboard from '../pages/Dashboard/Dashboard'
import { useAuth } from '../context/AuthContext'

//PrivateRoute Component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

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

  return isAuthenticated ? children : <Navigate to="/" replace />
}

 
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
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

    {/* PRIVATE ROUTES - Dashboard */}
    <Route 
      path="/dashboard" 
      element={
        <PrivateRoute>
          <DashboardLayout />
        </PrivateRoute>
      }
    >
      <Route index element={<Dashboard />} />
    </Route>

    <Route path="*" element={<Navigate to={useAuth().isAuthenticated ? "/dashboard" : "/"} replace />} />
  </Routes>
)

export default AppRoutes
