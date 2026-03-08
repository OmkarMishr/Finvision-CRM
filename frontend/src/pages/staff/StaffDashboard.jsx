import { useState, useEffect } from 'react'
import {
  Users, CheckCircle, TrendingUp, UserPlus,
  DollarSign, PhoneCall, MessageSquare
} from 'lucide-react'
import { useAuth }        from '../../context/AuthContext'
import TelecallerView     from '../../components/staff/TelecallerView'
import CounselorView      from '../../components/staff/CounselorView'
import axiosInstance      from '../../config/axios'
import { API_ENDPOINTS }  from '../../config/api'

const StaffDashboard = () => {
  const { user }              = useAuth()
  const [activeView, setActiveView] = useState('telecaller')
  const [stats,      setStats]      = useState({
    totalLeads: 0, freeLeads: 0, paidLeads: 0, conversions: 0, revenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  useEffect(() => {
    if (user?.staffRole === 'counselor') setActiveView('counselor')
    else                                  setActiveView('telecaller')
  }, [user])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res     = await axiosInstance.get(API_ENDPOINTS.leads.stats)
      const data    = res.data.data || res.data.stats || res.data || {}
      const byBatch = data.byBatchType || {}
      setStats({
        totalLeads:  data.totalLeads     || 0,
        freeLeads:   byBatch['Free']     || byBatch['free'] || 0,
        paidLeads:   byBatch['Paid']     || byBatch['paid'] || 0,
        conversions: data.totalConverted || 0,
        revenue:     data.totalRevenue   || 0,
      })
    } catch {
      setStats({ totalLeads: 0, freeLeads: 0, paidLeads: 0, conversions: 0, revenue: 0 })
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    { label: 'Total Leads', value: stats.totalLeads,                     color: 'bg-blue-500',   icon: Users       },
    { label: 'Free Batch',  value: stats.freeLeads,                      color: 'bg-orange-500', icon: UserPlus    },
    { label: 'Paid Batch',  value: stats.paidLeads,                      color: 'bg-green-500',  icon: CheckCircle },
    { label: 'Conversions', value: stats.conversions,                    color: 'bg-purple-500', icon: TrendingUp  },
    { label: 'Revenue',     value: `₹${stats.revenue.toLocaleString()}`, color: 'bg-indigo-500', icon: DollarSign  },
  ]

  return (
    <div className="space-y-8">

      {/* ── Welcome Banner ── */}
      <div className="bg-gradient-to-r from-[#C8294A] to-[#a01f39] rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-1">
          Welcome back, {user?.name?.split(' ')[0] || 'Staff'} 
        </h2>
        <p className="text-white/75 text-sm">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium capitalize">
            {user?.staffRole || 'Staff'} Role
          </span>
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i}
              className="bg-white rounded-2xl p-5 shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center shadow mb-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-gray-500 text-xs font-medium mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">
                {loading ? (
                  <span className="inline-block w-12 h-7 bg-gray-100 rounded animate-pulse" />
                ) : stat.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── Role Switcher — only if both roles ── */}
      {user?.staffRole === 'both' && (
        <div className="bg-white rounded-2xl shadow p-2 inline-flex gap-2">
          <button onClick={() => setActiveView('telecaller')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeView === 'telecaller'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <PhoneCall className="w-4 h-4 inline-block mr-2" />
            Telecaller View
          </button>
          <button onClick={() => setActiveView('counselor')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeView === 'counselor'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <MessageSquare className="w-4 h-4 inline-block mr-2" />
            Counselor View
          </button>
        </div>
      )}

      {/* ── Telecaller / Counselor View ── */}
      {activeView === 'telecaller'
        ? <TelecallerView onStatsUpdate={fetchStats} />
        : <CounselorView  onStatsUpdate={fetchStats} />
      }
    </div>
  )
}

export default StaffDashboard
