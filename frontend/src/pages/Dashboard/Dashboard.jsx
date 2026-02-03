import { useState } from 'react'
import StatCard from '../../components/dashboard/StatCard'
import WelcomeBanner from '../../components/dashboard/WelcomeBanner'
import Sidebar from '../../components/layout/Sidebar'
import Navbar from '../../components/layout/Navbar'
import { Users, DollarSign, BookOpen, Calendar, GraduationCap } from 'lucide-react'

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const stats = [
    { title: 'Total Students', value: '1,234', change: '+12%', trend: 'up', color: 'blue' },
    { title: 'Total Staff', value: '45', change: '+2%', trend: 'up', color: 'green' },
    { title: 'Total Fees Collected', value: '₹5,42,000', change: '+8%', trend: 'up', color: 'purple' },
    { title: 'Today Attendance', value: '95%', change: '+2%', trend: 'up', color: 'orange' }
  ]

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

      <div className="lg:ml-72">
        {/* Navbar */}
        <Navbar />

        <div className="p-6 lg:p-8 space-y-8">
          {/* Welcome Banner */}
          <WelcomeBanner />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Charts & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 card p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Revenue Overview</h3>
                <select className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500">
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>Last year</option>
                </select>
              </div>
              <div className="h-80 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-40" />
                  <p>Revenue chart will be here</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-8 space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-4 hover:bg-blue-50 rounded-xl transition-all group">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-left">Add New Student</span>
                </button>
                <button className="w-full flex items-center gap-3 p-4 hover:bg-green-50 rounded-xl transition-all group">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium text-left">Record Fee Payment</span>
                </button>
                <button className="w-full flex items-center gap-3 p-4 hover:bg-purple-50 rounded-xl transition-all group">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium text-left">Mark Attendance</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
