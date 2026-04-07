import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth }             from '../context/AuthContext'

// ── Pages ──────────────────────────────────────────────────────────────────
import LoginTypeSelector      from '../pages/Auth/LoginTypeSelector'
import Login                  from '../pages/Auth/Login'
import DashboardLayout        from '../components/layout/DashboardLayout'
import AdminDashboard         from '../pages/admin/AdminDashboard'
import StudentDashboard       from '../pages/student/StudentDashboard'
import StaffDashboard         from '../pages/staff/StaffDashboard'
import AttendanceManagement   from '../pages/admin/AttendanceManagement'
import StaffLayout            from '../pages/staff/StaffLayout'
import LeadsPanel             from '../components/admin/dashboard/LeadsPanel'
import MarkAttendance         from '../components/staff/MarkAttendance'
import AttendanceLog          from '../components/staff/AttendanceLog'
import ApplyLeave             from '../components/staff/ApplyLeave'
import StaffReports           from '../components/staff/StaffReports'

// ── Shared: LoadingScreen ──────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-[#C8294A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
)

// ── Shared: ComingSoon ─────────────────────────────────────────────────────
const ComingSoon = ({ title = 'Coming Soon' }) => (
  <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl shadow">
    <div className="w-16 h-16 bg-[#C8294A]/10 rounded-full flex items-center justify-center mb-4">
      <span className="text-3xl">🚧</span>
    </div>
    <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">{title}</h2>
    <p className="text-gray-400 text-sm">This page is under construction</p>
  </div>
)

// ── PrivateRoute ───────────────────────────────────────────────────────────
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, authLoading, userRole } = useAuth()

  if (authLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/" replace />

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    switch (userRole) {
      case 'admin':   return <Navigate to="/dashboard"         replace />
      case 'staff':   return <Navigate to="/staff/dashboard"   replace />
      case 'student': return <Navigate to="/student/dashboard" replace />
      default:        return <Navigate to="/"                  replace />
    }
  }

  return children
}

// ── PublicRoute ────────────────────────────────────────────────────────────
const PublicRoute = ({ children }) => {
  const { isAuthenticated, authLoading, userRole } = useAuth()

  if (authLoading) return <LoadingScreen />

  if (isAuthenticated) {
    switch (userRole) {
      case 'admin':   return <Navigate to="/dashboard"         replace />
      case 'staff':   return <Navigate to="/staff/dashboard"   replace />
      case 'student': return <Navigate to="/student/dashboard" replace />
      default:        return <Navigate to="/dashboard"         replace />
    }
  }

  return children
}

// ── CatchAllRedirect ───────────────────────────────────────────────────────
const CatchAllRedirect = () => {
  const { isAuthenticated, userRole } = useAuth()

  if (!isAuthenticated) return <Navigate to="/" replace />

  switch (userRole) {
    case 'admin':   return <Navigate to="/dashboard"         replace />
    case 'staff':   return <Navigate to="/staff/dashboard"   replace />
    case 'student': return <Navigate to="/student/dashboard" replace />
    default:        return <Navigate to="/"                  replace />
  }
}

// ── AppRoutes ──────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>

    {/* ── PUBLIC ── */}
    <Route path="/"      element={<PublicRoute><LoginTypeSelector /></PublicRoute>} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

    {/* ── ADMIN ── */}
    <Route path="/dashboard"
      element={<PrivateRoute allowedRoles={['admin']}><DashboardLayout /></PrivateRoute>}>
      <Route index             element={<AdminDashboard />} />
      <Route path="attendance" element={<AttendanceManagement />} />
    </Route>

    <Route path="/admin/leads"
      element={<PrivateRoute allowedRoles={['admin']}><DashboardLayout /></PrivateRoute>}>
      <Route index element={<AdminDashboard />} />
    </Route>

    <Route path="/admin/students"
      element={<PrivateRoute allowedRoles={['admin']}><DashboardLayout /></PrivateRoute>}>
      <Route index element={<AdminDashboard />} />
    </Route>

    <Route path="/admin/staff"
      element={<PrivateRoute allowedRoles={['admin']}><DashboardLayout /></PrivateRoute>}>
      <Route index element={<AdminDashboard />} />
    </Route>

    <Route path="/admin/fee"
      element={<PrivateRoute allowedRoles={['admin']}><DashboardLayout /></PrivateRoute>}>
      <Route index element={<AdminDashboard />} />
    </Route>

    <Route path="/admin/student-attendance"
      element={<PrivateRoute allowedRoles={['admin']}><DashboardLayout /></PrivateRoute>}>
      <Route index element={<AdminDashboard />} />
    </Route>

    <Route path="/admin/staff-attendance"
      element={<PrivateRoute allowedRoles={['admin']}><DashboardLayout /></PrivateRoute>}>
      <Route index element={<AdminDashboard />} />
    </Route>

    <Route path="/admin/classes"
      element={<PrivateRoute allowedRoles={['admin', 'staff']}><DashboardLayout /></PrivateRoute>}>
      <Route index element={<AdminDashboard />} />
    </Route>

    <Route path="/admin/certificates"
      element={<PrivateRoute allowedRoles={['admin']}><DashboardLayout /></PrivateRoute>}>
      <Route index element={<AdminDashboard />} />
    </Route>

    <Route path="/admin/reports"
      element={<PrivateRoute allowedRoles={['admin']}><DashboardLayout /></PrivateRoute>}>
      <Route index element={<AdminDashboard />} />
    </Route>

    <Route path="/admin/settings"
      element={<PrivateRoute allowedRoles={['admin']}><DashboardLayout /></PrivateRoute>}>
      <Route index element={<AdminDashboard />} />
    </Route>

    <Route path="/admin/office"
      element={<PrivateRoute allowedRoles={['admin']}><DashboardLayout /></PrivateRoute>}>
      <Route index element={<AdminDashboard />} />
    </Route>

    <Route path="/admin/analytics"
      element={<PrivateRoute allowedRoles={['admin']}><DashboardLayout /></PrivateRoute>}>
      <Route index element={<AdminDashboard />} />
    </Route>

    {/* ── STAFF ── */}
    <Route path="/staff"
      element={<PrivateRoute allowedRoles={['staff']}><StaffLayout /></PrivateRoute>}>
      <Route index                  element={<Navigate to="/staff/dashboard" replace />} />
      <Route path="dashboard"       element={<StaffDashboard />} />
      <Route path="leads"           element={<LeadsPanel />} />
      <Route path="attendance"      element={<MarkAttendance />} />
      <Route path="attendance/log"  element={<AttendanceLog />} />
      <Route path="leave/apply"     element={<ApplyLeave />} />
      <Route path="reports"         element={<StaffReports />} />
      <Route path="*"               element={<Navigate to="/staff/dashboard" replace />} />
    </Route>

    {/* ── STUDENT ── */}
    <Route path="/student/dashboard"
      element={<PrivateRoute allowedRoles={['student']}><StudentDashboard /></PrivateRoute>} />

    {/* ── CATCH-ALL ── */}
    <Route path="*" element={<CatchAllRedirect />} />

  </Routes>
)

export default AppRoutes
