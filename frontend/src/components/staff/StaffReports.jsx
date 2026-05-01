import { useState, useEffect, useMemo } from 'react'
import {
  BarChart3, Users, TrendingUp, Download, RefreshCw,
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  FileText, BookOpen, UserCheck, DollarSign, Clock,
  ArrowRight, Filter, X, Eye, Send, Plus, Award,
  Percent, AlertCircle, Calendar, GraduationCap,
  ClipboardList, Star, Phone, Mail, Search,
  ArrowUpRight, Layers, UserPlus, CreditCard,
  ChevronDown, ChevronUp, Bell, Target
} from 'lucide-react'
import axiosInstance     from '../../config/axios'
import { API_ENDPOINTS } from '../../config/api'
import ExportButton      from '../common/ExportButton'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt    = (n)   => (n ?? 0).toLocaleString('en-IN')
const fmtPct = (n)   => `${(n ?? 0).toFixed(1)}%`
const fmtRs  = (n)   => `₹${(n ?? 0).toLocaleString('en-IN')}`
const fmtDate= (iso) => iso
  ? new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
  : '—'

// ✅ FIX: safe data extractor — handles all response shapes
const extractArray = (res) => {
  const d = res?.data
  if (Array.isArray(d?.data))     return d.data
  if (Array.isArray(d?.students)) return d.students
  if (Array.isArray(d?.leads))    return d.leads
  if (Array.isArray(d?.batches))  return d.batches
  if (Array.isArray(d))           return d
  return []
}

// ✅ FIX: get user from ANY common localStorage key
const getStoredUser = () => {
  const KEYS = ['fv_user', 'user', 'authUser', 'currentUser', 'staff', 'auth']
  for (const key of KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      // Accept if it looks like a user object
      const u = parsed?.user || parsed?.data || parsed
      if (u?._id || u?.id) return u
    } catch {}
  }
  return null
}

// ✅ FIX: get user ID safely — handles both _id and id fields
const uid = (u) => u?._id || u?.id || null

// ─── Mini Stat Card ───────────────────────────────────────────────────────────
const KPI = ({ icon: Icon, label, value, sub, color, trend }) => (
  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-bold flex items-center gap-0.5 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend >= 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-xs text-gray-400 font-medium">{label}</p>
    <p className="text-2xl font-bold text-[#1a1a1a] mt-0.5 tabular-nums">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
)

