import { useState, useEffect } from 'react'
import {
  MapPin, Clock, CheckCircle, AlertCircle, LogOut as LogOutIcon,
  Calendar, TrendingUp, RefreshCw, Navigation,
  Building2
} from 'lucide-react'
import axiosInstance     from '../../config/axios'
import { API_ENDPOINTS } from '../../config/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (iso, opts) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', opts) : '—'

const StatusBadge = ({ status }) => {
  const map = {
    present: { cls: 'bg-green-100 text-green-700',   label: 'Present'  },
    absent:  { cls: 'bg-red-100   text-red-700',     label: 'Absent'   },
    late:    { cls: 'bg-orange-100 text-orange-700', label: 'Late'     },
    half:    { cls: 'bg-yellow-100 text-yellow-700', label: 'Half Day' },
  }
  const cfg = map[status?.toLowerCase()] || { cls: 'bg-gray-100 text-gray-600', label: status || '—' }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ─── Live Clock ───────────────────────────────────────────────────────────────
const LiveClock = () => {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="text-center">
      <p className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1a1a1a] tabular-nums tracking-tight">
        {time.toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        })}
      </p>
      <p className="text-sm text-gray-500 mt-2">
        {time.toLocaleDateString('en-IN', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })}
      </p>
    </div>
  )
}

// ─── Working Hours Bar ────────────────────────────────────────────────────────
const WorkingHoursBar = ({ checkIn, checkOut }) => {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    if (checkOut) return
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [checkOut])

  if (!checkIn) return null
  const end    = checkOut ? new Date(checkOut) : now
  const diffMs = Math.max(end - new Date(checkIn), 0)
  const hours  = Math.floor(diffMs / 3600000)
  const mins   = Math.floor((diffMs % 3600000) / 60000)
  const pct    = Math.min((hours / 8) * 100, 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">Working Hours</span>
        <span className="font-bold text-[#1a1a1a] tabular-nums">
          {hours}h {mins}m{' '}
          {!checkOut && <span className="text-xs text-gray-400 font-normal">(live)</span>}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-[#C8294A]' : 'bg-orange-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>0h</span>
        <span>{Math.round(pct)}% of 8h target</span>
        <span>8h</span>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const MarkAttendance = () => {
  const [attendance,  setAttendance]  = useState(null)
  const [checkingIn,  setCheckingIn]  = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [message,     setMessage]     = useState(null)   // { type, text }
  const [locationInfo,setLocationInfo]= useState(null)
  const [gpsStatus,   setGpsStatus]   = useState('idle') // idle|fetching|ok|denied
  const [refreshing,  setRefreshing]  = useState(false)

  const GEO_ERRORS = {
    1: 'Location permission denied. Please allow it in your browser settings.',
    2: 'Location unavailable. Check your GPS or WiFi.',
    3: 'Location request timed out. Please try again.',
  }
  const GEO_OPTIONS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }

  const fetchTodayAttendance = async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.staffAttendance.today)
      setAttendance(res.data.success ? res.data.data : null)
    } catch { setAttendance(null) }
    finally  { setRefreshing(false) }
  }

  useEffect(() => { fetchTodayAttendance() }, [])

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 5000)
    return () => clearTimeout(t)
  }, [message])

  const doWithLocation = (endpoint, setLoading, successMsg) => {
    setLoading(true); setMessage(null); setLocationInfo(null); setGpsStatus('fetching')
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Geolocation not supported by your browser.' })
      setLoading(false); setGpsStatus('denied'); return
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        setGpsStatus('ok')
        try {
          const res = await axiosInstance.post(endpoint, { latitude, longitude })
          setMessage({ type: 'success', text: res.data.message || successMsg })
          if (res.data.locationInfo) setLocationInfo(res.data.locationInfo)
          fetchTodayAttendance(true)
        } catch (e) {
          setMessage({ type: 'error', text: e.response?.data?.message || 'Request failed.' })
        } finally { setLoading(false) }
      },
      (e) => {
        setGpsStatus('denied')
        setMessage({ type: 'error', text: GEO_ERRORS[e.code] || 'Unable to get location.' })
        setLoading(false)
      },
      GEO_OPTIONS
    )
  }

  const handleCheckIn  = () => doWithLocation(API_ENDPOINTS.staffAttendance.checkIn,  setCheckingIn,  'Checked in successfully!')
  const handleCheckOut = () => doWithLocation(API_ENDPOINTS.staffAttendance.checkOut, setCheckingOut, 'Checked out successfully!')

  const hasCheckedIn  = !!attendance?.checkInTime
  const hasCheckedOut = !!attendance?.checkOutTime
  const isCompleted   = hasCheckedIn && hasCheckedOut
  const isLoading     = checkingIn || checkingOut

  return (
    <div className="space-y-6">

      {/* ── Page Title ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">Mark Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">Check in and out from the institute premises</p>
      </div>

      {/* ══════════════════════════════════════════════════
          DESKTOP: 2-column   MOBILE: stacked
      ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-5">

          {/* Clock Card */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-8 flex flex-col items-center justify-center gap-4">
            <LiveClock />

            {/* GPS pill */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border ${
              gpsStatus === 'ok'       ? 'bg-green-50  border-green-200  text-green-700'  :
              gpsStatus === 'fetching' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
              gpsStatus === 'denied'   ? 'bg-red-50    border-red-200    text-red-700'    :
                                        'bg-gray-50    border-gray-200   text-gray-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                gpsStatus === 'ok'       ? 'bg-green-500 animate-none'    :
                gpsStatus === 'fetching' ? 'bg-yellow-500 animate-pulse'  :
                gpsStatus === 'denied'   ? 'bg-red-500'                   :
                                          'bg-gray-300 animate-pulse'
              }`} />
              {gpsStatus === 'ok'       ? 'GPS Active'         :
               gpsStatus === 'fetching' ? 'Fetching location…' :
               gpsStatus === 'denied'   ? 'GPS Unavailable'    : 'GPS Idle'}
            </div>
          </div>

          {/* Location Notice */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 px-4 py-4 rounded-2xl">
            <Building2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800 text-sm">Location Verification Required</p>
              <p className="text-blue-600 text-xs mt-1 leading-relaxed">
                You must be within <strong>200 metres</strong> of the institute premises.
                Ensure location permission is enabled in your browser.
              </p>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
            <h3 className="font-bold text-[#1a1a1a] mb-4 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-[#C8294A]" />
              Attendance Guidelines
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
              {[
                { icon: Clock,color: 'text-blue-500', bg: 'bg-blue-50',   text: 'Office hours: 10:00 AM – 6:00 PM'      },
                { icon: AlertCircle,color: 'text-orange-500', bg: 'bg-orange-50', text: 'Check-in after 10:30 AM is marked Late' },
                { icon: MapPin,      color: 'text-green-500',  bg: 'bg-green-50',  text: 'Must be within 200m of institute'           },
                { icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-50', text: 'Always check out before leaving office'     },
              ].map(({ icon: Icon, color, bg, text }, i) => (
                <div key={i} className={`flex items-center gap-3 ${bg} px-4 py-3 rounded-xl`}>
                  <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                  <p className="text-sm text-gray-700">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-5">

          {/* Today's Record Card */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">

            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#C8294A]/10 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#C8294A]" />
                </div>
                <div>
                  <h2 className="font-bold text-[#1a1a1a] text-sm sm:text-base">Today's Record</h2>
                  <p className="text-xs text-gray-400">
                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {attendance && <StatusBadge status={attendance.status} />}
                <button
                  onClick={() => fetchTodayAttendance()} disabled={refreshing}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-gray-700"
                  title="Refresh">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-6">

              {/* Check-in / Check-out tiles */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Check-in */}
                <div className={`rounded-2xl p-4 sm:p-5 border-2 transition-colors ${
                  hasCheckedIn
                    ? 'border-green-200 bg-green-50'
                    : 'border-dashed border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
                      hasCheckedIn ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Check In
                    </span>
                  </div>
                  <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${
                    hasCheckedIn ? 'text-green-700' : 'text-gray-300'
                  }`}>
                    {hasCheckedIn
                      ? fmt(attendance.checkInTime, { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </p>
                  {attendance?.isLate && (
                    <p className="text-xs text-orange-600 mt-1.5 font-medium">
                      ⚠ Late by {attendance.lateByMinutes}m
                    </p>
                  )}
                  {hasCheckedIn && !attendance?.isLate && (
                    <p className="text-xs text-green-600 mt-1.5 font-medium">✓ On time</p>
                  )}
                </div>

                {/* Check-out */}
                <div className={`rounded-2xl p-4 sm:p-5 border-2 transition-colors ${
                  hasCheckedOut
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-dashed border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
                      hasCheckedOut ? 'bg-blue-500' : 'bg-gray-300'
                    }`}>
                      <LogOutIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Check Out
                    </span>
                  </div>
                  <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${
                    hasCheckedOut ? 'text-blue-700' : 'text-gray-300'
                  }`}>
                    {hasCheckedOut
                      ? fmt(attendance.checkOutTime, { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </p>
                  {hasCheckedOut && (
                    <p className="text-xs text-blue-600 mt-1.5 font-medium">✓ Checked out</p>
                  )}
                </div>
              </div>

              {/* Working Hours Bar */}
              {hasCheckedIn && (
                <WorkingHoursBar
                  checkIn={attendance.checkInTime}
                  checkOut={attendance.checkOutTime}
                />
              )}

              {/* Location verified banner */}
              {locationInfo && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl">
                  <Navigation className="w-4 h-4 shrink-0" />
                  <span>
                    Verified at <strong>{locationInfo.branch}</strong> · {locationInfo.distance}m from office
                  </span>
                </div>
              )}

              {/* Success / Error toast */}
              {message && (
                <div className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm border ${
                  message.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50   border-red-200   text-red-800'
                }`}>
                  {message.type === 'success'
                    ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  }
                  <p className="font-medium leading-snug">{message.text}</p>
                </div>
              )}

              {/* ── CTA Button ── */}
              <div className="pt-1">

                {/* Not checked in */}
                {!hasCheckedIn && (
                  <button
                    onClick={handleCheckIn} disabled={isLoading}
                    className={`w-full flex items-center justify-center gap-3 py-4 sm:py-5 rounded-2xl
                      text-white font-bold text-base sm:text-lg shadow-lg transition-all ${
                      isLoading
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl active:scale-[0.98]'
                    }`}>
                    {checkingIn
                      ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Getting Location…</>
                      : <><MapPin className="w-5 h-5" /> Check In Now</>
                    }
                  </button>
                )}

                {/* Checked in, not out */}
                {hasCheckedIn && !hasCheckedOut && (
                  <button
                    onClick={handleCheckOut} disabled={isLoading}
                    className={`w-full flex items-center justify-center gap-3 py-4 sm:py-5 rounded-2xl
                      text-white font-bold text-base sm:text-lg shadow-lg transition-all ${
                      isLoading
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#C8294A] to-[#a01f39] hover:from-[#a01f39] hover:to-[#8a1830] hover:shadow-xl active:scale-[0.98]'
                    }`}>
                    {checkingOut
                      ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Getting Location…</>
                      : <><LogOutIcon className="w-5 h-5" /> Check Out Now</>
                    }
                  </button>
                )}

                {/* Completed */}
                {isCompleted && (
                  <div className="w-full flex items-center justify-center gap-3 py-4 sm:py-5
                    bg-green-100 text-green-700 rounded-2xl font-bold text-base sm:text-lg
                    border-2 border-green-200">
                    <CheckCircle className="w-6 h-6" />
                    Attendance Completed for Today
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
        {/* END RIGHT COLUMN */}
      </div>
    </div>
  )
}

export default MarkAttendance
