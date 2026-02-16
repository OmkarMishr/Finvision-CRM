import { Menu, FileText, CreditCard, Calendar, Award, Video, LogOut, GraduationCap, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const StudentSidebar = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const menuItems = [
    { icon: Menu, label: 'Overview', id: 'overview' },
    { icon: User, label: 'View Details', id: 'details' },
    { icon: CreditCard, label: 'Fees', id: 'fees' },
    { icon: Calendar, label: 'Attendance', id: 'attendance' },
    { icon: Award, label: 'Certificate', id: 'certificate' },
    { icon: CreditCard, label: 'ID Card', id: 'idcard' },
    { icon: Video, label: 'Live Classes', id: 'live-classes' }
  ]

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?')
    if (!confirmed) return
    logout()
    navigate('/', { replace: true })
    onClose?.()
  }

  const handleNavigation = (itemId) => {
    setActiveTab(itemId)
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
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  FINVISION CRM
                </h1>
                <p className="text-xs text-gray-500">Student Portal</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.id)}
                  disabled={item.comingSoon}
                  className={`w-full relative flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                      : item.comingSoon
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium flex-1 text-left">{item.label}</span>
                  
                  
                </button>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-6 border-t border-gray-100">
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

export default StudentSidebar
