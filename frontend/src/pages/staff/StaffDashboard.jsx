import { useState, useEffect } from 'react'
import { Users, CheckCircle, XCircle, TrendingUp, Menu, Bell,
  UserPlus, PhoneCall, MessageSquare, Calendar, DollarSign,
  Filter, Download, FileSpreadsheet
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/layout/Sidebar'
import TelecallerView from '../../components/staff/TelecallerView'
import CounselorView from '../../components/staff/CounselorView'
import axiosInstance from '../../config/axios'
import { API_ENDPOINTS } from '../../config/api'

const StaffDashboard = () => {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState('telecaller') // telecaller or counselor
  const [stats, setStats] = useState({
    totalLeads: 0,
    freeLeads: 0,
    paidLeads: 0,
    conversions: 0,
    revenue: 0
  })
  const [loading, setLoading] = useState(true)

  // Fetch lead stats
  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      const response = await axiosInstance.get(API_ENDPOINTS.leads.stats)
      const data = response.data.data || response.data.stats || response.data || {}
  
      const byBatchType = data.byBatchType || {}
      const freeCount = byBatchType['Free'] || byBatchType['free'] || 0
      const paidCount = byBatchType['Paid'] || byBatchType['paid'] || 0
      
      // Total leads from backend
      const totalLeads = data.totalLeads || 0
      
      // Conversions and revenue
      const totalConverted = data.totalConverted || 0
      const totalRev = data.totalRevenue || 0
  
      const statsData = {
        totalLeads: totalLeads,
        freeLeads: freeCount,
        paidLeads: paidCount,
        conversions: totalConverted,
        revenue: totalRev
      }
      setStats(statsData)
    } catch (error) {
      console.error('❌ Error fetching staff stats:', error)
      console.error('❌ Error response:', error.response?.data)
      
      // Set default values on error
      setStats({
        totalLeads: 0,
        freeLeads: 0,
        paidLeads: 0,
        conversions: 0,
        revenue: 0
      })
    } finally {
      setLoading(false)
    }
  }

  // Determine which view to show based on staff role
  useEffect(() => {
    if (user?.staffRole === 'counselor') {
      setActiveView('counselor')
    } else {
      setActiveView('telecaller')
    }
  }, [user])

  const statsCards = [
    { 
      label: 'Total Leads', 
      value: stats.totalLeads, 
      color: 'bg-blue-500', 
      icon: Users 
    },
    { 
      label: 'Free Batch', 
      value: stats.freeLeads, 
      color: 'bg-orange-500', 
      icon: UserPlus 
    },
    { 
      label: 'Paid Batch', 
      value: stats.paidLeads, 
      color: 'bg-green-500', 
      icon: CheckCircle 
    },
    { 
      label: 'Conversions', 
      value: stats.conversions, 
      color: 'bg-purple-500', 
      icon: TrendingUp 
    },
    { 
      label: 'Revenue', 
      value: `₹${stats.revenue.toLocaleString()}`, 
      color: 'bg-indigo-500', 
      icon: DollarSign 
    }
  ]

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ml-72">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu className="w-6 h-6 text-gray-700" />
                </button>

                <img 
                  src="/assets/images/finvision-logo.png" 
                  alt="Logo" 
                  className="h-10 w-10 object-contain" 
                />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {user?.staffRole === 'counselor' ? 'Counselor Portal' : 'Telecaller Portal'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleDateString('en-IN', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.[0] || 'S'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'Staff'}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.staffRole || 'Staff'}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div 
                  key={index} 
                  className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs font-medium mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stat.value}</p>
                </div>
              )
            })}
          </div>

          {/* Tab Switcher (if staff has both roles) */}
          {user?.staffRole === 'both' && (
            <div className="bg-white rounded-2xl shadow-lg p-2 mb-6 inline-flex gap-2">
              <button
                onClick={() => setActiveView('telecaller')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                  activeView === 'telecaller'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <PhoneCall className="w-4 h-4 inline-block mr-2" />
                Telecaller View
              </button>
              <button
                onClick={() => setActiveView('counselor')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                  activeView === 'counselor'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline-block mr-2" />
                Counselor View
              </button>
            </div>
          )}

          {/* Dynamic View */}
          {activeView === 'telecaller' ? (
            <TelecallerView onStatsUpdate={fetchStats} />
          ) : (
            <CounselorView onStatsUpdate={fetchStats} />
          )}
        </div>
      </div>
    </>
  )
}

export default StaffDashboard
