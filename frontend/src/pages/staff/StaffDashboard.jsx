import { useState, useEffect } from 'react'
import { Users, CheckCircle, XCircle, TrendingUp, Menu, Bell,UserPlus, PhoneCall, MessageSquare, Calendar, DollarSign,Filter, Download, FileSpreadsheet, MapPin, Clock, AlertCircle,LogOut as LogOutIcon} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/layout/Sidebar'
import TelecallerView from '../../components/staff/TelecallerView'
import CounselorView from '../../components/staff/CounselorView'
import axiosInstance from '../../config/axios'
import { API_ENDPOINTS } from '../../config/api'


const StaffDashboard = () => {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState('telecaller')
  const [stats, setStats] = useState({
    totalLeads: 0,
    freeLeads: 0,
    paidLeads: 0,
    conversions: 0,
    revenue: 0
  })
  const [loading, setLoading] = useState(true)

  // Attendance state
  const [attendanceStatus, setAttendanceStatus] = useState(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [attendanceMessage, setAttendanceMessage] = useState(null)
  const [attendanceError, setAttendanceError] = useState(null)
  const [locationInfo, setLocationInfo] = useState(null)


  useEffect(() => {
    fetchStats()
    fetchTodayAttendance() 
  }, [])


  const fetchStats = async () => {
    try {
      setLoading(true)
      
      const response = await axiosInstance.get(API_ENDPOINTS.leads.stats)
      const data = response.data.data || response.data.stats || response.data || {}
      const byBatchType = data.byBatchType || {}
      const freeCount = byBatchType['Free'] || byBatchType['free'] || 0
      const paidCount = byBatchType['Paid'] || byBatchType['paid'] || 0
      
      const totalLeads = data.totalLeads || 0
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


  // Fetch today's attendance status
  const fetchTodayAttendance = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.staffAttendance.today)
      
      if (response.data.success) {
        setAttendanceStatus(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error)
    }
  }


  // Check-in with geolocation
  const handleCheckIn = async () => {
    try {
      setCheckingIn(true)
      setAttendanceMessage(null)
      setAttendanceError(null)
      setLocationInfo(null)

      if (!navigator.geolocation) {
        setAttendanceError('Geolocation is not supported by your browser')
        setCheckingIn(false)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            const response = await axiosInstance.post(API_ENDPOINTS.staffAttendance.checkIn, {
              latitude,
              longitude
            })

            setAttendanceMessage(response.data.message || 'Checked in successfully!')
            
            if (response.data.locationInfo) {
              setLocationInfo(response.data.locationInfo)
            }

            // Refresh attendance status
            fetchTodayAttendance()
          } catch (error) {
            console.error('❌ Check-in error:', error)

            if (error.response?.status === 400) {
              setAttendanceError(error.response.data.message)
            } else if (error.response?.status === 403) {
              setAttendanceError(error.response.data.message)
            } else {
              setAttendanceError('Failed to check in. Please try again.')
            }
          } finally {
            setCheckingIn(false)
          }
        },
        (error) => {
          setCheckingIn(false)

          switch (error.code) {
            case error.PERMISSION_DENIED:
              setAttendanceError('Location permission denied. Please enable location access.')
              break
            case error.POSITION_UNAVAILABLE:
              setAttendanceError('Location unavailable. Please check GPS/WiFi.')
              break
            case error.TIMEOUT:
              setAttendanceError('Location request timed out. Please try again.')
              break
            default:
              setAttendanceError('Unable to get location. Please try again.')
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      setAttendanceError('An unexpected error occurred.')
      setCheckingIn(false)
    }
  }


  // Check-out with geolocation
  const handleCheckOut = async () => {
    try {
      setCheckingOut(true)
      setAttendanceMessage(null)
      setAttendanceError(null)
      setLocationInfo(null)

      if (!navigator.geolocation) {
        setAttendanceError('Geolocation is not supported by your browser')
        setCheckingOut(false)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            const response = await axiosInstance.post(API_ENDPOINTS.staffAttendance.checkOut, {
              latitude,
              longitude
            })

            setAttendanceMessage(response.data.message || 'Checked out successfully!')
            
            if (response.data.locationInfo) {
              setLocationInfo(response.data.locationInfo)
            }
            // Refresh attendance status
            fetchTodayAttendance()
          } catch (error) {
            console.error('❌ Check-out error:', error)

            if (error.response?.status === 400) {
              setAttendanceError(error.response.data.message)
            } else if (error.response?.status === 403) {
              setAttendanceError(error.response.data.message)
            } else {
              setAttendanceError('Failed to check out. Please try again.')
            }
          } finally {
            setCheckingOut(false)
          }
        },
        (error) => {
          setCheckingOut(false)

          switch (error.code) {
            case error.PERMISSION_DENIED:
              setAttendanceError('Location permission denied.')
              break
            case error.POSITION_UNAVAILABLE:
              setAttendanceError('Location unavailable.')
              break
            case error.TIMEOUT:
              setAttendanceError('Location request timed out.')
              break
            default:
              setAttendanceError('Unable to get location.')
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } catch (error) {
      setAttendanceError('An unexpected error occurred.')
      setCheckingOut(false)
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
          {/* Attendance  Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-lg mb-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left: Status Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Today's Attendance</h3>
                    <p className="text-sm text-gray-600">
                      {new Date().toLocaleDateString('en-IN', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long'
                      })}
                    </p>
                  </div>
                </div>

                {/* Location requirement info */}
                <div className="flex items-start gap-2 text-green-700 bg-green-100 border border-green-300 px-4 py-3 rounded-xl text-sm mb-3">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Location Required</p>
                    <p className="text-xs text-green-600">
                      You must be at the institute premises (within 200m) to check in/out.
                    </p>
                  </div>
                </div>

                {/* Current status */}
                {attendanceStatus && (
                  <div className="bg-white rounded-xl p-4 shadow-sm mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Check-in:</span>
                      <span className="text-sm font-semibold text-green-600">
                        {new Date(attendanceStatus.checkInTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {attendanceStatus.checkOutTime && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Check-out:</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {new Date(attendanceStatus.checkOutTime).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Working Hours:</span>
                          <span className="text-sm font-semibold text-purple-600">
                            {attendanceStatus.workingHours}h
                          </span>
                        </div>
                      </>
                    )}
                    {attendanceStatus.isLate && (
                      <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        Late by {attendanceStatus.lateByMinutes} minutes
                      </div>
                    )}
                  </div>
                )}

                {/* Success/Error Messages */}
                {attendanceMessage && (
                  <div className="flex items-start gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl text-sm mb-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{attendanceMessage}</p>
                      {locationInfo && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ At {locationInfo.branch} ({locationInfo.distance}m away)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {attendanceError && (
                  <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-sm mb-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="font-medium">{attendanceError}</p>
                  </div>
                )}
              </div>

              {/* Right: Action Buttons */}
              <div className="flex flex-col gap-3 w-full lg:w-auto">
                {!attendanceStatus && (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all ${
                      checkingIn
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl transform hover:-translate-y-0.5'
                    }`}
                  >
                    {checkingIn ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Getting Location...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5" />
                        <span>Check In</span>
                      </>
                    )}
                  </button>
                )}

                {attendanceStatus && !attendanceStatus.checkOutTime && (
                  <button
                    onClick={handleCheckOut}
                    disabled={checkingOut}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all ${
                      checkingOut
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transform hover:-translate-y-0.5'
                    }`}
                  >
                    {checkingOut ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Getting Location...</span>
                      </>
                    ) : (
                      <>
                        <LogOutIcon className="w-5 h-5" />
                        <span>Check Out</span>
                      </>
                    )}
                  </button>
                )}

                {attendanceStatus && attendanceStatus.checkOutTime && (
                  <div className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-xl font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    <span>Completed for Today</span>
                  </div>
                )}
              </div>
            </div>
          </div>

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
