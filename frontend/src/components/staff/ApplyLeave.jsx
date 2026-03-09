import { useState, useEffect } from 'react'
import {
  CalendarDays, Clock, FileText, CheckCircle, XCircle,
  AlertCircle, ChevronLeft, ChevronRight,
  X, Send, RefreshCw, Calendar, Info, ClipboardList,
} from 'lucide-react'
import axiosInstance     from '../../config/axios'
import { API_ENDPOINTS } from '../../config/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  }) : '—'

const daysBetween = (from, to) => {
  if (!from || !to) return 0
  return Math.max(Math.floor((new Date(to) - new Date(from)) / 86400000) + 1, 0)
}

const today = () => new Date().toISOString().split('T')[0]

// ─── Leave Type Config ────────────────────────────────────────────────────────
const LEAVE_TYPES = [
  { value: 'casual',    label: 'Casual Leave',    color: 'bg-blue-100   text-blue-700',   dot: 'bg-blue-500',   max: 12  },
  { value: 'sick',      label: 'Sick Leave',      color: 'bg-red-100    text-red-700',    dot: 'bg-red-500',    max: 12  },
  { value: 'earned',    label: 'Earned Leave',    color: 'bg-green-100  text-green-700',  dot: 'bg-green-500',  max: 15  },
  { value: 'halfday',   label: 'Half Day',        color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', max: 24  },
  { value: 'emergency', label: 'Emergency Leave', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', max: 5   },
  { value: 'unpaid',    label: 'Unpaid Leave',    color: 'bg-gray-100   text-gray-700',   dot: 'bg-gray-500',   max: 999 },
]

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS = {
  pending:   { cls: 'bg-yellow-100 text-yellow-700', icon: Clock,       label: 'Pending'   },
  approved:  { cls: 'bg-green-100  text-green-700',  icon: CheckCircle, label: 'Approved'  },
  rejected:  { cls: 'bg-red-100    text-red-700',    icon: XCircle,     label: 'Rejected'  },
  cancelled: { cls: 'bg-gray-100   text-gray-500',   icon: X,           label: 'Cancelled' },
}

const StatusBadge = ({ status }) => {
  const cfg = STATUS[status?.toLowerCase()]
    || { cls: 'bg-gray-100 text-gray-500', label: status || '—', icon: Info }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  )
}

const LeaveTypeBadge = ({ type }) => {
  const cfg = LEAVE_TYPES.find(t => t.value === type?.toLowerCase())
    || { label: type || '—', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
    </span>
  )
}

// ─── Leave Balance Card ───────────────────────────────────────────────────────
const BalanceCard = ({ type, used = 0, maxOverride }) => {
  const cfg       = LEAVE_TYPES.find(t => t.value === type) || {}
  const max       = maxOverride ?? cfg.max ?? 0
  const remaining = Math.max(max - used, 0)
  const pct       = max > 0 ? Math.min((used / max) * 100, 100) : 0
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color || 'bg-gray-100 text-gray-600'}`}>
          {cfg.label}
        </span>
        <span className="text-xs text-gray-400">{used}/{max === 999 ? '∞' : max}</span>
      </div>
      <p className="text-3xl font-bold text-[#1a1a1a] tabular-nums">
        {max === 999 ? '∞' : remaining}
      </p>
      <p className="text-xs text-gray-500 mb-2">days remaining</p>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct > 80 ? 'bg-red-400' : pct > 50 ? 'bg-orange-400' : 'bg-green-500'
          }`}
          style={{ width: `${max === 999 ? 0 : pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ApplyLeave = () => {
  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    leaveType: '', fromDate: '', toDate: '',
    reason: '', isHalfDay: false, halfDaySlot: 'morning', contactNo: '',
  })
  const [formError,  setFormError]  = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg,  setSubmitMsg]  = useState(null)  // { type, text }

  // ── History state ──────────────────────────────────────────────────────────
  const [history,     setHistory]     = useState([])
  const [loadingHist, setLoadingHist] = useState(true)
  const [filterSt,    setFilterSt]    = useState('all')
  const [histPage,    setHistPage]    = useState(1)
  const HIST_PER_PAGE = 5

  // ── Balance state (real API) ───────────────────────────────────────────────
  const [balance,     setBalance]     = useState({})   // { casual: 3, sick: 2, ... }
  const [balanceMax,  setBalanceMax]  = useState({})   // { casual: 12, ... } from server
  const [loadingBal,  setLoadingBal]  = useState(true)

  // ── Fetch leave balance from API ──────────────────────────────────────────
  // BUG FIX #3 — was hardcoded mock, now real API call
  const fetchBalance = async () => {
    setLoadingBal(true)
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.leave.balance)
      // Backend returns: { success, data: { balance: { casual:3, ... }, max: { casual:12, ... } } }
      const payload = res.data?.data || res.data
      setBalance(payload?.balance || {})
      setBalanceMax(payload?.max   || {})
    } catch {
      // Fallback to zeros — UI still renders without crashing
      setBalance({})
      setBalanceMax({})
    } finally {
      setLoadingBal(false)
    }
  }

  // ── Fetch leave history from API ──────────────────────────────────────────
  // BUG FIX #1 — was checking res.data.leaves which doesn't exist in our backend
  // Backend returns: { success, data: { records: [...], total, page, limit } }
  const fetchHistory = async () => {
    setLoadingHist(true)
    try {
      const res  = await axiosInstance.get(API_ENDPOINTS.leave.myHistory)
      const data =
        Array.isArray(res.data?.data?.records) ? res.data.data.records   // ✅ correct path
        : Array.isArray(res.data?.data)         ? res.data.data
        : Array.isArray(res.data)               ? res.data
        : []
      setHistory(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    } catch {
      setHistory([])
    } finally {
      setLoadingHist(false)
    }
  }

  useEffect(() => {
    fetchHistory()
    fetchBalance()
  }, [])

  // Auto-clear submit message after 5s
  useEffect(() => {
    if (!submitMsg) return
    const t = setTimeout(() => setSubmitMsg(null), 5000)
    return () => clearTimeout(t)
  }, [submitMsg])

  // Auto set toDate = fromDate when half day
  useEffect(() => {
    if (form.isHalfDay && form.fromDate)
      setForm(f => ({ ...f, toDate: f.fromDate }))
  }, [form.isHalfDay, form.fromDate])

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const err = {}
    if (!form.leaveType)                  err.leaveType = 'Please select a leave type'
    if (!form.fromDate)                   err.fromDate  = 'Please select start date'
    if (!form.toDate)                     err.toDate    = 'Please select end date'
    if (form.toDate < form.fromDate)      err.toDate    = 'End date must be after start date'
    if (!form.reason.trim())              err.reason    = 'Please provide a reason'
    if (form.reason.trim().length < 10)   err.reason    = 'Reason must be at least 10 characters'
    return err
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (Object.keys(err).length > 0) { setFormError(err); return }
    setFormError({})
    setSubmitting(true)
    try {
      await axiosInstance.post(API_ENDPOINTS.leave.apply, {
        leaveType:   form.leaveType,
        fromDate:    form.fromDate,
        toDate:      form.toDate,
        reason:      form.reason.trim(),
        isHalfDay:   form.isHalfDay,
        halfDaySlot: form.isHalfDay ? form.halfDaySlot : undefined,
        contactNo:   form.contactNo || undefined,
      })
      setSubmitMsg({ type: 'success', text: 'Leave application submitted successfully!' })
      setForm({ leaveType: '', fromDate: '', toDate: '', reason: '', isHalfDay: false, halfDaySlot: 'morning', contactNo: '' })
      fetchHistory()
      fetchBalance()   // refresh balance after new application
    } catch (error) {
      setSubmitMsg({
        type: 'error',
        text: error.response?.data?.message || 'Submission failed. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Cancel leave ──────────────────────────────────────────────────────────
  // BUG FIX #2 — was string concat: (cancel || '/leave/cancel/') + id
  // cancel is now a function: cancel(id) => `${API_URL}/api/leave/cancel/${id}`
  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave application?')) return
    try {
      await axiosInstance.patch(API_ENDPOINTS.leave.cancel(id))  // ✅ function call
      fetchHistory()
      fetchBalance()
    } catch (error) {
      alert(error.response?.data?.message || 'Could not cancel leave.')
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const days = daysBetween(form.fromDate, form.toDate)

  const filteredHist   = history.filter(h =>
    filterSt === 'all' || h.status?.toLowerCase() === filterSt
  )
  const totalHistPages = Math.ceil(filteredHist.length / HIST_PER_PAGE)
  const pagedHist      = filteredHist.slice(
    (histPage - 1) * HIST_PER_PAGE, histPage * HIST_PER_PAGE
  )

  const field = (key) => ({
    value:    form[key],
    onChange: (e) => {
      setForm(f    => ({ ...f,   [key]: e.target.value }))
      setFormError(er => ({ ...er, [key]: '' }))
    },
  })

  const inputCls = (key) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors bg-white
     ${formError[key]
       ? 'border-red-300 focus:ring-red-400'
       : 'border-gray-200 focus:ring-[#C8294A]'}`

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">Apply for Leave</h1>
        <p className="text-gray-500 text-sm mt-1">Submit and track your leave applications</p>
      </div>

      {/* Leave Balance Strip — now from real API */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
          Your Leave Balance
        </h2>
        {loadingBal ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {LEAVE_TYPES.map(t => (
              <div key={t.value} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded-full w-3/4 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {LEAVE_TYPES.map(t => (
              <BalanceCard
                key={t.value}
                type={t.value}
                used={balance[t.value] || 0}
                maxOverride={balanceMax[t.value]}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* LEFT: Form */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">

            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#C8294A]/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#C8294A]/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#C8294A]" />
                </div>
                <div>
                  <h2 className="font-bold text-[#1a1a1a]">New Application</h2>
                  <p className="text-xs text-gray-400">Fill in the details below</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">

              {/* Submit message */}
              {submitMsg && (
                <div className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm border ${
                  submitMsg.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50   border-red-200   text-red-800'
                }`}>
                  {submitMsg.type === 'success'
                    ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                  <p className="font-medium">{submitMsg.text}</p>
                </div>
              )}

              {/* Leave Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LEAVE_TYPES.map(t => (
                    <button
                      key={t.value} type="button"
                      onClick={() => {
                        setForm(f => ({ ...f, leaveType: t.value, isHalfDay: t.value === 'halfday' }))
                        setFormError(er => ({ ...er, leaveType: '' }))
                      }}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all text-left ${
                        form.leaveType === t.value
                          ? `${t.color} border-current shadow-sm`
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-gray-50'
                      }`}
                    >
                      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${t.dot}`} />
                      {t.label}
                    </button>
                  ))}
                </div>
                {formError.leaveType && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{formError.leaveType}
                  </p>
                )}
              </div>

              {/* Half Day Toggle */}
              {form.leaveType && form.leaveType !== 'halfday' && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, isHalfDay: !f.isHalfDay }))}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                      form.isHalfDay ? 'bg-[#C8294A]' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
                      transition-transform ${form.isHalfDay ? 'translate-x-5' : ''}`} />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">Half Day</p>
                    <p className="text-xs text-gray-500">Apply for half a working day</p>
                  </div>
                </div>
              )}

              {/* Half Day Slot */}
              {form.isHalfDay && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Half Day Slot</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'morning',   label: 'Morning',   sub: '9:00 AM – 1:00 PM' },
                      { value: 'afternoon', label: 'Afternoon', sub: '1:00 PM – 6:00 PM' },
                    ].map(slot => (
                      <button
                        key={slot.value} type="button"
                        onClick={() => setForm(f => ({ ...f, halfDaySlot: slot.value }))}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          form.halfDaySlot === slot.value
                            ? 'border-[#C8294A] bg-[#C8294A]/5'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                        }`}
                      >
                        <p className={`text-sm font-semibold ${
                          form.halfDaySlot === slot.value ? 'text-[#C8294A]' : 'text-[#1a1a1a]'
                        }`}>{slot.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{slot.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    From Date <span className="text-red-500">*</span>
                  </label>
                  <input type="date" min={today()} className={inputCls('fromDate')} {...field('fromDate')} />
                  {formError.fromDate && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{formError.fromDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    To Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={form.fromDate || today()}
                    disabled={form.isHalfDay}
                    className={`${inputCls('toDate')} ${form.isHalfDay ? 'opacity-50 cursor-not-allowed' : ''}`}
                    {...field('toDate')}
                  />
                  {formError.toDate && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{formError.toDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Duration pill */}
              {days > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#C8294A]/5 border border-[#C8294A]/20 rounded-xl">
                  <CalendarDays className="w-4 h-4 text-[#C8294A]" />
                  <span className="text-sm font-medium text-[#C8294A]">
                    {form.isHalfDay ? '0.5 day' : `${days} day${days > 1 ? 's' : ''}`}
                    {' '}— {fmtDate(form.fromDate)}
                    {!form.isHalfDay && days > 1 && ` to ${fmtDate(form.toDate)}`}
                  </span>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the reason for your leave request…"
                  className={`${inputCls('reason')} resize-none`}
                  {...field('reason')}
                />
                <div className="flex justify-between mt-1">
                  {formError.reason
                    ? <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{formError.reason}
                      </p>
                    : <span />
                  }
                  <span className={`text-xs ${form.reason.length < 10 ? 'text-gray-400' : 'text-green-500'}`}>
                    {form.reason.length} / 500
                  </span>
                </div>
              </div>

              {/* Contact (optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Emergency Contact{' '}
                  <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="Phone number during leave"
                  className={inputCls('contactNo')}
                  {...field('contactNo')}
                />
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={submitting}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl
                  text-white font-bold text-base shadow-lg transition-all ${
                  submitting
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#C8294A] to-[#a01f39] hover:from-[#a01f39] hover:to-[#8a1830] hover:shadow-xl active:scale-[0.98]'
                }`}
              >
                {submitting
                  ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                  : <><Send className="w-5 h-5" /> Submit Application</>}
              </button>

            </form>
          </div>
        </div>

        {/* RIGHT: Policy + Pending alert */}
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
            <h3 className="font-bold text-[#1a1a1a] mb-4 flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-[#C8294A]" /> Leave Policy
            </h3>
            <div className="space-y-3">
              {[
                { icon: Clock,       color: 'text-blue-500',   bg: 'bg-blue-50',   text: 'Apply at least 1 day in advance' },
                { icon: Calendar,    color: 'text-green-500',  bg: 'bg-green-50',  text: 'Sick leave can be applied retrospectively' },
                { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50', text: 'More than 3 days require manager approval' },
                { icon: FileText,    color: 'text-purple-500', bg: 'bg-purple-50', text: 'Medical certificate needed for sick leave > 2 days' },
                { icon: XCircle,     color: 'text-red-500',    bg: 'bg-red-50',    text: 'Pending leaves can be cancelled any time' },
              ].map(({ icon: Icon, color, bg, text }, i) => (
                <div key={i} className={`flex items-start gap-3 ${bg} px-3 py-2.5 rounded-xl`}>
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${color}`} />
                  <p className="text-xs text-gray-700 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {history.filter(h => h.status?.toLowerCase() === 'pending').length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <Clock className="w-5 h-5 text-yellow-600 shrink-0" />
              <p className="text-sm text-yellow-800 font-medium">
                You have{' '}
                <strong>{history.filter(h => h.status?.toLowerCase() === 'pending').length}</strong>{' '}
                pending leave application
                {history.filter(h => h.status?.toLowerCase() === 'pending').length > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Leave History */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#C8294A]/10 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-[#C8294A]" />
            </div>
            <div>
              <h2 className="font-bold text-[#1a1a1a] text-sm sm:text-base">My Leave History</h2>
              <p className="text-xs text-gray-400">{history.length} total applications</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterSt}
              onChange={e => { setFilterSt(e.target.value); setHistPage(1) }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={() => { fetchHistory(); fetchBalance() }}
              className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-500"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHist ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loadingHist ? (
          <div className="flex flex-col items-center py-14">
            <RefreshCw className="w-8 h-8 animate-spin text-[#C8294A] mb-2" />
            <p className="text-gray-400 text-sm">Loading history…</p>
          </div>
        ) : pagedHist.length === 0 ? (
          <div className="text-center py-14">
            <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No applications found</p>
            <p className="text-gray-400 text-xs mt-1">Your leave applications will appear here</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Leave Type','From','To','Days','Reason','Applied On','Status','Action'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pagedHist.map((h, i) => (
                    <tr key={h._id || i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4"><LeaveTypeBadge type={h.leaveType} /></td>
                      <td className="px-5 py-4 text-[#1a1a1a] text-xs font-medium whitespace-nowrap">{fmtDate(h.fromDate)}</td>
                      <td className="px-5 py-4 text-[#1a1a1a] text-xs font-medium whitespace-nowrap">{fmtDate(h.toDate)}</td>
                      <td className="px-5 py-4 text-center">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">
                          {h.isHalfDay ? '0.5' : daysBetween(h.fromDate, h.toDate)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 max-w-[160px]">
                        <p className="truncate">{h.reason || '—'}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">{fmtDate(h.createdAt)}</td>
                      <td className="px-5 py-4"><StatusBadge status={h.status} /></td>
                      <td className="px-5 py-4">
                        {h.status?.toLowerCase() === 'pending' ? (
                          <button
                            onClick={() => handleCancel(h._id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600
                              hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                          >
                            <X className="w-3 h-3" /> Cancel
                          </button>
                        ) : (
                          // Show admin remarks if available
                          h.adminRemarks
                            ? <span className="text-xs text-gray-500 italic max-w-[100px] block truncate" title={h.adminRemarks}>
                                💬 {h.adminRemarks}
                              </span>
                            : <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {pagedHist.map((h, i) => (
                <div key={h._id || i} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <LeaveTypeBadge type={h.leaveType} />
                    <StatusBadge status={h.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-3">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">FROM</p>
                      <p className="text-xs font-bold text-[#1a1a1a]">{fmtDate(h.fromDate)}</p>
                    </div>
                    <div className="text-center border-x border-gray-200">
                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">TO</p>
                      <p className="text-xs font-bold text-[#1a1a1a]">{fmtDate(h.toDate)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">DAYS</p>
                      <p className="text-sm font-bold text-[#C8294A]">
                        {h.isHalfDay ? '0.5' : daysBetween(h.fromDate, h.toDate)}
                      </p>
                    </div>
                  </div>
                  {h.reason && <p className="text-xs text-gray-500 line-clamp-2">💬 {h.reason}</p>}
                  {h.adminRemarks && (
                    <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                      🗒 Admin: {h.adminRemarks}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">Applied {fmtDate(h.createdAt)}</p>
                    {h.status?.toLowerCase() === 'pending' && (
                      <button
                        onClick={() => handleCancel(h._id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium
                          text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalHistPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <p className="text-xs text-gray-500">
                  {(histPage - 1) * HIST_PER_PAGE + 1}–{Math.min(histPage * HIST_PER_PAGE, filteredHist.length)} of {filteredHist.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setHistPage(p => Math.max(1, p - 1))}
                    disabled={histPage === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalHistPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalHistPages || Math.abs(p - histPage) <= 1)
                    .map((pg, idx, arr) => (
                      <span key={pg} className="flex items-center gap-1">
                        {idx > 0 && arr[idx - 1] !== pg - 1 && (
                          <span className="text-gray-400 text-xs px-0.5">…</span>
                        )}
                        <button
                          onClick={() => setHistPage(pg)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            histPage === pg ? 'bg-[#C8294A] text-white' : 'hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          {pg}
                        </button>
                      </span>
                    ))}
                  <button onClick={() => setHistPage(p => Math.min(totalHistPages, p + 1))}
                    disabled={histPage === totalHistPages}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ApplyLeave
