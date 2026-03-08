import {
    LayoutDashboard, TrendingUp, UserCheck, ClipboardList,
    LogOut, CalendarDays, Bell, ChevronDown, ChevronUp,
    PhoneCall, MessageSquare, Clock, FileText,
    User
  } from 'lucide-react'
  import { useAuth } from '../../context/AuthContext'
  import { useNavigate, useLocation } from 'react-router-dom'
  import { useState } from 'react'
  
  const StaffSidebar = ({ isOpen, onClose }) => {
    const navigate         = useNavigate()
    const location         = useLocation()
    const { logout, user } = useAuth()
  
    const menuGroups = [
      {
        groupLabel: 'Overview',
        items: [
          { icon: LayoutDashboard, label: 'Dashboard',        href: '/staff/dashboard'        },
        ],
      },
      {
        groupLabel: 'Leads',
        items: [
          { icon: TrendingUp,      label: 'Lead Management',  href: '/staff/leads'            },
        ],
      },
      {
        groupLabel: 'Attendance',
        items: [
          { icon: UserCheck,       label: 'Mark Attendance',  href: '/staff/attendance'       },
          { icon: Clock,           label: 'Attendance Log',   href: '/staff/attendance/log'   },
        ],
      },
      {
        groupLabel: 'Leave',
        items: [
          { icon: CalendarDays,    label: 'Apply for Leave',  href: '/staff/leave/apply'      },
        ],
      },
      {
        groupLabel: 'Reports',
        items: [
          { icon: FileText,        label: 'My Reports',       href: '/staff/reports'          },
        ],
      },
    ]
  
    const handleNav = (href) => {
      navigate(href)
      onClose?.()
    }
  
    const handleLogout = () => {
      if (!window.confirm('Are you sure you want to logout?')) return
      logout()
      navigate('/', { replace: true })
      onClose?.()
    }
  
    const isActive = (href) => location.pathname === href
  
    return (
      <>
        <aside className={`fixed top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-100
          flex flex-col transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
  
          {/* Logo */}
          <div className="p-6 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
              <img src="/assets/images/finvision-logo.png" alt="Finvision"
                className="w-14 h-14 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-[#1a1a1a]">FINVISION</h1>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.staffRole || 'Staff'} Portal
                </p>
              </div>
            </div>
          </div>
  
  
          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-5 mt-2">
            {menuGroups.map((group, gi) => (
              <div key={gi}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1.5">
                  {group.groupLabel}
                </p>
                <div className="space-y-1">
                  {group.items.map((item, ii) => {
                    const Icon   = item.icon
                    const active = isActive(item.href)
                    return (
                      <button key={ii} onClick={() => handleNav(item.href)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                          transition-all duration-200
                          ${active
                            ? 'bg-[#C8294A] text-white shadow-md'
                            : 'text-gray-600 hover:bg-[#C8294A]/10 hover:text-[#C8294A]'
                          }`}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-medium">{item.label}</span>
                        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
  
          {/* Logout */}
          <div className="p-4 border-t border-gray-100 shrink-0">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600
                hover:bg-[#C8294A]/10 hover:text-[#C8294A] transition-all duration-200">
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </aside>
  
        {/* Mobile backdrop */}
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 lg:hidden z-40" onClick={onClose} />
        )}
      </>
    )
  }
  
  export default StaffSidebar
  