const SectionHead = ({ icon: Icon, title, sub, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-[#C8294A]/10 rounded-lg flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#C8294A]" />
      </div>
      <div>
        <h3 className="font-bold text-[#1a1a1a] text-sm">{title}</h3>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
    {action}
  </div>
)

const Bar = ({ value, max, color = 'bg-[#C8294A]', label, count }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="text-[#1a1a1a] font-bold tabular-nums">{count ?? value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const Badge = ({ text, color }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
    {text}
  </span>
)

const leadStatusColor = {
  new:        'bg-blue-100   text-blue-700',
  contacted:  'bg-purple-100 text-purple-700',
  interested: 'bg-yellow-100 text-yellow-700',
  converted:  'bg-green-100  text-green-700',
  lost:       'bg-red-100    text-red-700',
}

// ─── Pagination ───────────────────────────────────────────────────────────────
const Paginator = ({ page, totalPages, setPage }) => (
  totalPages > 1 ? (
    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
      <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1.5">
        <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
          className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({length:totalPages},(_,i)=>i+1)
          .filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1)
          .map((pg,idx,arr)=>(
            <span key={pg} className="flex items-center gap-1">
              {idx>0&&arr[idx-1]!==pg-1&&<span className="text-gray-300 text-xs">…</span>}
              <button onClick={()=>setPage(pg)}
                className={`w-7 h-7 rounded-lg text-xs font-medium ${pg===page?'bg-[#C8294A] text-white':'hover:bg-gray-200 text-gray-600'}`}>
                {pg}
              </button>
            </span>
          ))}
        <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
          className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  ) : null
)

// ─── Pass-on Modal ────────────────────────────────────────────────────────────
const PassOnModal = ({ items, toRole, onClose, onConfirm }) => {
  const [selected, setSelected] = useState([])
  const [note,     setNote]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id])
  const handleConfirm = async () => {
    if (!selected.length) return
    setLoading(true)
    await onConfirm(selected, note)
    setLoading(false)
    onClose()
  }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div>
            <h2 className="font-bold text-[#1a1a1a]">Pass On to {toRole}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Select records to forward</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-2">
          {items.length === 0
            ? <p className="text-center text-gray-400 text-sm py-8">No items to pass on</p>
            : items.map(item => (
              <label key={item._id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  selected.includes(item._id) ? 'border-[#C8294A] bg-[#C8294A]/5' : 'border-gray-100 hover:border-gray-200'
                }`}>
                <input type="checkbox" checked={selected.includes(item._id)}
                  onChange={() => toggle(item._id)} className="accent-[#C8294A]" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#1a1a1a] truncate">
                    {item.name || `${item.firstName||''} ${item.lastName||''}`.trim() || '—'}
                  </p>
                  <p className="text-xs text-gray-400">{item.phone || item.email || '—'}</p>
                </div>
                <Badge
                  text={item.status || 'new'}
                  color={leadStatusColor[item.status?.toLowerCase()] || 'bg-gray-100 text-gray-600'}
                />
              </label>
            ))
          }
        </div>
        <div className="p-5 border-t space-y-3 shrink-0">
          <textarea rows={2} value={note} onChange={e=>setNote(e.target.value)}
            placeholder="Add a note (optional)…"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] resize-none" />
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={!selected.length || loading}
              className="flex-1 py-2.5 bg-[#C8294A] text-white rounded-xl text-sm font-bold hover:bg-[#a01f39] disabled:opacity-50 flex items-center justify-center gap-2">
              {loading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Forwarding…</>
                : <><Send className="w-4 h-4" /> Forward ({selected.length})</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── TELECALLER PANEL ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const TelecallerReport = ({ user }) => {
  const [data,       setData]       = useState(null)
  const [leads,      setLeads]      = useState([])
  const [students,   setStudents]   = useState([])
  const [batches,    setBatches]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')
  const [passOnOpen, setPassOnOpen] = useState(false)
  const [page,       setPage]       = useState(1)
  const [activeTab,  setActiveTab]  = useState('leads')
  const PER = 8

  const myId = uid(user)

  const fetchAll = async () => {
    // ✅ FIX: don't fetch if user not loaded yet
    if (!myId) {
      console.warn('[TelecallerReport] user._id not available yet, skipping fetch')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      console.log('[TelecallerReport] fetching for user:', myId)

      const [leadsRes, studentsRes, batchesRes] = await Promise.all([
        axiosInstance.get(API_ENDPOINTS.leads?.getAll || API_ENDPOINTS.leads?.base || '/api/leads'),
        axiosInstance.get(API_ENDPOINTS.students?.getAll || API_ENDPOINTS.students?.base || '/api/students'),
        axiosInstance.get(API_ENDPOINTS.batches?.getAll || '/api/batches'),
      ])

      const leadsData    = extractArray(leadsRes)
      const studentsData = extractArray(studentsRes)
      const batchesData  = extractArray(batchesRes)

      console.log('[TelecallerReport] raw counts →', {
        leads: leadsData.length,
        students: studentsData.length,
        batches: batchesData.length
      })

      // ✅ FIX: filter by ANY field that might reference this user
      const myLeads = leadsData.filter(l => {
        const ids = [
          l.assignedTo?._id, l.assignedTo,
          l.createdBy?._id,  l.createdBy,
          l.telecaller?._id, l.telecaller,
        ]
        return ids.some(id => id && String(id) === String(myId))
      })

      const myStudents = studentsData.filter(s => {
        const ids = [
          s.assignedTo?._id, s.assignedTo,
          s.createdBy?._id,  s.createdBy,
          s.telecaller?._id, s.telecaller,
        ]
        return ids.some(id => id && String(id) === String(myId))
      })

      console.log('[TelecallerReport] filtered →', {
        myLeads: myLeads.length,
        myStudents: myStudents.length
      })

      // ✅ If still 0, show ALL (means assignment field name is different)
      const finalLeads    = myLeads.length    > 0 ? myLeads    : leadsData
      const finalStudents = myStudents.length > 0 ? myStudents : studentsData

      if (myLeads.length === 0 && leadsData.length > 0) {
        console.warn('[TelecallerReport]  No leads matched user ID — showing ALL leads. Check assignedTo field name in your Lead model.')
      }

      setLeads(finalLeads)
      setStudents(finalStudents)
      setBatches(batchesData)

      const totalLeads   = finalLeads.length
      const converted    = finalLeads.filter(l => l.status?.toLowerCase() === 'converted').length
      const paidStudents = finalStudents.filter(s => s.isPaid || s.paymentStatus === 'paid').length
      const freeBatches  = batchesData.filter(b => !b.isPaid && b.type !== 'paid').length
      const paidBatches  = batchesData.filter(b => b.isPaid  || b.type === 'paid').length
      const revenue      = finalStudents.reduce((sum, s) => sum + (s.totalFee || s.feePaid || 0), 0)
      const convRate     = totalLeads > 0 ? (converted / totalLeads) * 100 : 0

      setData({ totalLeads, converted, paidStudents, freeBatches, paidBatches, revenue, convRate })

    } catch (e) {
      console.error('[TelecallerReport] ❌', e.response?.data || e.message)
      setError(e.response?.data?.message || e.message || 'Failed to load')
    } finally { setLoading(false) }
  }

  // ✅ FIX: re-fetch when user becomes available
  useEffect(() => { if (myId) fetchAll() }, [myId])
  useEffect(() => { setPage(1) }, [search, activeTab])

  const autoConvertToPaid = async (studentId) => {
    try {
      const url = API_ENDPOINTS.students?.convertToPaid
        ? API_ENDPOINTS.students.convertToPaid(studentId)
        : `/api/students/${studentId}/convert-to-paid`
      await axiosInstance.patch(url)
      fetchAll()
    } catch (e) { console.error('Convert failed:', e.response?.data || e.message) }
  }

  const handlePassOn = async (selectedIds, note) => {
    try {
      await Promise.all(selectedIds.map(id => {
        const url = API_ENDPOINTS.leads?.assignCounselor
          ? API_ENDPOINTS.leads.assignCounselor(id)
          : `/api/leads/${id}/assign-counselor`
        return axiosInstance.patch(url, { counselorId: myId, note: note || undefined })
      }))
      fetchAll()
    } catch (e) { console.error('Pass on failed:', e.response?.data || e.message) }
  }

  const buildExportRows = () => {
    const source  = activeTab === 'leads' ? leads : students
    const headers = activeTab === 'leads'
      ? ['Name','Phone','Email','Status','Source','Assigned To','Created']
      : ['Name','Phone','Email','Batch','Payment','Fee','Joined']
    const rows = source.map(item => activeTab === 'leads' ? [
      item.name||'', item.phone||'', item.email||'',
      item.status||'', item.source||'',
      item.assignedTo?.name||'', fmtDate(item.createdAt)
    ] : [
      `${item.firstName||''} ${item.lastName||''}`.trim(),
      item.phone||'', item.email||'',
      item.batch?.name||item.batchName||'',
      item.isPaid ? 'Paid' : 'Free',
      item.totalFee||0, fmtDate(item.createdAt)
    ])
    return { headers, rows }
  }

  const filtered = useMemo(() => {
    const src = activeTab==='leads' ? leads : activeTab==='students' ? students : batches
    if (!search) return src
    const q = search.toLowerCase()
    return src.filter(item => {
      const name = item.name || `${item.firstName||''} ${item.lastName||''}`.trim()
      return name.toLowerCase().includes(q)
        || item.phone?.includes(q)
        || item.email?.toLowerCase().includes(q)
    })
  }, [leads, students, batches, search, activeTab])

  const totalPages = Math.ceil(filtered.length / PER)
  const paged      = filtered.slice((page-1)*PER, page*PER)

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-60 gap-2">
      <RefreshCw className="w-8 h-8 animate-spin text-[#C8294A]" />
      <p className="text-xs text-gray-400">Loading your data…</p>
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-red-700 text-sm">Failed to load reports</p>
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
        <button onClick={fetchAll}
          className="mt-2 text-xs font-semibold text-red-600 underline">Retry</button>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={Users}      label="My Total Leads"      value={fmt(data?.totalLeads)}   color="bg-[#C8294A]"  sub="assigned to me" />
        <KPI icon={TrendingUp} label="Paid Conversions"    value={fmt(data?.paidStudents)} color="bg-green-500"  sub={`${fmtPct(data?.convRate)} rate`} />
        <KPI icon={Layers}     label="Free / Paid Batches" value={`${data?.freeBatches||0}/${data?.paidBatches||0}`} color="bg-blue-500" sub="free → paid" />
        <KPI icon={DollarSign} label="Revenue Contributed" value={fmtRs(data?.revenue)}    color="bg-purple-500" sub="from my students" />
      </div>

      {/* Lead Funnel + Batch Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHead icon={Target} title="Lead Funnel" sub="My leads by stage" />
          <div className="space-y-3">
            {['new','contacted','interested','converted','lost'].map(stage => {
              const count = leads.filter(l => l.status?.toLowerCase() === stage).length
              return (
                <Bar key={stage}
                  label={stage.charAt(0).toUpperCase()+stage.slice(1)}
                  value={count} max={data?.totalLeads||1} count={count}
                  color={stage==='converted'?'bg-green-500':stage==='lost'?'bg-red-400':stage==='new'?'bg-blue-400':stage==='interested'?'bg-yellow-400':'bg-purple-400'}
                />
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHead icon={GraduationCap} title="Batch Overview" sub="Free vs Paid"
            action={<button onClick={fetchAll} className="p-1.5 hover:bg-gray-100 rounded-lg"><RefreshCw className="w-4 h-4 text-gray-400" /></button>}
          />
          <div className="space-y-3">
            <Bar label="Free Batches" value={data?.freeBatches||0} max={(data?.freeBatches||0)+(data?.paidBatches||0)||1} color="bg-blue-400"  count={data?.freeBatches||0} />
            <Bar label="Paid Batches" value={data?.paidBatches||0} max={(data?.freeBatches||0)+(data?.paidBatches||0)||1} color="bg-green-500" count={data?.paidBatches||0} />
          </div>

          {students.filter(s => !s.isPaid && s.paymentStatus !== 'paid').length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-xs font-semibold text-yellow-700 mb-2 flex items-center gap-1">
                <Bell className="w-3 h-3" />
                {students.filter(s=>!s.isPaid).length} students on free batch
              </p>
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {students.filter(s=>!s.isPaid&&s.paymentStatus!=='paid').map(s=>(
                  <div key={s._id} className="flex items-center justify-between">
                    <p className="text-xs text-gray-700">{`${s.firstName||''} ${s.lastName||''}`.trim()}</p>
                    <button onClick={()=>autoConvertToPaid(s._id)}
                      className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> Convert
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {[{key:'leads',label:'Leads',count:leads.length},{key:'students',label:'Students',count:students.length},{key:'batches',label:'Batches',count:batches.length}].map(t=>(
              <button key={t.key} onClick={()=>setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab===t.key?'bg-white shadow text-[#C8294A]':'text-gray-500 hover:text-gray-700'}`}>
                {t.label}
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${activeTab===t.key?'bg-[#C8294A]/10 text-[#C8294A]':'bg-gray-200 text-gray-500'}`}>{t.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C8294A] w-36" />
            </div>
            {activeTab==='leads' && (
              <button onClick={()=>setPassOnOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">
                <Send className="w-3.5 h-3.5" /> Pass to Counselor
              </button>
            )}
            <ExportButton
              variant="subtle"
              label="Export"
              filename={`My_${activeTab}`}
              title={`My ${activeTab.charAt(0).toUpperCase()}${activeTab.slice(1)}`}
              getRows={buildExportRows}
              className="ml-1"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab==='leads' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Lead Name','Phone','Email','Status','Source','Assigned To','Created'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paged.length===0
                  ? <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No leads found</td></tr>
                  : paged.map((l,i)=>(
                    <tr key={l._id||i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#C8294A]/10 flex items-center justify-center shrink-0">
                            <span className="text-[#C8294A] text-xs font-bold">{(l.name||'?').charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="font-medium text-[#1a1a1a] text-xs">{l.name||'—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{l.phone||'—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-[120px]">{l.email||'—'}</td>
                      <td className="px-4 py-3">
                        <Badge text={l.status||'new'} color={leadStatusColor[l.status?.toLowerCase()]||'bg-gray-100 text-gray-600'} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{l.source||'—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{l.assignedTo?.name||l.assignedTo||'—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(l.createdAt)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}

          {activeTab==='students' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Student','Phone','Batch','Payment','Fee Paid','Admission','Action'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paged.length===0
                  ? <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No students found</td></tr>
                  : paged.map((s,i)=>{
                    const name   = `${s.firstName||''} ${s.lastName||''}`.trim()
                    const isPaid = s.isPaid || s.paymentStatus==='paid'
                    return (
                      <tr key={s._id||i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                              <span className="text-purple-600 text-xs font-bold">{name.charAt(0)||'?'}</span>
                            </div>
                            <span className="font-medium text-[#1a1a1a] text-xs">{name||'—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{s.phone||'—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{s.batch?.name||s.batchName||'—'}</td>
                        <td className="px-4 py-3">
                          <Badge text={isPaid?'Paid':'Free'} color={isPaid?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-600'} />
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-green-700">{fmtRs(s.feePaid||s.totalFee||0)}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(s.admissionDate||s.createdAt)}</td>
                        <td className="px-4 py-3">
                          {!isPaid && (
                            <button onClick={()=>autoConvertToPaid(s._id)}
                              className="flex items-center gap-1 text-xs text-green-600 font-semibold hover:text-green-700">
                              <CreditCard className="w-3.5 h-3.5" /> Convert
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
          )}

          {activeTab==='batches' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Batch Name','Type','Students','Capacity','Status','Start Date','Action'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paged.length===0
                  ? <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No batches found</td></tr>
                  : paged.map((b,i)=>(
                    <tr key={b._id||i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-xs text-[#1a1a1a]">{b.name||'—'}</td>
                      <td className="px-4 py-3">
                        <Badge text={b.isPaid||b.type==='paid'?'Paid':'Free'} color={b.isPaid||b.type==='paid'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 tabular-nums">{b.students?.length||b.studentCount||0}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{b.maxCapacity||b.capacity||'—'}</td>
                      <td className="px-4 py-3">
                        <Badge text={b.isActive!==false?'Active':'Inactive'} color={b.isActive!==false?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(b.startDate)}</td>
                      <td className="px-4 py-3">
                        <button onClick={()=>axiosInstance.patch(
                          API_ENDPOINTS.batches?.update ? API_ENDPOINTS.batches.update(b._id) : `/api/batches/${b._id}`,
                          {isPaid:true}).then(fetchAll)}
                          className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" /> Assign
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
        <Paginator page={page} totalPages={totalPages} setPage={setPage} />
      </div>

      {passOnOpen && (
        <PassOnModal
          items={leads.filter(l=>['new','contacted','interested'].includes(l.status?.toLowerCase()))}
          toRole="Counselor"
          onClose={()=>setPassOnOpen(false)}
          onConfirm={handlePassOn}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── COUNSELOR PANEL ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const CounselorReport = ({ user }) => {
  const [leads,     setLeads]     = useState([])
  const [students,  setStudents]  = useState([])
  const [batches,   setBatches]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [queue,     setQueue]     = useState([])
  const [passOpen,  setPassOpen]  = useState(false)
  const [activeTab, setActiveTab] = useState('queue')
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const PER = 8

  const myId = uid(user)

  const fetchAll = async () => {
    if (!myId) { setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const [leadsRes, studentsRes, batchesRes] = await Promise.all([
        axiosInstance.get(API_ENDPOINTS.leads?.getAll || API_ENDPOINTS.leads?.base || '/api/leads'),
        axiosInstance.get(API_ENDPOINTS.students?.getAll || API_ENDPOINTS.students?.base || '/api/students'),
        axiosInstance.get(API_ENDPOINTS.batches?.getAll || '/api/batches'),
      ])

      const leadsData    = extractArray(leadsRes)
      const studentsData = extractArray(studentsRes)
      const batchesData  = extractArray(batchesRes)

      const myLeads = leadsData.filter(l => {
        const ids = [l.assignedCounselor?._id, l.assignedCounselor, l.assignedTo?._id, l.assignedTo, l.counselor?._id, l.counselor]
        return ids.some(id => id && String(id)===String(myId))
      })
      const myStudents = studentsData.filter(s => {
        const ids = [s.counselor?._id, s.counselor, s.assignedTo?._id, s.assignedTo]
        return ids.some(id => id && String(id)===String(myId))
      })

      const finalLeads    = myLeads.length    > 0 ? myLeads    : leadsData
      const finalStudents = myStudents.length > 0 ? myStudents : studentsData

      setLeads(finalLeads)
      setStudents(finalStudents)
      setBatches(batchesData)
      setQueue(finalLeads.filter(l => ['new','contacted','interested'].includes(l.status?.toLowerCase())))

    } catch (e) {
      console.error('[CounselorReport] ❌', e.response?.data || e.message)
      setError(e.response?.data?.message || e.message || 'Failed to load')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (myId) fetchAll() }, [myId])
  useEffect(() => { setPage(1) }, [search, activeTab])

  const stats = useMemo(() => {
    const converted = leads.filter(l=>l.status?.toLowerCase()==='converted').length
    const paidConv  = students.filter(s=>s.isPaid||s.paymentStatus==='paid').length
    const followUps = leads.filter(l=>l.nextFollowUp&&new Date(l.nextFollowUp)<=new Date()).length
    const revenue   = students.reduce((sum,s)=>sum+(s.totalFee||s.feePaid||0),0)
    const convRate  = leads.length>0?(converted/leads.length)*100:0
    return { queue:queue.length, converted, paidConv, followUps, revenue, convRate }
  }, [leads, students, queue])

  const markFollowUpDone = async (leadId) => {
    try {
      const url = API_ENDPOINTS.leads?.addRemark
        ? API_ENDPOINTS.leads.addRemark(leadId)
        : `/api/leads/${leadId}/remarks`
      await axiosInstance.patch(url, { text: 'Follow-up completed' })
      fetchAll()
    } catch (e) { console.error(e.response?.data||e.message) }
  }

  const finalizeBatch = async (studentId, batchId) => {
    try {
      const url = API_ENDPOINTS.batches?.enroll
        ? API_ENDPOINTS.batches.enroll(batchId)
        : `/api/batches/${batchId}/enroll`
      await axiosInstance.patch(url, { studentId })
      fetchAll()
    } catch (e) { console.error(e.response?.data||e.message) }
  }

  const handlePassToAdmin = async (selectedIds, note) => {
    try {
      await Promise.all(selectedIds.map(id => {
        const url = API_ENDPOINTS.leads?.updateStage
          ? API_ENDPOINTS.leads.updateStage(id)
          : `/api/leads/${id}/stage`
        return axiosInstance.patch(url, { stage: 'converted', note: note||undefined })
      }))
      fetchAll()
    } catch (e) { console.error(e.response?.data||e.message) }
  }

  const buildExportRows = () => {
    const src = activeTab==='queue' ? queue : activeTab==='students' ? students : leads
    return {
      headers: ['Name','Phone','Status','Follow Up','Batch'],
      rows: src.map(item=>[
        item.name||`${item.firstName||''} ${item.lastName||''}`.trim(),
        item.phone||'', item.status||'',
        fmtDate(item.nextFollowUp),
        item.batch?.name||item.batchName||''
      ]),
    }
  }

  const filtered = useMemo(() => {
    const src = activeTab==='queue' ? queue : activeTab==='students' ? students : leads
    if (!search) return src
    const q = search.toLowerCase()
    return src.filter(item=>{
      const name = item.name||`${item.firstName||''} ${item.lastName||''}`.trim()
      return name.toLowerCase().includes(q)||item.phone?.includes(q)
    })
  }, [queue, students, leads, search, activeTab])

  const totalPages = Math.ceil(filtered.length/PER)
  const paged      = filtered.slice((page-1)*PER, page*PER)

  if (loading) return <div className="flex items-center justify-center h-60"><RefreshCw className="w-8 h-8 animate-spin text-[#C8294A]" /></div>
  if (error)   return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
      <div>
        <p className="font-semibold text-red-700 text-sm">{error}</p>
        <button onClick={fetchAll} className="mt-1 text-xs text-red-600 underline">Retry</button>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={ClipboardList} label="Counselling Queue"  value={fmt(stats.queue)}     color="bg-blue-500"   sub="pending" />
        <KPI icon={TrendingUp}    label="Paid Conversions"   value={fmt(stats.paidConv)}  color="bg-green-500"  sub={`${fmtPct(stats.convRate)} rate`} />
        <KPI icon={Bell}          label="Overdue Follow-ups" value={fmt(stats.followUps)} color="bg-orange-500" sub="action needed" />
        <KPI icon={DollarSign}    label="Revenue Converted"  value={fmtRs(stats.revenue)} color="bg-purple-500" sub="from my students" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHead icon={TrendingUp} title="Conversion Tracking" sub="My lead pipeline" />
          <div className="space-y-3">
            {['new','contacted','interested','converted','lost'].map(stage=>{
              const count = leads.filter(l=>l.status?.toLowerCase()===stage).length
              return <Bar key={stage} label={stage.charAt(0).toUpperCase()+stage.slice(1)} value={count} max={leads.length||1} count={count}
                color={stage==='converted'?'bg-green-500':stage==='lost'?'bg-red-400':stage==='interested'?'bg-yellow-400':'bg-blue-400'} />
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHead icon={GraduationCap} title="Student Progress" sub="Batch finalization" />
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {students.length===0
              ? <p className="text-xs text-gray-400 text-center py-4">No students assigned yet</p>
              : students.map((s,i)=>{
                const name = `${s.firstName||''} ${s.lastName||''}`.trim()
                const hasBatch = !!(s.batch?._id||s.batchId)
                return (
                  <div key={s._id||i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                        <span className="text-purple-600 text-xs font-bold">{name.charAt(0)||'?'}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#1a1a1a]">{name}</p>
                        <p className="text-[10px] text-gray-400">{hasBatch?`Batch: ${s.batch?.name||s.batchName}`:'No batch'}</p>
                      </div>
                    </div>
                    {!hasBatch
                      ? <button onClick={()=>{const b=batches[0]?._id; if(b)finalizeBatch(s._id,b)}}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Assign
                        </button>
                      : <Badge text="Assigned" color="bg-green-100 text-green-700" />
                    }
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>

      {stats.followUps > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-bold text-orange-700 mb-2 flex items-center gap-2">
            <Bell className="w-4 h-4" /> {stats.followUps} overdue follow-up{stats.followUps>1?'s':''}
          </p>
          <div className="space-y-1.5">
            {leads.filter(l=>l.nextFollowUp&&new Date(l.nextFollowUp)<=new Date()).slice(0,4).map((l,i)=>(
              <div key={l._id||i} className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#1a1a1a]">{l.name||'—'}</p>
                  <p className="text-[10px] text-orange-500">Due: {fmtDate(l.nextFollowUp)}</p>
                </div>
                <button onClick={()=>markFollowUpDone(l._id)}
                  className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Done
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {[{key:'queue',label:'Queue',count:queue.length},{key:'students',label:'Students',count:students.length},{key:'leads',label:'All Leads',count:leads.length}].map(t=>(
              <button key={t.key} onClick={()=>setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab===t.key?'bg-white shadow text-[#C8294A]':'text-gray-500 hover:text-gray-700'}`}>
                {t.label}
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${activeTab===t.key?'bg-[#C8294A]/10 text-[#C8294A]':'bg-gray-200 text-gray-500'}`}>{t.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C8294A] w-36" />
            </div>
            <button onClick={()=>setPassOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700">
              <Send className="w-3.5 h-3.5" /> Pass to Admin
            </button>
            <ExportButton
              variant="subtle"
              label="Export"
              filename="Counselor"
              title="Counselor Report"
              getRows={buildExportRows}
              className="ml-1"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {(activeTab==='queue'
                  ? ['Name','Phone','Status','Last Contact','Next Follow-up','Action']
                  : activeTab==='students'
                  ? ['Student','Phone','Batch','Payment','Progress','Action']
                  : ['Name','Phone','Status','Updated','Converted','Action']
                ).map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length===0
                ? <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No records found</td></tr>
                : paged.map((item,i)=>{
                  const name = item.name||`${item.firstName||''} ${item.lastName||''}`.trim()
                  return (
                    <tr key={item._id||i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#C8294A]/10 flex items-center justify-center shrink-0">
                            <span className="text-[#C8294A] text-xs font-bold">{(name||'?').charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="font-medium text-xs text-[#1a1a1a]">{name||'—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{item.phone||'—'}</td>
                      <td className="px-4 py-3">
                        {activeTab==='students'
                          ? <span className="text-xs text-gray-500">{item.batch?.name||item.batchName||'—'}</span>
                          : <Badge text={item.status||'new'} color={leadStatusColor[item.status?.toLowerCase()]||'bg-gray-100 text-gray-600'} />
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {activeTab==='students'
                          ? <Badge text={item.isPaid?'Paid':'Free'} color={item.isPaid?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-600'} />
                          : fmtDate(item.lastContactDate||item.updatedAt)
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {activeTab==='students'
                          ? <div className="flex items-center gap-1">
                              <div className="h-1.5 bg-gray-100 rounded-full w-16 overflow-hidden">
                                <div className="h-full bg-green-400 rounded-full" style={{width:`${item.progress||0}%`}} />
                              </div>
                              <span className="text-[10px]">{item.progress||0}%</span>
                            </div>
                          : item.status?.toLowerCase()==='converted'
                            ? <Badge text="Yes" color="bg-green-100 text-green-700" />
                            : <Badge text="No"  color="bg-gray-100 text-gray-500" />
                        }
                      </td>
                      <td className="px-4 py-3">
                        {activeTab!=='students'&&item.nextFollowUp&&new Date(item.nextFollowUp)<=new Date()
                          ? <button onClick={()=>markFollowUpDone(item._id)}
                              className="text-xs text-green-600 font-semibold flex items-center gap-1 hover:text-green-700">
                              <CheckCircle className="w-3.5 h-3.5" /> Done
                            </button>
                          : activeTab==='students'&&!item.batch
                            ? <button onClick={()=>batches[0]&&finalizeBatch(item._id,batches[0]._id)}
                                className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Batch
                              </button>
                            : <span className="text-xs text-gray-300">—</span>
                        }
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
        <Paginator page={page} totalPages={totalPages} setPage={setPage} />
      </div>

      {passOpen && (
        <PassOnModal
          items={students.filter(s=>s.isPaid||s.paymentStatus==='paid')}
          toRole="Admin"
          onClose={()=>setPassOpen(false)}
          onConfirm={handlePassToAdmin}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── TEACHER PANEL ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const TeacherReport = ({ user }) => {
  const [batches,  setBatches]  = useState([])
  const [students, setStudents] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [activeTab,setActiveTab]= useState('batches')
  const [search,   setSearch]   = useState('')
  const [page,     setPage]     = useState(1)
  const PER = 8

  const myId = uid(user)

  const fetchAll = async () => {
    if (!myId) { setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const [batchesRes, studentsRes] = await Promise.all([
        axiosInstance.get(API_ENDPOINTS.batches?.getAll || '/api/batches'),
        axiosInstance.get(API_ENDPOINTS.students?.getAll || API_ENDPOINTS.students?.base || '/api/students'),
      ])
      const batchesData  = extractArray(batchesRes)
      const studentsData = extractArray(studentsRes)

      const myBatches = batchesData.filter(b => {
        const ids = [b.teacher?._id, b.teacher, b.assignedTeacher?._id, b.assignedTeacher, b.createdBy?._id, b.createdBy]
        return ids.some(id => id && String(id)===String(myId))
      })

      const finalBatches  = myBatches.length > 0 ? myBatches : batchesData
      const myBatchIds    = new Set(finalBatches.map(b=>String(b._id)))
      const myStudents    = studentsData.filter(s => myBatchIds.has(String(s.batch?._id||s.batchId)))

      setBatches(finalBatches)
      setStudents(myStudents)
    } catch (e) {
      console.error('[TeacherReport] ❌', e.response?.data||e.message)
      setError(e.response?.data?.message||e.message||'Failed to load')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (myId) fetchAll() }, [myId])
  useEffect(() => { setPage(1) }, [search, activeTab])

  const stats = useMemo(() => ({
    totalBatches:  batches.length,
    totalStudents: students.length,
    paidStudents:  students.filter(s=>s.isPaid||s.paymentStatus==='paid').length,
    activeBatches: batches.filter(b=>b.isActive!==false).length,
  }), [batches, students])

  const filtered = useMemo(() => {
    const src = activeTab==='batches' ? batches : students
    if (!search) return src
    const q = search.toLowerCase()
    return src.filter(item => {
      const name = item.name||`${item.firstName||''} ${item.lastName||''}`.trim()
      return name.toLowerCase().includes(q)
    })
  }, [batches, students, search, activeTab])

  const totalPages = Math.ceil(filtered.length/PER)
  const paged      = filtered.slice((page-1)*PER, page*PER)

  if (loading) return <div className="flex items-center justify-center h-60"><RefreshCw className="w-8 h-8 animate-spin text-[#C8294A]" /></div>
  if (error)   return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
      <div>
        <p className="font-semibold text-red-700 text-sm">{error}</p>
        <button onClick={fetchAll} className="mt-1 text-xs text-red-600 underline">Retry</button>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={BookOpen}    label="My Batches"     value={fmt(stats.totalBatches)}  color="bg-[#C8294A]"  sub="assigned to me" />
        <KPI icon={Users}       label="My Students"    value={fmt(stats.totalStudents)} color="bg-blue-500"   sub="across batches" />
        <KPI icon={UserCheck}   label="Paid Students"  value={fmt(stats.paidStudents)}  color="bg-green-500"  sub="confirmed" />
        <KPI icon={CheckCircle} label="Active Batches" value={fmt(stats.activeBatches)} color="bg-purple-500" sub="running" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {[{key:'batches',label:'Batches',count:batches.length},{key:'students',label:'Students',count:students.length}].map(t=>(
              <button key={t.key} onClick={()=>setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab===t.key?'bg-white shadow text-[#C8294A]':'text-gray-500 hover:text-gray-700'}`}>
                {t.label}
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${activeTab===t.key?'bg-[#C8294A]/10 text-[#C8294A]':'bg-gray-200 text-gray-500'}`}>{t.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C8294A] w-36" />
            </div>
            <button onClick={()=>{
              const src = activeTab==='batches'?batches:students
              const csv = [
                activeTab==='batches'?['Batch','Type','Students','Status','Start']:['Student','Phone','Batch','Payment','Joined'],
                ...src.map(item=>activeTab==='batches'
                  ?[item.name||'',item.isPaid?'Paid':'Free',item.students?.length||0,item.isActive!==false?'Active':'Inactive',fmtDate(item.startDate)]
                  :[`${item.firstName||''} ${item.lastName||''}`.trim(),item.phone||'',item.batch?.name||'',item.isPaid?'Paid':'Free',fmtDate(item.createdAt)]
                )
              ].map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')
              const blob = new Blob([csv],{type:'text/csv'})
              Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:`Teacher_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`}).click()
            }} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {(activeTab==='batches'
                  ?['Batch Name','Type','Students','Status','Start Date','View']
                  :['Student','Phone','Batch','Payment','Progress','Joined']
                ).map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length===0
                ? <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No records found</td></tr>
                : paged.map((item,i)=>(
                  <tr key={item._id||i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-xs text-[#1a1a1a]">
                      {activeTab==='batches' ? item.name||'—' : `${item.firstName||''} ${item.lastName||''}`.trim()||'—'}
                    </td>
                    <td className="px-4 py-3">
                      {activeTab==='batches'
                        ? <Badge text={item.isPaid||item.type==='paid'?'Paid':'Free'} color={item.isPaid||item.type==='paid'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'} />
                        : <span className="text-xs text-gray-500">{item.phone||'—'}</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 tabular-nums">
                      {activeTab==='batches' ? item.students?.length||item.studentCount||0 : item.batch?.name||item.batchName||'—'}
                    </td>
                    <td className="px-4 py-3">
                      {activeTab==='batches'
                        ? <Badge text={item.isActive!==false?'Active':'Inactive'} color={item.isActive!==false?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'} />
                        : <Badge text={item.isPaid?'Paid':'Free'} color={item.isPaid?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-600'} />
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {activeTab==='batches'
                        ? fmtDate(item.startDate)
                        : <div className="flex items-center gap-1">
                            <div className="h-1.5 bg-gray-100 rounded-full w-12 overflow-hidden">
                              <div className="h-full bg-green-400 rounded-full" style={{width:`${item.progress||0}%`}} />
                            </div>
                            <span className="text-[10px]">{item.progress||0}%</span>
                          </div>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {activeTab==='batches'
                        ? <button className="text-xs text-[#C8294A] font-semibold flex items-center gap-1 hover:underline">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        : fmtDate(item.createdAt)
                      }
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <Paginator page={page} totalPages={totalPages} setPage={setPage} />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── ROOT MyReports ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const MyReports = () => {
  const [user,        setUser]        = useState(null)
  const [userLoading, setUserLoading] = useState(true)

  useEffect(() => {
    // ✅ FIX: try all common localStorage keys
    const u = getStoredUser()
    console.log('[MyReports] user from localStorage:', u)
    setUser(u)
    setUserLoading(false)
  }, [])

  const role = (
    user?.staffRole || user?.role || user?.userType || ''
  ).toLowerCase().trim()

  const ALL_TABS = [
    { key: 'telecaller', label: 'Telecaller', roles: ['telecaller'] },
    { key: 'counselor',  label: 'Counselor',  roles: ['counselor']  },
    { key: 'teacher',    label: 'Teacher',    roles: ['teacher']    },
  ]

  // ✅ FIX: admin sees all, staff sees only their role
  const TABS = role === 'admin'
    ? ALL_TABS
    : ALL_TABS.filter(t => t.roles.includes(role))

  // ✅ FIX: set default panel AFTER user loads
  const [activePanel, setActivePanel] = useState('')
  useEffect(() => {
    if (TABS.length > 0 && !activePanel) {
      setActivePanel(TABS[0].key)
    }
  }, [role])

  if (userLoading) return (
    <div className="flex items-center justify-center h-60">
      <RefreshCw className="w-8 h-8 animate-spin text-[#C8294A]" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">My Reports</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {user
              ? `${user.firstName||user.name||'Staff'} · ${user.staffRole||user.role||'Staff'}`
              : ' User not found in localStorage'
            }
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </div>
      </div>

      {/* Role tabs (admin sees all) */}
      {TABS.length > 1 && (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActivePanel(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activePanel===t.key ? 'bg-white shadow text-[#C8294A]' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {activePanel === 'telecaller' && <TelecallerReport user={user} />}
      {activePanel === 'counselor'  && <CounselorReport  user={user} />}
      {activePanel === 'teacher'    && <TeacherReport    user={user} />}

      {TABS.length === 0 && (
        <div className="flex flex-col items-center justify-center h-60 bg-white rounded-2xl border border-gray-100">
          <AlertCircle className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-400 font-medium">No reports for your role</p>
          <p className="text-xs text-gray-300 mt-1">
            Detected role: <strong>"{role || 'none'}"</strong> — expected: telecaller / counselor / teacher
          </p>
          <p className="text-xs text-gray-300 mt-0.5">
            Check your localStorage key and staffRole field name
          </p>
        </div>
      )}
    </div>
  )
}

export default MyReports
