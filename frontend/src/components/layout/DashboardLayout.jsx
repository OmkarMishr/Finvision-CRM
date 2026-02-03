import { Outlet } from 'react-router-dom'
import Sidebar from '../layout/Sidebar'
import Navbar from '../layout/Navbar'
import { useState } from 'react'

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Toggle */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-lg lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="lg:ml-72">
        <Navbar />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
