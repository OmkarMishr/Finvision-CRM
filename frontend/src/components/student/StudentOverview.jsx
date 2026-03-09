import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  DollarSign,
  BookOpen,
  Award,
  Clock,
  Bell,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react'
import axiosInstance     from '../../config/axios'
import { API_ENDPOINTS } from '../../config/api'

// ─── Safe number helper ────────────────────────────────────────────────────────
const safeNum = (n) => parseFloat(n) || 0
const fmtRs   = (n) => `₹${safeNum(n).toLocaleString('en-IN')}`
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit'
      })
    : 'Not scheduled'

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
)

// ══════════════════════════════════════════════════════════════════════════════
const StudentOverview = () => {
  const [profile,     setProfile]     = useState(null)
  const [feeData,     setFeeData]     = useState(null)
  const [attendance,  setAttendance]  = useState(null)
  const [liveClasses, setLiveClasses] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  // ── Get student ID from localStorage ──────────────────────────────────
  const getStudentId = () => {
    const KEYS = ['fv_user', 'user', 'authUser', 'currentUser', 'student', 'auth']
    for (const key of KEYS) {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        const parsed = JSON.parse(raw)
        const u = parsed?.user || parsed?.data || parsed
        if (u?._id || u?.id) return u._id || u.id
      } catch {}
    }
    return null
  }

  // ── Main fetch ─────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true)
    setError('')

    const studentId = getStudentId()
    console.log('[StudentOverview] studentId:', studentId)

    try {
      const profileRes = await axiosInstance.get(
        API_ENDPOINTS.students.myProfile
      )
      const profileData =
        profileRes.data?.data ||
        profileRes.data?.student ||
        profileRes.data || null

      console.log('[StudentOverview] profile:', profileData)
      setProfile(profileData)

      const sid = profileData?._id || studentId

      // fees.pending returns { pendingAmount, totalFee, paidAmount, payments[] }
      // fees.history returns array of payments
      const [feeRes, attendanceRes, liveRes] = await Promise.allSettled([
        sid
          ? axiosInstance.get(API_ENDPOINTS.fees.pending(sid))
          : Promise.resolve(null),
        sid
          ? axiosInstance.get(API_ENDPOINTS.studentAttendance.byStudent(sid))
          : Promise.resolve(null),
        axiosInstance.get(API_ENDPOINTS.liveClasses.student),
      ])

      // ── Fee data ──────────────────────────────────────────────────────
      if (feeRes.status === 'fulfilled' && feeRes.value) {
        const fd =
          feeRes.value.data?.data ||
          feeRes.value.data || {}

        console.log('[StudentOverview] fee raw:', fd)

        
        //    may send: totalFees, paidFees, pendingFees
        setFeeData({
          totalFees:   safeNum(fd.totalFee   || fd.totalFees   || profileData?.totalFee   || 0),
          paidFees:    safeNum(fd.paidAmount  || fd.paidFees    || profileData?.feePaid    || 0),
          pendingFees: safeNum(fd.pendingAmount || fd.pendingFees || profileData?.pendingFee || 0),
        })
      } else {
        // Fallback: use fee fields directly from profile
        setFeeData({
          totalFees:   safeNum(profileData?.totalFee || profileData?.totalFees || 0),
          paidFees:    safeNum(profileData?.feePaid  || profileData?.paidFees  || 0),
          pendingFees: safeNum(profileData?.pendingFee|| profileData?.pendingFees|| 0),
        })
        if (feeRes.status === 'rejected') {
          console.warn('[StudentOverview] fee fetch failed:', feeRes.reason?.message)
        }
      }

      // ── Attendance data ───────────────────────────────────────────────
      if (attendanceRes.status === 'fulfilled' && attendanceRes.value) {
        const ad =
          attendanceRes.value.data?.data       ||
          attendanceRes.value.data?.attendance ||
          attendanceRes.value.data             || []

        console.log('[StudentOverview] attendance raw:', ad)

        
        //    sends { totalClasses, attendedClasses, percentage }
        if (Array.isArray(ad)) {
          const total    = ad.length
          const attended = ad.filter(r =>
            r.status?.toLowerCase() === 'present' ||
            r.isPresent === true
          ).length
          const pct = total > 0 ? Math.round((attended / total) * 100) : 0
          setAttendance({ totalClasses: total, attendedClasses: attended, percentage: pct })
        } else {
          // Object format: { totalClasses, attendedClasses, percentage }
          setAttendance({
            totalClasses:   safeNum(ad.totalClasses   || ad.total    || 0),
            attendedClasses:safeNum(ad.attendedClasses|| ad.attended || 0),
            percentage:     safeNum(ad.percentage     || ad.attendancePercentage || 0),
          })
        }
      } else {
        // Fallback: use attendance fields from profile
        const pct = safeNum(
          profileData?.attendancePercentage ||
          profileData?.attendance?.percentage || 0
        )
        setAttendance({
          totalClasses:    safeNum(profileData?.totalClasses    || 0),
          attendedClasses: safeNum(profileData?.attendedClasses || 0),
          percentage:      pct,
        })
        if (attendanceRes.status === 'rejected') {
          console.warn('[StudentOverview] attendance fetch failed:', attendanceRes.reason?.message)
        }
      }

      // ── Live classes ──────────────────────────────────────────────────
      if (liveRes.status === 'fulfilled' && liveRes.value) {
        const ld =
          liveRes.value.data?.data    ||
          liveRes.value.data?.classes ||
          liveRes.value.data          || []

        console.log('[StudentOverview] live classes raw:', ld)
        // Sort by scheduledAt ascending, filter future only
        const upcoming = (Array.isArray(ld) ? ld : [])
          .filter(c => new Date(c.scheduledAt || c.startTime || c.date) >= new Date())
          .sort((a, b) =>
            new Date(a.scheduledAt || a.startTime || a.date) -
            new Date(b.scheduledAt || b.startTime || b.date)
          )
        setLiveClasses(upcoming)
      } else {
        setLiveClasses([])
      }

    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Failed to load data'
      console.error('[StudentOverview] ', e.response?.status, msg)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // ── Computed values ────────────────────────────────────────────────────
  const feePercent = useMemo(() => {
    if (!feeData || !feeData.totalFees) return 0
    return Math.min(Math.round((feeData.paidFees / feeData.totalFees) * 100), 100)
  }, [feeData])

  const attPercent = attendance?.percentage || 0
  const isEligible = attPercent >= 75

  // ── Next class + upcoming exam from liveClasses ────────────────────────
  const nextClass   = liveClasses[0] || null
  const upcomingExam = liveClasses.find(c =>
    c.type?.toLowerCase() === 'exam' ||
    c.title?.toLowerCase().includes('exam') ||
    c.title?.toLowerCase().includes('test')
  ) || null

  // ─── Loading state ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl p-6 shadow-lg bg-gray-100">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-10 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <Skeleton className="h-6 w-36 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => <Skeleton key={j} className="h-4 w-full" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ─── Error state ────────────────────────────────────────────────────────
  if (error && !profile) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
      <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-red-700">Failed to load overview</p>
        <p className="text-sm text-red-500 mt-0.5">{error}</p>
        <button onClick={fetchAll}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    </div>
  )

  // ─── Batch info from profile ────────────────────────────────────────────
  const batchName    = profile?.batch?.name    || profile?.batchName    || '—'
  const batchType    = profile?.batch?.type    || profile?.batchType    || profile?.isPaid ? 'Paid' : 'Free'
  const batchSection = profile?.batch?.section || profile?.batchSection || profile?.batch?.timing || '—'
  const studentStatus= profile?.status         || profile?.enrollmentStatus || 'Active'

  return (
    <div className="space-y-6">

      {/* Refresh button */}
      <div className="flex justify-end">
        <button onClick={fetchAll}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-600 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Stats Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Attendance */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-100 text-sm font-medium">Attendance</span>
            <TrendingUp className="w-8 h-8 text-blue-200" />
          </div>
          <p className="text-4xl font-bold mb-2 tabular-nums">
            {attendance ? `${attPercent}%` : '—'}
          </p>
          <p className="text-sm text-blue-100">
            {attendance
              ? `${attendance.attendedClasses}/${attendance.totalClasses} Classes`
              : 'Loading…'}
          </p>
        </div>

        {/* Fees Paid */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-green-100 text-sm font-medium">Fees Paid</span>
            <DollarSign className="w-8 h-8 text-green-200" />
          </div>
          <p className="text-3xl font-bold mb-2 tabular-nums">
            {feeData ? fmtRs(feeData.paidFees) : '—'}
          </p>
          <p className="text-sm text-green-100">
            {feeData ? `of ${fmtRs(feeData.totalFees)}` : 'Loading…'}
          </p>
        </div>

        {/* Batch */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-purple-100 text-sm font-medium">Batch Type</span>
            <BookOpen className="w-8 h-8 text-purple-200" />
          </div>
          <p className="text-2xl font-bold mb-2 truncate">{batchType}</p>
          <p className="text-sm text-purple-100 truncate">{batchSection}</p>
        </div>

        {/* Status */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-orange-100 text-sm font-medium">Status</span>
            <Award className="w-8 h-8 text-orange-200" />
          </div>
          <p className="text-2xl font-bold mb-2">{studentStatus}</p>
          <p className="text-sm text-orange-100">
            {batchName !== '—' ? `Batch: ${batchName}` : 'Currently Active'}
          </p>
        </div>
      </div>

      {/* ── Fee Status + Attendance Report ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Fee Status */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-blue-600" />
            Fee Status
          </h2>
          {feeData ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Fees</span>
                <span className="font-semibold text-gray-900">{fmtRs(feeData.totalFees)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Paid</span>
                <span className="font-semibold text-green-600">{fmtRs(feeData.paidFees)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className={`font-semibold ${feeData.pendingFees > 0 ? 'text-red-600' : 'text-green-600'}`}>
               
                  {fmtRs(feeData.pendingFees || Math.max(0, feeData.totalFees - feeData.paidFees))}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${feePercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  {feePercent === 100
                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                    : null
                  }
                  <p className="text-sm text-gray-600 text-center">
                    {feePercent}% Paid
                    {feePercent === 100 ? ' — Fully Cleared ✓' : ''}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          )}
        </div>

        {/* Attendance Report */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-600" />
            Attendance Report
          </h2>
          {attendance ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Classes</span>
                <span className="font-semibold text-gray-900 tabular-nums">
                  {attendance.totalClasses}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Attended</span>
                <span className="font-semibold text-green-600 tabular-nums">
                  {attendance.attendedClasses}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Missed</span>
                <span className="font-semibold text-red-500 tabular-nums">
                  {Math.max(0, attendance.totalClasses - attendance.attendedClasses)}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      isEligible
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                    style={{ width: `${Math.min(attPercent, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  {isEligible
                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                    : <AlertCircle className="w-4 h-4 text-red-500" />
                  }
                  <p className={`text-sm font-medium ${isEligible ? 'text-green-600' : 'text-red-500'}`}>
                    {isEligible ? 'Eligible for Certificate' : `Need ${75 - attPercent}% more for Certificate`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming Events ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-6 h-6 text-orange-600" />
          Upcoming Events
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">

            {/* Next Class */}
            <div className={`flex items-center gap-4 p-4 rounded-xl border ${
              nextClass ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <Clock className={`w-8 h-8 shrink-0 ${nextClass ? 'text-blue-600' : 'text-gray-300'}`} />
              <div>
                <p className="font-semibold text-gray-900">Next Class</p>
                {nextClass ? (
                  <>
                    <p className="text-sm font-medium text-blue-700">
                  
                      {nextClass.title || nextClass.subject || nextClass.topic || 'Class'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmtDate(nextClass.scheduledAt || nextClass.startTime || nextClass.date)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">No upcoming classes scheduled</p>
                )}
              </div>
            </div>

            {/* Upcoming Exam */}
            <div className={`flex items-center gap-4 p-4 rounded-xl border ${
              upcomingExam ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <BookOpen className={`w-8 h-8 shrink-0 ${upcomingExam ? 'text-purple-600' : 'text-gray-300'}`} />
              <div>
                <p className="font-semibold text-gray-900">Upcoming Exam</p>
                {upcomingExam ? (
                  <>
                    <p className="text-sm font-medium text-purple-700">
                      {upcomingExam.title || upcomingExam.subject || 'Exam'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmtDate(upcomingExam.scheduledAt || upcomingExam.startTime || upcomingExam.date)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">No exams scheduled</p>
                )}
              </div>
            </div>

            {/* Extra upcoming classes if more than 1 */}
            {liveClasses.length > 1 && (
              <div className="pt-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  All Upcoming ({liveClasses.length})
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {liveClasses.slice(1, 5).map((cls, i) => (
                    <div key={cls._id || i}
                      className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-gray-700">
                            {cls.title || cls.subject || 'Class'}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {fmtDate(cls.scheduledAt || cls.startTime || cls.date)}
                          </p>
                        </div>
                      </div>
                      {cls.meetLink || cls.joinUrl ? (
                        <a href={cls.meetLink || cls.joinUrl} target="_blank" rel="noreferrer"
                          className="text-xs font-semibold text-blue-600 hover:underline">
                          Join →
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {liveClasses.length === 0 && !loading && (
              <p className="text-center text-gray-400 text-sm py-4">
                No upcoming events scheduled
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentOverview
