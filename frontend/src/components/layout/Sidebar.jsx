import { Menu, Users, DollarSign, Calendar, BookOpen, Award, Video, Users2, Settings, LogOut } from 'lucide-react'

const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { icon: Menu, label: 'Dashboard', href: '/', active: true },
    { icon: Users, label: 'Student Management', href: '/students' },
    { icon: Users2, label: 'Staff Management', href: '/staff' },
    { icon: DollarSign, label: 'Fee Collection', href: '/fee' },
    { icon: Calendar, label: 'Attendance', href: '/attendance' },
    { icon: BookOpen, label: 'Library', href: '/library' },
    { icon: Award, label: 'Certificates', href: '/certificates' },
    { icon: Video, label: 'Live Classes', href: '/classes' },
    { icon: Users, label: 'Front Office', href: '/office' },
    { icon: Settings, label: 'Settings', href: '/settings' }
  ]

  return (
    <div className={`fixed top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
              <img src="/assets/images/finvision-logo.png" alt="Finvision CRM Logo" className="w-16 h-16 "
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
            return (
              <a
                key={index}
                href={item.href}
                className={`sidebar-link flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${item.active
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </a>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-6 border-t border-gray-100 mt-auto">
          <button className="w-full flex items-center gap-3 p-4 text-left rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={onClose}
        />
      )}
    </div>
  )
}

export default Sidebar
