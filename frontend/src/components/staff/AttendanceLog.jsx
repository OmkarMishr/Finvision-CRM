import { useState, useEffect, useMemo } from 'react'
import {
    Calendar, Clock, TrendingUp, Download, RefreshCw,
    ChevronLeft, ChevronRight, CheckCircle, XCircle,
    AlertCircle, Timer, Filter, X, MapPin, BarChart3,
    Percent, Award, LogOut as LogOutIcon
} from 'lucide-react'
import axiosInstance from '../../config/axios'
import { API_ENDPOINTS } from '../../config/api'
import ExportButton from '../common/ExportButton'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (iso) =>
    iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const fmtDay = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { weekday: 'short' }) : ''

const minsToHrs = (mins) => {
    if (!mins && mins !== 0) return '—'
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h ${m}m`
}

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS = {
    present: { label: 'Present', cls: 'bg-green-100  text-green-700', dot: 'bg-green-500', icon: CheckCircle },
    absent: { label: 'Absent', cls: 'bg-red-100    text-red-700', dot: 'bg-red-500', icon: XCircle },
    late: { label: 'Late', cls: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', icon: AlertCircle },
    half: { label: 'Half Day', cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', icon: Timer },
}

const StatusBadge = ({ status }) => {
    const cfg = STATUS[status?.toLowerCase()] || { label: status || '—', cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' }
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
            {cfg.label}
        </span>
    )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, bg }) => (
    <div className={`${bg} rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm`}>
        <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
        </div>
        <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] tabular-nums">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
)

const MiniBar = ({ value, max, color = 'bg-[#C8294A]' }) => {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
    return (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
    )
}

const MonthCalendar = ({ records, year, month }) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfWk = new Date(year, month, 1).getDay()

    const recordMap = useMemo(() => {
        const m = {}
        records.forEach(r => {
            const d = new Date(r.date).getDate()
            m[d] = r.status?.toLowerCase()
        })
        return m
    }, [records])

    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    const cells = Array(firstDayOfWk).fill(null).concat(
        Array.from({ length: daysInMonth }, (_, i) => i + 1)
    )

    const dotColor = (status) => ({
        present: 'bg-green-500',
        late: 'bg-orange-400',
        absent: 'bg-red-400',
        half: 'bg-yellow-400',
    }[status] || '')

    const today = new Date()

    return (
        <div>
            <div className="grid grid-cols-7 mb-1">
                {dayNames.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} />
                    const status = recordMap[day]
                    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
                    const isFuture = new Date(year, month, day) > today
                    return (
                        <div key={day}
                            className={`relative aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors
                ${isToday ? 'ring-2 ring-[#C8294A] ring-offset-1' : ''}
                ${isFuture ? 'text-gray-300'
                                    : status ? 'text-[#1a1a1a] bg-gray-50'
                                        : 'text-gray-400'}`}
                        >
                            {day}
                            {status && !isFuture && (
                                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${dotColor(status)}`} />
                            )}
                        </div>
                    )
                })}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
                {[
                    { color: 'bg-green-500', label: 'Present' },
                    { color: 'bg-orange-400', label: 'Late' },
                    { color: 'bg-red-400', label: 'Absent' },
                    { color: 'bg-yellow-400', label: 'Half Day' },
                ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className={`w-2 h-2 rounded-full ${color}`} />
                        {label}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Main AttendanceLog ───────────────────────────────────────────────────────
const AttendanceLog = () => {
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')        

    const [filterStatus, setFilterStatus] = useState('all')
    const [filterMonth, setFilterMonth] = useState(() => {
        const n = new Date()
        return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
    })

    const [page, setPage] = useState(1)
    const [calYear, setCalYear] = useState(new Date().getFullYear())
    const [calMonth, setCalMonth] = useState(new Date().getMonth())
    const PER_PAGE = 8

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchLog = async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)
        setError('')

        try {
            // axiosInstance already has baseURL set, so use the full URL from API_ENDPOINTS
            const url = API_ENDPOINTS.staffAttendance.myAttendance

            const res = await axiosInstance.get(url)

            
            let data = []
            if (Array.isArray(res.data)) {
                data = res.data
            } else if (Array.isArray(res.data?.data?.records)) {
                data = res.data.data.records
            } else if (Array.isArray(res.data?.data)) {
                data = res.data.data
            } else if (Array.isArray(res.data?.records)) {
                data = res.data.records
            } else if (Array.isArray(res.data?.attendance)) {
                data = res.data.attendance
            }

            //    instead of checkInTime/checkOutTime
            const normalised = data.map(r => {
                const checkIn  = r.checkInTime  || r.checkIn  || r.clockIn  || null
                const checkOut = r.checkOutTime || r.checkOut || r.clockOut || null
              
                const rawDate = r.date || r.attendanceDate || r.checkIn || r.createdAt
                const dateObj = rawDate ? new Date(rawDate) : null
              
                // ✅ FIX 1 — Handle "Half Day", "half day", "half-day" → "half"
                const rawStatus = (r.status || '').toLowerCase().trim()
                let status = rawStatus
                if (['on_time', 'on time', 'checked_in', 'checkedin'].includes(rawStatus)) status = 'present'
                if (['half_day', 'half-day', 'half day'].includes(rawStatus))              status = 'half'
                if (!status) status = 'present'
              

                const checkInMs  = checkIn  ? new Date(checkIn).getTime()  : null
                const checkOutMs = checkOut ? new Date(checkOut).getTime() : null
                const computedMins = (checkInMs && checkOutMs && checkOutMs > checkInMs)
                  ? Math.round((checkOutMs - checkInMs) / 60000)
                  : 0
              
                return {
                  ...r,
                  date:           dateObj ? dateObj.toISOString() : null,
                  checkInTime:    checkIn,
                  checkOutTime:   checkOut,
                  workingMinutes: r.workingMinutes || r.totalMinutes || r.workedMinutes || computedMins,
                  lateByMinutes:  r.lateByMinutes  || r.lateMinutes  || 0,
                  isLate:         r.isLate || status === 'late' || false,
                  status,
                }
              }).filter(r => r.date !== null)
              

            setRecords(normalised)
           

        } catch (e) {
            const msg = e.response?.data?.message || e.message || 'Failed to load attendance'
            console.error('[AttendanceLog] ', e.response?.status, msg)
            setError(msg)
            setRecords([])
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => { fetchLog() }, [])
    useEffect(() => { setPage(1) }, [filterStatus, filterMonth])

    // ── Calendar month records ─────────────────────────────────────────────
    const calRecords = useMemo(() =>
        records.filter(r => {
            const d = new Date(r.date)
            return d.getFullYear() === calYear && d.getMonth() === calMonth
        }), [records, calYear, calMonth]
    )

    // ── Filtered table records ─────────────────────────────────────────────
    const filtered = useMemo(() => {
        return records.filter(r => {
            const [fy, fm] = filterMonth.split('-').map(Number)
            const d = new Date(r.date)
            const matchMonth = d.getFullYear() === fy && d.getMonth() + 1 === fm
            const matchStatus = filterStatus === 'all' || r.status?.toLowerCase() === filterStatus
            return matchMonth && matchStatus
        }).sort((a, b) => new Date(b.date) - new Date(a.date))
    }, [records, filterMonth, filterStatus])

    const totalPages = Math.ceil(filtered.length / PER_PAGE)
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

    // ── Stats ──────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const [fy, fm] = filterMonth.split('-').map(Number)
        const monthly = records.filter(r => {
            const d = new Date(r.date)
            return d.getFullYear() === fy && d.getMonth() + 1 === fm
        })
        const present = monthly.filter(r => r.status?.toLowerCase() === 'present').length
        const late = monthly.filter(r => r.status?.toLowerCase() === 'late').length
        const absent = monthly.filter(r => r.status?.toLowerCase() === 'absent').length
        const half = monthly.filter(r => r.status?.toLowerCase() === 'half').length
        const workDays = monthly.length
        const totalMins = monthly.reduce((acc, r) => acc + (r.workingMinutes || 0), 0)
        const avgMins = workDays > 0 ? Math.round(totalMins / workDays) : 0
        const rate = workDays > 0 ? Math.round(((present + late + half) / workDays) * 100) : 0
        return { present, late, absent, half, workDays, totalMins, avgMins, rate }
    }, [records, filterMonth])

    // ── Build export rows for ExportButton ─────────────────────────────────
    const buildExportRows = () => ({
        headers: ['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Working Hours', 'Late By'],
        rows: filtered.map(r => [
            fmtDate(r.date), fmtDay(r.date), r.status || '',
            fmtTime(r.checkInTime), fmtTime(r.checkOutTime),
            minsToHrs(r.workingMinutes),
            r.lateByMinutes ? `${r.lateByMinutes}m` : '—',
        ]),
    })

    // ── Calendar nav ───────────────────────────────────────────────────────
    const prevCalMonth = () => {
        if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
        else { setCalMonth(m => m - 1) }
    }
    const nextCalMonth = () => {
        if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
        else { setCalMonth(m => m + 1) }
    }

    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']

    const monthOptions = useMemo(() => {
        const opts = []
        const now = new Date()
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const lbl = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
            opts.push({ val, lbl })
        }
        return opts
    }, [])

    // ── Loading ────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl shadow">
            <RefreshCw className="w-10 h-10 animate-spin text-[#C8294A] mb-3" />
            <p className="text-gray-500 text-sm">Loading attendance log…</p>
        </div>
    )

    return (
        <div className="space-y-6">

            {/* Page Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">Attendance Log</h1>
                    <p className="text-gray-500 text-sm mt-1">Your complete attendance history</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => fetchLog(true)} disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-xl text-sm font-medium hover:bg-[#2d2d2d] transition-colors">
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <ExportButton
                        filename={`Attendance_Log_${filterMonth}`}
                        title="Attendance Log"
                        getRows={buildExportRows}
                    />
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-red-700">Failed to load attendance</p>
                        <p className="text-xs text-red-500 mt-0.5">{error}</p>
                    </div>
                    <button onClick={() => fetchLog()}
                        className="text-xs font-semibold text-red-600 underline hover:no-underline">
                        Retry
                    </button>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard icon={CheckCircle} label="Present Days"
                    value={stats.present} sub={`${stats.workDays} working days`}
                    color="bg-green-500" bg="bg-white" />
                <StatCard icon={Percent} label="Attendance Rate"
                    value={`${stats.rate}%`} sub="of working days"
                    color="bg-[#C8294A]" bg="bg-white" />
                <StatCard icon={AlertCircle} label="Late Arrivals"
                    value={stats.late} sub={`${stats.absent} absent days`}
                    color="bg-orange-500" bg="bg-white" />
                <StatCard icon={Timer} label="Avg Working Hours"
                    value={minsToHrs(stats.avgMins)} sub="per working day"
                    color="bg-purple-500" bg="bg-white" />
            </div>

            {/* 2-col layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* LEFT: Calendar + Breakdown */}
                <div className="xl:col-span-1 space-y-5">
                    <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={prevCalMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            <h3 className="font-bold text-[#1a1a1a] text-sm">
                                {MONTH_NAMES[calMonth]} {calYear}
                            </h3>
                            <button onClick={nextCalMonth}
                                disabled={calYear === new Date().getFullYear() && calMonth === new Date().getMonth()}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <MonthCalendar records={calRecords} year={calYear} month={calMonth} />
                    </div>

                    <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
                        <h3 className="font-bold text-[#1a1a1a] mb-4 flex items-center gap-2 text-sm">
                            <BarChart3 className="w-4 h-4 text-[#C8294A]" />
                            Monthly Breakdown
                        </h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Present', value: stats.present, max: stats.workDays, color: 'bg-green-500' },
                                { label: 'Late', value: stats.late, max: stats.workDays, color: 'bg-orange-400' },
                                { label: 'Absent', value: stats.absent, max: stats.workDays, color: 'bg-red-400' },
                                { label: 'Half Day', value: stats.half, max: stats.workDays, color: 'bg-yellow-400' },
                            ].map(({ label, value, max, color }) => (
                                <div key={label}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-600 font-medium">{label}</span>
                                        <span className="text-[#1a1a1a] font-bold tabular-nums">{value} days</span>
                                    </div>
                                    <MiniBar value={value} max={max} color={color} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#C8294A] to-[#a01f39] rounded-2xl p-5 text-white shadow">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-white/70 text-xs font-medium">Current Month</p>
                                <p className="font-bold">Attendance Rate</p>
                            </div>
                        </div>
                        <p className="text-5xl font-bold tabular-nums mt-3">{stats.rate}%</p>
                        <p className="text-white/60 text-xs mt-1">
                            {stats.present + stats.late} of {stats.workDays} days attended
                        </p>
                    </div>
                </div>

                {/* RIGHT: Filters + Table */}
                <div className="xl:col-span-2 space-y-5">

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow border border-gray-100 p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Month</label>
                                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white">
                                    {monthOptions.map(o => <option key={o.val} value={o.val}>{o.lbl}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Status</label>
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white">
                                    <option value="all">All Status</option>
                                    <option value="present">Present</option>
                                    <option value="late">Late</option>
                                    <option value="absent">Absent</option>
                                    <option value="half">Half Day</option>
                                </select>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 whitespace-nowrap">
                                    <Filter className="w-4 h-4 inline mr-1.5 text-gray-400" />
                                    {filtered.length} records
                                </div>
                                {filterStatus !== 'all' && (
                                    <button onClick={() => setFilterStatus('all')}
                                        className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">

                        {/* Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        {['Date', 'Status', 'Check In', 'Check Out', 'Working Hours', 'Remarks'].map(h => (
                                            <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-14">
                                                <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                                <p className="text-gray-400 font-medium">No records found</p>
                                                <p className="text-gray-400 text-xs mt-1">
                                                    {records.length === 0
                                                        ? 'No attendance data available yet'
                                                        : 'Try adjusting your filters'}
                                                </p>
                                            </td>
                                        </tr>
                                    ) : paginated.map((r, i) => {
                                        const d = new Date(r.date)
                                        const isToday = d.toDateString() === new Date().toDateString()
                                        return (
                                            <tr key={r._id || i}
                                                className={`hover:bg-gray-50 transition-colors ${isToday ? 'bg-blue-50/40' : ''}`}>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-center shrink-0 ${isToday ? 'bg-[#C8294A] text-white' : 'bg-gray-100 text-[#1a1a1a]'
                                                            }`}>
                                                            <span className="text-xs font-bold leading-none">{fmtDay(r.date)}</span>
                                                            <span className="text-sm font-bold leading-tight">{d.getDate()}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-[#1a1a1a] text-xs">
                                                                {d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                                            </p>
                                                            {isToday && <span className="text-[10px] text-[#C8294A] font-semibold">Today</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                                        <span className="text-[#1a1a1a] font-medium tabular-nums">{fmtTime(r.checkInTime)}</span>
                                                    </div>
                                                    {r.isLate && (
                                                        <p className="text-xs text-orange-500 mt-0.5">+{r.lateByMinutes}m late</p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <LogOutIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                        <span className="text-[#1a1a1a] font-medium tabular-nums">{fmtTime(r.checkOutTime)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                                        <span className="font-semibold text-[#1a1a1a] tabular-nums">{minsToHrs(r.workingMinutes)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-gray-500 max-w-[140px] truncate">
                                                    {r.remarks || '—'}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {paginated.length === 0 ? (
                                <div className="text-center py-14">
                                    <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-400 font-medium text-sm">No records found</p>
                                </div>
                            ) : paginated.map((r, i) => {
                                const d = new Date(r.date)
                                const isToday = d.toDateString() === new Date().toDateString()
                                return (
                                    <div key={r._id || i} className={`p-4 ${isToday ? 'bg-blue-50/40' : ''}`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${isToday ? 'bg-[#C8294A] text-white' : 'bg-gray-100 text-[#1a1a1a]'
                                                    }`}>
                                                    <span className="text-[10px] font-bold leading-none">{fmtDay(r.date)}</span>
                                                    <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[#1a1a1a] text-sm">
                                                        {d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                                    </p>
                                                    {isToday && <span className="text-xs text-[#C8294A] font-semibold">Today</span>}
                                                </div>
                                            </div>
                                            <StatusBadge status={r.status} />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-3">
                                            <div className="text-center">
                                                <p className="text-[10px] text-gray-400 font-medium mb-0.5">CHECK IN</p>
                                                <p className="text-sm font-bold text-green-700 tabular-nums">{fmtTime(r.checkInTime)}</p>
                                                {r.isLate && <p className="text-[10px] text-orange-500">+{r.lateByMinutes}m</p>}
                                            </div>
                                            <div className="text-center border-x border-gray-200">
                                                <p className="text-[10px] text-gray-400 font-medium mb-0.5">CHECK OUT</p>
                                                <p className="text-sm font-bold text-blue-700 tabular-nums">{fmtTime(r.checkOutTime)}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] text-gray-400 font-medium mb-0.5">HOURS</p>
                                                <p className="text-sm font-bold text-purple-700 tabular-nums">{minsToHrs(r.workingMinutes)}</p>
                                            </div>
                                        </div>
                                        {r.remarks && <p className="text-xs text-gray-500 mt-2 pl-1">💬 {r.remarks}</p>}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-4 sm:px-5 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                                <p className="text-xs text-gray-500">
                                    {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                        .map((pg, idx, arr) => (
                                            <span key={pg} className="flex items-center gap-1.5">
                                                {idx > 0 && arr[idx - 1] !== pg - 1 && <span className="text-gray-400 text-xs">…</span>}
                                                <button onClick={() => setPage(pg)}
                                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === pg ? 'bg-[#C8294A] text-white' : 'hover:bg-gray-200 text-gray-600'
                                                        }`}>
                                                    {pg}
                                                </button>
                                            </span>
                                        ))}
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AttendanceLog
