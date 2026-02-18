import { 
  LayoutDashboard, Users, DollarSign, Calendar, BookOpen, 
  Award, Video, Users2, Settings, LogOut, UserCheck, 
  ClipboardCheck, BarChart3, Building2, FileText, TrendingUp
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const menuGroups = [
    {
      groupLabel: 'Overview',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard',         href: '/dashboard' },
        { icon: BarChart3,       label: 'Analytics',         href: '/admin/analytics' },
      ]
    },
    {
      groupLabel: 'Management',
      items: [
        { icon: TrendingUp, label: 'Lead Management',        href: '/admin/leads' },
        { icon: Users,      label: 'Student Management',     href: '/admin/students' },
        { icon: Users2,     label: 'Staff Management',       href: '/admin/staff' },
        { icon: Building2,  label: 'Front Office',           href: '/admin/office' },
      ]
    },
    {
      groupLabel: 'Finance',
      items: [
        { icon: DollarSign, label: 'Fee Collection',         href: '/admin/fee' },
      ]
    },
    {
      groupLabel: 'Attendance',
      items: [
        { icon: UserCheck,     label: 'Student Attendance',  href: '/admin/student-attendance' },
        { icon: ClipboardCheck, label: 'Staff Attendance',   href: '/admin/staff-attendance' },
      ]
    },
    {
      groupLabel: 'Academic',
      items: [
        { icon: Video,     label: 'Live Classes',            href: '/admin/classes' },
        { icon: BookOpen,  label: 'Library',                 href: '/admin/library' },
        { icon: Award,     label: 'Certificates',            href: '/admin/certificates' },
      ]
    },
    {
      groupLabel: 'System',
      items: [
        { icon: FileText,  label: 'MIS Reports',             href: '/admin/reports' },
        { icon: Settings,  label: 'Settings',                href: '/admin/settings' },
      ]
    }
  ]

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?')
    if (!confirmed) return
    logout()
    navigate('/', { replace: true })
    onClose?.()
  }

  const handleNavigation = (href) => {
    navigate(href)
    if (onClose) onClose()
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
                <h1 className="text-xl font-bold text-[#1a1a1a]">FINVISION</h1>
                <p className="text-xs text-gray-500">Institute Management</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Group Label */}
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1">
                  {group.groupLabel}
                </p>

                {/* Group Items */}
                <div className="space-y-1">
                  {group.items.map((item, index) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href

                    return (
                      <button
                        key={index}
                        onClick={() => handleNavigation(item.href)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-[#C8294A] text-white shadow-md'
                            : 'hover:bg-[#C8294A]/10 hover:text-[#C8294A] text-gray-600'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-medium">{item.label}</span>
                        {/* Active indicator dot */}
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl hover:bg-[#C8294A]/10 hover:text-[#C8294A] transition-all duration-200 text-gray-600"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">Logout</span>
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
