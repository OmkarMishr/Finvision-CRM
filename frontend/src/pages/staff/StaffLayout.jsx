import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu, Bell }          from 'lucide-react'
import { useAuth }             from '../../context/AuthContext'
import StaffSidebar            from '../../components/layout/StaffSidebar'

const StaffLayout = () => {
  const { user }                      = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <StaffSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 lg:ml-72">

        {/* ── Shared Top Header ── */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">

              <div className="flex items-center gap-4">
                {/* Hamburger — mobile only */}
                <button onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Menu className="w-6 h-6 text-gray-700" />
                </button>
                <img src="/assets/images/finvision-logo.png" alt="Logo"
                  className="h-10 w-10 object-contain" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {user?.staffRole === 'counselor' ? 'Counselor Portal' : 'Telecaller Portal'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleDateString('en-IN', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>
                <div className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#C8294A] to-[#a01f39] rounded-full
                    flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.[0] || 'S'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'Staff'}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.staffRole || 'Staff'}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </header>

        {/* ── Page Content (each route renders here) ── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>

      </div>
    </>
  )
}

export default StaffLayout
