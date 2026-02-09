import { Menu, Users, DollarSign, Calendar, BookOpen, Award, Video, Users2, Settings, LogOut, UserCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const menuItems = [
    { icon: Menu, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Users, label: 'Student Management', href: '/admin/students' },
    { icon: Users2, label: 'Staff Management', href: '/admin/staff' },
    { icon: DollarSign, label: 'Fee Collection', href: '/admin/fee' },
    { icon: UserCheck, label: 'Student Attendance', href: '/admin/student-attendance' },
    { icon: Calendar, label: 'Staff Attendance', href: '/admin/staff-attendance' },
    { icon: BookOpen, label: 'Library', href: '/admin/library' },
    { icon: Award, label: 'Certificates', href: '/admin/certificates' },
    { icon: Video, label: 'Live Classes', href: '/admin/classes' },
    { icon: Users, label: 'Front Office', href: '/admin/office' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' }
  ]

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?')
    if (!confirmed) return
    logout() // clears state + localStorage
    navigate('/', { replace: true })
    onClose?.()
  }

  const handleNavigation = (href) => {
    navigate(href)
    if (onClose) onClose() // Close sidebar on mobile after navigation
  }

  return (
    <>
      <div className={`fixed top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/images/finvision-logo.png" 
                alt="Finvision CRM Logo" 
                className="w-16 h-16"
              />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  FINVISION CRM
                </h1>
                <p className="text-xs text-gray-500">Institute Management</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full sidebar-link flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-6 border-t border-gray-100 mt-auto">
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center gap-3 p-4 text-left rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-gray-700"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={onClose}
        />
      )}
    </>
  )
}

export default Sidebar
