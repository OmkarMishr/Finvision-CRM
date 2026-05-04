import React, { useState, useEffect } from 'react';
import {
  Users2, Search, Filter, Eye, Trash2, RefreshCw, Download,
  ChevronLeft, ChevronRight, X, UserCheck, UserX, Shield,
  Briefcase, Clock, CheckCircle, XCircle, User, Plus,
  Phone, Mail, Calendar, ClipboardList, AlertCircle,
  CheckSquare, Ban, MessageSquare, CalendarDays, TrendingUp,
  Pencil, Wallet, FileMinus
} from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { API_ENDPOINTS } from '../../../config/api';
import ExportButton from '../../common/ExportButton';

// ─── Leave Type Config ────────────────────────────────────────────────────────
const LEAVE_TYPE_CONFIG = {
  casual:    { color: 'bg-blue-100   text-blue-700',   dot: 'bg-blue-500'   },
  sick:      { color: 'bg-red-100    text-red-700',    dot: 'bg-red-500'    },
  earned:    { color: 'bg-green-100  text-green-700',  dot: 'bg-green-500'  },
  halfday:   { color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  emergency: { color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  unpaid:    { color: 'bg-gray-100   text-gray-600',   dot: 'bg-gray-400'   },
};

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  telecaller: { color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  counselor:  { color: 'bg-blue-100   text-blue-700',   dot: 'bg-blue-500'   },
  Teacher:    { color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
};

const STAFF_ROLES = ['Teacher', 'counselor', 'telecaller'];

const DEPARTMENTS = [
  'Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'IT', 'Operations', 'Other'
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  }) : '—';

const daysBetween = (from, to) => {
  if (!from || !to) return 0;
  return Math.max(Math.floor((new Date(to) - new Date(from)) / 86400000) + 1, 0);
};

// ─── Badges ───────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const cfg = ROLE_CONFIG[role] || { color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {role || 'Staff'}
    </span>
  );
};

const LeaveTypeBadge = ({ type }) => {
  const cfg = LEAVE_TYPE_CONFIG[type?.toLowerCase()]
    || { color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {type ? type.charAt(0).toUpperCase() + type.slice(1) : '—'}
    </span>
  );
};

const LeaveStatusBadge = ({ status }) => {
  const map = {
    pending:   'bg-yellow-100 text-yellow-700',
    approved:  'bg-green-100  text-green-700',
    rejected:  'bg-red-100    text-red-700',
    cancelled: 'bg-gray-100   text-gray-500',
  };
  const icons = { pending: Clock, approved: CheckCircle, rejected: XCircle, cancelled: Ban };
  const Icon  = icons[status?.toLowerCase()] || Clock;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${map[status?.toLowerCase()] || 'bg-gray-100 text-gray-500'}`}>
      <Icon className="w-3 h-3" />
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, bg }) => (
  <div className={`${bg} text-white p-5 rounded-xl shadow-lg flex justify-between items-start`}>
    <div>
      <p className="text-white/80 text-sm font-medium">{label}</p>
      <h3 className="text-3xl font-bold mt-1">{value}</h3>
    </div>
    <div className="bg-white/20 p-2.5 rounded-lg">
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

// ─── Change Role Modal ────────────────────────────────────────────────────────
const ChangeRoleModal = ({ staff, onClose, onSuccess }) => {
  const [selectedRole, setSelectedRole] = useState(staff?.staffRole || '');
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');

  if (!staff) return null;

  const displayName = staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'Unknown';

  const handleSave = async () => {
    if (!selectedRole || selectedRole === staff.staffRole) {
      setError('Please select a different role to change.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await axiosInstance.put(API_ENDPOINTS.staff.update(staff._id), {
        staffRole: selectedRole,
      });
      onSuccess(staff._id, selectedRole);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update role. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-[#C8294A]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#C8294A]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#1a1a1a]">Change Staff Role</h3>
            <p className="text-sm text-gray-500 truncate">{displayName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Current Role */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1.5">Current Role</p>
          <RoleBadge role={staff.staffRole} />
        </div>

        {/* Role Options */}
        <p className="text-sm font-semibold text-gray-700 mb-3">Select New Role</p>
        <div className="space-y-2 mb-5">
          {STAFF_ROLES.map(role => {
            const cfg      = ROLE_CONFIG[role] || { dot: 'bg-gray-400' };
            const isActive = selectedRole === role;
            const isCurrent = role === staff.staffRole;
            return (
              <button
                key={role}
                type="button"
                onClick={() => { setSelectedRole(role); setError(''); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  isActive
                    ? 'border-[#C8294A] bg-[#C8294A]/5'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <span className={`w-3 h-3 rounded-full shrink-0 ${cfg.dot}`} />
                <span className={`flex-1 text-sm font-medium ${isActive ? 'text-[#C8294A]' : 'text-[#1a1a1a]'}`}>
                  {role}
                </span>
                {isCurrent && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                    Current
                  </span>
                )}
                {isActive && !isCurrent && (
                  <CheckCircle className="w-4 h-4 text-[#C8294A] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedRole || selectedRole === staff.staffRole}
            className="flex-1 px-4 py-2.5 bg-[#C8294A] text-white rounded-xl text-sm font-semibold hover:bg-[#a8213a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {saving
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
              : <><CheckCircle className="w-4 h-4" /> Save Role</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Leave Review Modal ───────────────────────────────────────────────────────
const LeaveReviewModal = ({ leave, onClose, onReviewed }) => {
  const [status,       setStatus]       = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');

  if (!leave) return null;

  const staffName = leave.staffName
    || `${leave.staff?.firstName || ''} ${leave.staff?.lastName || ''}`.trim()
    || 'Unknown';

  const handleReview = async () => {
    if (!status) { setError('Please select Approve or Reject'); return; }
    setSubmitting(true);
    setError('');
    try {
      await axiosInstance.patch(API_ENDPOINTS.leave.admin.review(leave._id), {
        status, adminRemarks: adminRemarks.trim() || undefined,
      });
      onReviewed();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Review failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C8294A]/10 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[#C8294A]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a]">Review Leave</h2>
              <p className="text-xs text-gray-400">Application #{leave._id?.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Staff Info */}
          <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
            <div className="w-12 h-12 rounded-full bg-[#C8294A]/10 flex items-center justify-center shrink-0">
              <span className="text-[#C8294A] text-lg font-bold">
                {staffName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-bold text-[#1a1a1a]">{staffName}</p>
              <p className="text-xs text-gray-500">{leave.staffEmail}</p>
              <RoleBadge role={leave.staffRole} />
            </div>
          </div>

          {/* Leave Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Leave Type</p>
              <LeaveTypeBadge type={leave.leaveType} />
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Duration</p>
              <p className="text-sm font-bold text-[#1a1a1a]">
                {leave.isHalfDay
                  ? `0.5 day (${leave.halfDaySlot})`
                  : `${leave.totalDays || daysBetween(leave.fromDate, leave.toDate)} day${(leave.totalDays || 1) > 1 ? 's' : ''}`
                }
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">From</p>
              <p className="text-sm font-semibold text-[#1a1a1a]">{fmtDate(leave.fromDate)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">To</p>
              <p className="text-sm font-semibold text-[#1a1a1a]">{fmtDate(leave.toDate)}</p>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">Reason</p>
            <p className="text-sm text-gray-700 leading-relaxed">{leave.reason}</p>
          </div>

          {/* Contact */}
          {leave.contactNo && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              Emergency contact: <span className="font-medium">{leave.contactNo}</span>
            </div>
          )}

          {/* Applied On */}
          <p className="text-xs text-gray-400">Applied on {fmtDate(leave.createdAt)}</p>

          {/* Decision Buttons */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Decision *</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('approved')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                  status === 'approved'
                    ? 'bg-green-500 border-green-500 text-white shadow-md'
                    : 'border-green-200 text-green-700 hover:bg-green-50'
                }`}
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button
                type="button"
                onClick={() => setStatus('rejected')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                  status === 'rejected'
                    ? 'bg-red-500 border-red-500 text-white shadow-md'
                    : 'border-red-200 text-red-700 hover:bg-red-50'
                }`}
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Remarks{' '}
              <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={adminRemarks}
              onChange={e => setAdminRemarks(e.target.value)}
              placeholder="Add a note for the staff member…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleReview}
              disabled={submitting || !status}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all ${
                !status
                  ? 'bg-gray-300 cursor-not-allowed'
                  : status === 'approved'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {submitting
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing…</>
                : status === 'approved'
                  ? <><CheckCircle className="w-4 h-4" /> Confirm Approval</>
                  : status === 'rejected'
                    ? <><XCircle className="w-4 h-4" /> Confirm Rejection</>
                    : 'Select a Decision'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Staff Detail Modal ───────────────────────────────────────────────────────
// ─── Monthly attendance + leave + salary computation ─────────────────────────
// Payroll formula:
//   workingDays  = days in month minus Sundays (Mon–Sat schedule by default)
//   presentDays  = attendance rows in [Present, Late]   (Half Day counts 0.5)
//   paidLeave    = approved leaves NOT of type "unpaid" (halfday counts 0.5)
//   unpaidLeave  = approved leaves of type "unpaid"
//   absent       = workingDays − presentDays − paidLeave − unpaidLeave (≥0)
//   paidDays     = presentDays + paidLeave
//   payable      = baseSalary × paidDays / workingDays
const buildPayroll = ({ baseSalary, attendance, leaves, year, month }) => {
  // Days in month (month is 0-indexed) — `new Date(y, m+1, 0).getDate()`
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, month, d).getDay() !== 0) workingDays++; // Sunday = off
  }

  // Attendance — restrict to this month
  const inMonth = (date) => {
    if (!date) return false;
    const x = new Date(date);
    return x.getFullYear() === year && x.getMonth() === month;
  };

  const monthAttendance = attendance.filter(a => inMonth(a.date));
  let presentDays = 0;
  for (const a of monthAttendance) {
    if (a.status === 'Half Day') presentDays += 0.5;
    else if (['Present', 'Late'].includes(a.status)) presentDays += 1;
  }

  // Leave — approved only, overlapping this month
  const monthStart = new Date(year, month, 1);
  const monthEnd   = new Date(year, month + 1, 0, 23, 59, 59, 999);

  // Count days an approved leave overlaps within this month (Sundays excluded
  // so an overlap that's entirely on Sundays doesn't reduce the salary).
  const overlapDays = (l) => {
    const s = new Date(Math.max(new Date(l.fromDate).getTime(), monthStart.getTime()));
    const e = new Date(Math.min(new Date(l.toDate).getTime(),   monthEnd.getTime()));
    if (e < s) return 0;
    if (l.isHalfDay) return 0.5;
    let count = 0;
    const cursor = new Date(s); cursor.setHours(0, 0, 0, 0);
    while (cursor <= e) {
      if (cursor.getDay() !== 0) count++;
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  };

  const approved = leaves.filter(l =>
    l.status === 'approved' &&
    new Date(l.fromDate) <= monthEnd && new Date(l.toDate) >= monthStart
  );
  let paidLeave = 0, unpaidLeave = 0;
  for (const l of approved) {
    const days = overlapDays(l);
    if (l.leaveType === 'unpaid') unpaidLeave += days;
    else                          paidLeave   += days;
  }

  const accounted = presentDays + paidLeave + unpaidLeave;
  const absent    = Math.max(0, workingDays - accounted);
  const paidDays  = presentDays + paidLeave;
  const payable   = workingDays > 0
    ? Math.round((Number(baseSalary) || 0) * (paidDays / workingDays))
    : 0;

  return {
    workingDays, presentDays, paidLeave, unpaidLeave, absent, paidDays, payable,
    leaveCount: approved.length,
  };
};

const StaffPayrollPanel = ({ staff }) => {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const [attendance, setAttendance] = useState([]);
  const [leaves,     setLeaves]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => {
    if (!staff?._id) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError('');
      const startDate = new Date(year, month,     1).toISOString();
      const endDate   = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
      try {
        const [attRes, leaveRes] = await Promise.allSettled([
          axiosInstance.get(API_ENDPOINTS.staffAttendance.getAll, {
            params: { userId: staff._id, startDate, endDate },
          }),
          axiosInstance.get(API_ENDPOINTS.leave.admin.all, {
            params: { staffId: staff._id, fromDate: startDate, toDate: endDate, status: 'approved', limit: 100 },
          }),
        ]);
        if (cancelled) return;
        if (attRes.status === 'fulfilled') {
          const d = attRes.value.data;
          setAttendance(Array.isArray(d) ? d : d?.data || []);
        } else {
          setAttendance([]);
        }
        if (leaveRes.status === 'fulfilled') {
          const d = leaveRes.value.data;
          // Tolerate { data: { records: [] } } and { records: [] } shapes
          const records = d?.data?.records || d?.records || d?.data || [];
          setLeaves(Array.isArray(records) ? records : []);
        } else {
          setLeaves([]);
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load payroll data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [staff?._id, year, month]);

  const payroll = React.useMemo(
    () => buildPayroll({
      baseSalary: staff?.staffInfo?.salary || 0,
      attendance, leaves, year, month,
    }),
    [staff?.staffInfo?.salary, attendance, leaves, year, month]
  );

  const monthOptions = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  // 24 months back from today, present month first
  const yearOptions = [];
  for (let i = -2; i <= 0; i++) yearOptions.push(today.getFullYear() + i);

  const baseSalary = Number(staff?.staffInfo?.salary) || 0;

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#C8294A]/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-[#C8294A]" />
          </div>
          <h4 className="font-semibold text-[#1a1a1a] text-sm">Monthly Attendance & Salary</h4>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#C8294A]">
            {monthOptions.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#C8294A]">
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-6 text-gray-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <>
          {/* Attendance / leave breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { label: 'Working Days',  value: payroll.workingDays,  color: 'text-[#1a1a1a]', icon: CalendarDays },
              { label: 'Present',       value: payroll.presentDays,  color: 'text-green-600', icon: CheckCircle  },
              { label: 'Paid Leave',    value: payroll.paidLeave,    color: 'text-blue-600',  icon: ClipboardList },
              { label: 'Unpaid Leave',  value: payroll.unpaidLeave,  color: 'text-orange-600',icon: FileMinus    },
              { label: 'Absent',        value: payroll.absent,       color: 'text-red-600',   icon: XCircle      },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-white rounded-lg p-2.5 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">{label}</p>
                </div>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Salary computation */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-gray-500">Base Salary</p>
                <p className="text-base font-semibold text-[#1a1a1a]">
                  {baseSalary > 0 ? `₹${baseSalary.toLocaleString('en-IN')}` : 'Not set'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  Payable for {monthOptions[month]} {year}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{payroll.payable.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {payroll.paidDays}/{payroll.workingDays} paid days
                  {' · '}
                  {payroll.workingDays > 0
                    ? `₹${Math.round(baseSalary / payroll.workingDays).toLocaleString('en-IN')}/day`
                    : '—'}
                </p>
              </div>
            </div>
            {baseSalary === 0 && (
              <p className="text-[11px] text-orange-600 mt-2">
                Set a salary in this staff member's profile to compute payable amount.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const StaffModal = ({ staff, onClose }) => {
  if (!staff) return null;
  const displayName = staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'Unknown';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Staff Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#C8294A]/10 flex items-center justify-center overflow-hidden">
              {staff.profilePhoto
                ? <img src={staff.profilePhoto} alt={displayName} className="w-16 h-16 rounded-full object-cover" />
                : <span className="text-[#C8294A] text-2xl font-bold">{displayName.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1a1a1a]">{displayName}</h3>
              <p className="text-sm text-gray-500">ID: {staff._id?.slice(-8).toUpperCase()}</p>
              <div className="flex items-center gap-2 mt-1">
                <RoleBadge role={staff.staffRole} />
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  staff.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {staff.isActive !== false
                    ? <><CheckCircle className="w-3 h-3" /> Active</>
                    : <><XCircle    className="w-3 h-3" /> Inactive</>}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: Phone,     label: 'Phone',      value: staff.phone },
              { icon: Mail,      label: 'Email',      value: staff.email },
              { icon: Shield,    label: 'Staff Role', value: staff.staffRole },
              { icon: Briefcase, label: 'Department', value: staff.staffInfo?.department },
              { icon: User,      label: 'Subject',    value: staff.staffInfo?.subject },
              { icon: Calendar,  label: 'Joined',     value: staff.staffInfo?.joiningDate
                  ? new Date(staff.staffInfo.joiningDate).toLocaleDateString('en-IN')
                  : staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-IN') : 'N/A'
              },
              { icon: Clock, label: 'Last Login', value: staff.lastLogin
                  ? new Date(staff.lastLogin).toLocaleString('en-IN') : 'N/A'
              },
            ].map(({ icon: Icon, label, value }) =>
              value && value !== 'N/A' ? (
                <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Icon className="w-4 h-4 text-[#C8294A] shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-semibold text-[#1a1a1a]">{value}</p>
                  </div>
                </div>
              ) : null
            )}
          </div>
          {staff.staffInfo?.salary && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-[#1a1a1a] mb-2 text-sm">Employment Info</h4>
              <div className="grid grid-cols-2 gap-3">
                {staff.staffInfo.employeeId && (
                  <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                    <p className="text-xs text-gray-500">Employee ID</p>
                    <p className="text-sm font-bold text-[#1a1a1a]">{staff.staffInfo.employeeId}</p>
                  </div>
                )}
                <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                  <p className="text-xs text-gray-500">Salary</p>
                  <p className="text-sm font-bold text-green-600">₹{staff.staffInfo.salary.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Monthly attendance, leave breakdown + computed payable salary */}
          <StaffPayrollPanel staff={staff} />
        </div>
      </div>
    </div>
  );
};

// ─── Add Staff Modal ──────────────────────────────────────────────────────────
const AddStaffModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    phone: '', staffRole: 'Teacher', department: '', subject: '', salary: '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await axiosInstance.post(API_ENDPOINTS.staff.create, {
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, password: form.password, phone: form.phone,
        staffRole: form.staffRole,
        department: form.department || undefined,
        subject:    form.subject    || undefined,
        salary:     form.salary     ? Number(form.salary) : undefined,
      });
      onSuccess(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add staff member');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A]";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Add Staff Member</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelCls}>First Name *</label>
              <input required value={form.firstName} onChange={set('firstName')} placeholder="John" className={inputCls} /></div>
            <div><label className={labelCls}>Last Name *</label>
              <input required value={form.lastName} onChange={set('lastName')} placeholder="Doe" className={inputCls} /></div>
            <div><label className={labelCls}>Email *</label>
              <input required type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" className={inputCls} /></div>
            <div><label className={labelCls}>Password *</label>
              <input required type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" className={inputCls} /></div>
            <div><label className={labelCls}>Phone</label>
              <input value={form.phone} onChange={set('phone')} placeholder="9876543210" className={inputCls} /></div>
            <div><label className={labelCls}>Staff Role *</label>
              <select value={form.staffRole} onChange={set('staffRole')} className={`${inputCls} bg-white`}>
                <option value="Teacher">Teacher</option>
                <option value="counselor">Counselor</option>
                <option value="telecaller">Telecaller</option>
              </select></div>
            <div><label className={labelCls}>Department</label>
              <select value={form.department} onChange={set('department')} className={`${inputCls} bg-white`}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select></div>
            <div><label className={labelCls}>Subject</label>
              <input value={form.subject} onChange={set('subject')} placeholder="e.g. Algebra" className={inputCls} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Salary (₹)</label>
              <input type="number" value={form.salary} onChange={set('salary')} placeholder="e.g. 35000" className={inputCls} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 bg-[#C8294A] text-white rounded-lg text-sm font-medium hover:bg-[#a01f39] disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Adding...</>
                : <><Plus className="w-4 h-4" /> Add Staff</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Edit Staff Modal ─────────────────────────────────────────────────────────
// Same field set as AddStaffModal *minus* password (use "Reset Password" for
// that), pre-filled from the row the admin clicked.
const EditStaffModal = ({ staff, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    firstName:  staff?.firstName            || '',
    lastName:   staff?.lastName             || '',
    email:      staff?.email                || '',
    phone:      staff?.phone                || '',
    staffRole:  staff?.staffRole            || 'Teacher',
    department: staff?.staffInfo?.department || '',
    subject:    staff?.staffInfo?.subject    || '',
    salary:     staff?.staffInfo?.salary != null ? String(staff.staffInfo.salary) : '',
    employeeId: staff?.staffInfo?.employeeId || '',
    isActive:   staff?.isActive !== false,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await axiosInstance.put(API_ENDPOINTS.staff.update(staff._id), {
        firstName:  form.firstName,
        lastName:   form.lastName,
        email:      form.email,
        phone:      form.phone || null,
        staffRole:  form.staffRole,
        isActive:   form.isActive,
        // Backend nests these under staffInfo.* — controller handles the dot path.
        department: form.department || null,
        subject:    form.subject    || null,
        employeeId: form.employeeId || null,
        salary:     form.salary === '' ? null : Number(form.salary),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update staff member');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A]";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-[#1a1a1a]">Edit Staff Member</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {`${staff.firstName || ''} ${staff.lastName || ''}`.trim() || staff.email}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelCls}>First Name *</label>
              <input required value={form.firstName} onChange={set('firstName')} className={inputCls} /></div>
            <div><label className={labelCls}>Last Name *</label>
              <input required value={form.lastName} onChange={set('lastName')} className={inputCls} /></div>
            <div><label className={labelCls}>Email *</label>
              <input required type="email" value={form.email} onChange={set('email')} className={inputCls} /></div>
            <div><label className={labelCls}>Phone</label>
              <input value={form.phone} onChange={set('phone')} placeholder="9876543210" className={inputCls} /></div>
            <div><label className={labelCls}>Staff Role *</label>
              <select value={form.staffRole} onChange={set('staffRole')} className={`${inputCls} bg-white`}>
                <option value="Teacher">Teacher</option>
                <option value="counselor">Counselor</option>
                <option value="telecaller">Telecaller</option>
              </select></div>
            <div><label className={labelCls}>Department</label>
              <select value={form.department} onChange={set('department')} className={`${inputCls} bg-white`}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select></div>
            <div><label className={labelCls}>Subject</label>
              <input value={form.subject} onChange={set('subject')} placeholder="e.g. Algebra" className={inputCls} /></div>
            <div><label className={labelCls}>Employee ID</label>
              <input value={form.employeeId} onChange={set('employeeId')} placeholder="e.g. EMP00123" className={inputCls} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Salary (₹ / month)</label>
              <input type="number" min="0" value={form.salary} onChange={set('salary')} placeholder="e.g. 35000" className={inputCls} /></div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#1a1a1a]">Account Active</p>
              <p className="text-xs text-gray-500">Inactive accounts cannot log in</p>
            </div>
            <button type="button"
              onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${form.isActive ? 'bg-[#C8294A]' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <p className="text-[11px] text-gray-400">
            Tip: use the <strong>Change Role</strong> shortcut for quick role swaps and <strong>Reset Password</strong> from the staff list to issue a new password.
          </p>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 bg-[#C8294A] text-white rounded-lg text-sm font-medium hover:bg-[#a01f39] disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                : <><CheckSquare className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Leave Approvals Tab ──────────────────────────────────────────────────────
const LeaveApprovalsTab = () => {
  const [leaves,       setLeaves]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterType,   setFilterType]   = useState('all');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const [reviewLeave,  setReviewLeave]  = useState(null);
  const [stats,        setStats]        = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const PER_PAGE = 8;

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res  = await axiosInstance.get(API_ENDPOINTS.leave.admin.all);
      const data =
        Array.isArray(res.data?.data?.records) ? res.data.data.records
        : Array.isArray(res.data?.data)         ? res.data.data
        : Array.isArray(res.data)               ? res.data
        : [];
      setLeaves(data);
      setStats({
        total:    data.length,
        pending:  data.filter(l => l.status === 'pending').length,
        approved: data.filter(l => l.status === 'approved').length,
        rejected: data.filter(l => l.status === 'rejected').length,
      });
    } catch { setLeaves([]); }
    finally   { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const filtered = leaves.filter(l => {
    const name = l.staffName
      || `${l.staff?.firstName || ''} ${l.staff?.lastName || ''}`.trim() || '';
    const matchSearch = !search
      || name.toLowerCase().includes(search.toLowerCase())
      || l.staffEmail?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchType   = filterType   === 'all' || l.leaveType === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-5">

      {/* Leave Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Total Applications" value={stats.total}    bg="bg-[#1a1a1a]"  />
        <StatCard icon={Clock}         label="Pending Review"     value={stats.pending}  bg="bg-yellow-500" />
        <StatCard icon={CheckSquare}   label="Approved"           value={stats.approved} bg="bg-green-600"  />
        <StatCard icon={XCircle}       label="Rejected"           value={stats.rejected} bg="bg-[#C8294A]"  />
      </div>

      {/* Pending Alert Banner */}
      {stats.pending > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-sm text-yellow-800 font-medium">
            <strong>{stats.pending}</strong> leave application{stats.pending > 1 ? 's' : ''} waiting for your review
          </p>
          <button
            onClick={() => { setFilterStatus('pending'); setPage(1); }}
            className="ml-auto text-xs font-semibold text-yellow-700 underline hover:no-underline"
          >
            View Pending
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white">
          <option value="all">All Types</option>
          {Object.keys(LEAVE_TYPE_CONFIG).map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <button onClick={fetchLeaves}
          className="px-3 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2d2d2d] flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
          <Filter className="w-4 h-4" />
          <span>{filtered.length} results</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-[#C8294A] mb-2" />
            <p className="text-gray-400 text-sm">Loading applications…</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Staff Member', 'Leave Type', 'From', 'To', 'Days', 'Reason', 'Applied On', 'Status', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-14">
                        <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No leave applications found</p>
                      </td>
                    </tr>
                  ) : paged.map((l, i) => {
                    const name = l.staffName
                      || `${l.staff?.firstName || ''} ${l.staff?.lastName || ''}`.trim()
                      || 'Unknown';
                    return (
                      <tr key={l._id || i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#C8294A]/10 flex items-center justify-center shrink-0">
                              <span className="text-[#C8294A] text-xs font-bold">{name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-[#1a1a1a] text-xs">{name}</p>
                              <p className="text-[10px] text-gray-400">{l.staffEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><LeaveTypeBadge type={l.leaveType} /></td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(l.fromDate)}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(l.toDate)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">
                            {l.isHalfDay ? '0.5' : (l.totalDays || daysBetween(l.fromDate, l.toDate))}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[140px]">
                          <p className="text-xs text-gray-500 truncate">{l.reason || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(l.createdAt)}</td>
                        <td className="px-4 py-3"><LeaveStatusBadge status={l.status} /></td>
                        <td className="px-4 py-3">
                          {l.status === 'pending' ? (
                            <button
                              onClick={() => setReviewLeave(l)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C8294A] text-white text-xs font-semibold rounded-lg hover:bg-[#a01f39] transition-colors"
                            >
                              <Eye className="w-3 h-3" /> Review
                            </button>
                          ) : (
                            <div className="space-y-0.5">
                              {l.adminRemarks && (
                                <p className="text-[10px] text-gray-400 italic max-w-[100px] truncate" title={l.adminRemarks}>
                                  💬 {l.adminRemarks}
                                </p>
                              )}
                              {l.reviewedAt && (
                                <p className="text-[10px] text-gray-400">{fmtDate(l.reviewedAt)}</p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {paged.length === 0 ? (
                <div className="text-center py-14">
                  <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No applications found</p>
                </div>
              ) : paged.map((l, i) => {
                const name = l.staffName
                  || `${l.staff?.firstName || ''} ${l.staff?.lastName || ''}`.trim()
                  || 'Unknown';
                return (
                  <div key={l._id || i} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-[#C8294A]/10 flex items-center justify-center shrink-0">
                          <span className="text-[#C8294A] text-sm font-bold">{name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1a1a1a]">{name}</p>
                          <p className="text-xs text-gray-400">{l.staffEmail}</p>
                        </div>
                      </div>
                      <LeaveStatusBadge status={l.status} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <LeaveTypeBadge type={l.leaveType} />
                      <span className="text-xs text-gray-500">{fmtDate(l.fromDate)} → {fmtDate(l.toDate)}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-bold">
                        {l.isHalfDay ? '0.5' : (l.totalDays || daysBetween(l.fromDate, l.toDate))}d
                      </span>
                    </div>
                    {l.reason && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">{l.reason}</p>
                    )}
                    {l.adminRemarks && (
                      <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">💬 {l.adminRemarks}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Applied {fmtDate(l.createdAt)}</p>
                      {l.status === 'pending' && (
                        <button
                          onClick={() => setReviewLeave(l)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C8294A] text-white text-xs font-semibold rounded-lg hover:bg-[#a01f39]"
                        >
                          <Eye className="w-3 h-3" /> Review
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
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
                      <span key={pg} className="flex items-center gap-1">
                        {idx > 0 && arr[idx - 1] !== pg - 1 && (
                          <span className="text-gray-400 text-xs">…</span>
                        )}
                        <button onClick={() => setPage(pg)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            page === pg ? 'bg-[#C8294A] text-white' : 'hover:bg-gray-200 text-gray-600'
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
          </>
        )}
      </div>

      {/* Review Modal */}
      {reviewLeave && (
        <LeaveReviewModal
          leave={reviewLeave}
          onClose={() => setReviewLeave(null)}
          onReviewed={fetchLeaves}
        />
      )}
    </div>
  );
};

// ─── Main StaffPanel ──────────────────────────────────────────────────────────
const StaffPanel = () => {
  const [activeTab,       setActiveTab]       = useState('staff');
  const [staff,           setStaff]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [filterRole,      setFilterRole]      = useState('all');
  const [filterDept,      setFilterDept]      = useState('all');
  const [filterStatus,    setFilterStatus]    = useState('all');
  const [currentPage,     setCurrentPage]     = useState(1);
  const [selectedStaff,   setSelectedStaff]   = useState(null);
  const [deleteConfirm,   setDeleteConfirm]   = useState(null);
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [editStaff,       setEditStaff]       = useState(null); // full edit modal
  const [pendingLeaves,   setPendingLeaves]   = useState(0);
  const [changeRoleModal, setChangeRoleModal] = useState(null); // role-only quick edit

  const PER_PAGE = 10;

  useEffect(() => {
    fetchStaff();
    fetchPendingCount();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res  = await axiosInstance.get(API_ENDPOINTS.staff.base);
      const data = Array.isArray(res.data)       ? res.data
                 : Array.isArray(res.data?.data) ? res.data.data
                 : res.data?.staff               || [];
      setStaff(data);
    } catch (e) { console.error('Error fetching staff:', e); setStaff([]); }
    finally     { setLoading(false); }
  };

  const fetchPendingCount = async () => {
    try {
      const res  = await axiosInstance.get(API_ENDPOINTS.leave.admin.pending);
      const data = res.data?.data?.records || res.data?.data || [];
      setPendingLeaves(Array.isArray(data) ? data.length : 0);
    } catch { setPendingLeaves(0); }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(API_ENDPOINTS.staff.delete(id));
      setStaff(prev => prev.filter(s => s._id !== id));
      setDeleteConfirm(null);
    } catch (e) { console.error('Error deleting staff:', e); }
  };

  // ─── After role changed: patch local state immediately ──────────────────
  const handleRoleChanged = (staffId, newRole) => {
    setStaff(prev => prev.map(s =>
      s._id === staffId ? { ...s, staffRole: newRole } : s
    ));
  };

  const getName = (s) =>
    s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown';

  const staffRoleList = [...new Set(staff.map(s => s.staffRole).filter(Boolean))].sort();
  const deptList      = [...new Set(staff.map(s => s.staffInfo?.department).filter(Boolean))].sort();

  const stats = {
    total:    staff.length,
    active:   staff.filter(s => s.isActive !== false).length,
    inactive: staff.filter(s => s.isActive === false).length,
    roles:    staffRoleList.length,
  };

  const filtered = staff.filter(s => {
    const name = getName(s);
    const matchSearch = !search
      || name.toLowerCase().includes(search.toLowerCase())
      || s.phone?.includes(search)
      || s.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole   === 'all' || s.staffRole             === filterRole;
    const matchDept   = filterDept   === 'all' || s.staffInfo?.department === filterDept;
    const matchStatus = filterStatus === 'all'
      || (filterStatus === 'active'   && s.isActive !== false)
      || (filterStatus === 'inactive' && s.isActive === false);
    return matchSearch && matchRole && matchDept && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const buildExportRows = () => ({
    headers: ['First Name','Last Name','Email','Phone','Staff Role','Department','Subject','Status','Joined'],
    rows: filtered.map(s => [
      s.firstName || '', s.lastName || '', s.email, s.phone || '',
      s.staffRole || '', s.staffInfo?.department || '', s.staffInfo?.subject || '',
      s.isActive !== false ? 'Active' : 'Inactive',
      s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : ''
    ]),
  });

  if (loading && activeTab === 'staff') return (
    <div className="flex flex-col items-center justify-center h-96">
      <RefreshCw className="w-10 h-10 animate-spin text-[#C8294A] mb-3" />
      <p className="text-gray-500 text-sm">Loading Staff...</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Staff Management</h1>
          <p className="text-gray-500 text-sm mt-1">{stats.total} staff members</p>
        </div>
        {activeTab === 'staff' && (
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#C8294A] text-white rounded-lg hover:bg-[#a01f39] flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Staff
            </button>
            <button onClick={fetchStaff}
              className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2d2d2d] flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <ExportButton
              filename="Staff"
              title="Staff Management"
              getRows={buildExportRows}
            />
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'staff'
              ? 'bg-white shadow text-[#C8294A]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users2 className="w-4 h-4" /> Staff List
        </button>
        <button
          onClick={() => { setActiveTab('leaves'); fetchPendingCount(); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
            activeTab === 'leaves'
              ? 'bg-white shadow text-[#C8294A]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Leave Approvals
          {pendingLeaves > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {pendingLeaves > 9 ? '9+' : pendingLeaves}
            </span>
          )}
        </button>
      </div>

      {/* ── Staff List Tab ── */}
      {activeTab === 'staff' && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users2}    label="Total Staff"  value={stats.total}    bg="bg-[#C8294A]"  />
            <StatCard icon={UserCheck} label="Active"       value={stats.active}   bg="bg-green-600"  />
            <StatCard icon={UserX}     label="Inactive"     value={stats.inactive} bg="bg-[#1a1a1a]"  />
            <StatCard icon={Shield}    label="Roles"        value={stats.roles}    bg="bg-orange-500" />
          </div>

          {/* Role Breakdown */}
          {staffRoleList.length > 0 && (
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">By Staff Role</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {staffRoleList.map(role => {
                  const count = staff.filter(s => s.staffRole === role).length;
                  const cfg   = ROLE_CONFIG[role] || { color: 'bg-gray-100 text-gray-600' };
                  return (
                    <button key={role}
                      onClick={() => { setFilterRole(filterRole === role ? 'all' : role); setCurrentPage(1); }}
                      className={`p-3 rounded-xl text-center border-2 transition-all ${
                        filterRole === role ? 'border-[#C8294A] shadow-md' : 'border-transparent hover:border-gray-200'
                      } ${cfg.color}`}
                    >
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs font-medium mt-0.5">{role}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow p-4 flex flex-col md:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search name, phone, email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A]"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white">
              <option value="all">All Roles</option>
              {staffRoleList.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {deptList.length > 0 && (
              <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white">
                <option value="all">All Departments</option>
                {deptList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
              <Filter className="w-4 h-4" />
              <span>{filtered.length} results</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Staff Member','Contact','Staff Role','Department','Status','Joined','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-14">
                        <Users2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No staff found</p>
                        <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  ) : paginated.map(member => {
                    const name = getName(member);
                    return (
                      <tr key={member._id} className="hover:bg-gray-50 transition-colors">

                        {/* Staff Member */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#C8294A]/10 flex items-center justify-center shrink-0 overflow-hidden">
                              {member.profilePhoto
                                ? <img src={member.profilePhoto} alt={name} className="w-9 h-9 rounded-full object-cover" />
                                : <span className="text-[#C8294A] text-sm font-bold">{name.charAt(0).toUpperCase()}</span>}
                            </div>
                            <div>
                              <p className="font-semibold text-[#1a1a1a]">{name}</p>
                              <p className="text-xs text-gray-400">#{member._id?.slice(-6).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3">
                          <p className="text-[#1a1a1a]">{member.phone || '—'}</p>
                          <p className="text-xs text-gray-400">{member.email}</p>
                        </td>

                        {/* Staff Role — inline change button */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <RoleBadge role={member.staffRole} />
                            <button
                              onClick={() => setChangeRoleModal(member)}
                              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                              title="Change Role"
                            >
                              <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-[#C8294A]" />
                            </button>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-3 text-gray-600 text-sm">{member.staffInfo?.department || '—'}</td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            member.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {member.isActive !== false
                              ? <><CheckCircle className="w-3 h-3" /> Active</>
                              : <><XCircle    className="w-3 h-3" /> Inactive</>}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {member.createdAt ? new Date(member.createdAt).toLocaleDateString('en-IN') : '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setSelectedStaff(member)}
                              className="p-1.5 hover:bg-[#C8294A]/10 hover:text-[#C8294A] text-gray-400 rounded-lg transition-colors" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditStaff(member)}
                              className="p-1.5 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-lg transition-colors" title="Edit Staff">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setChangeRoleModal(member)}
                              className="p-1.5 hover:bg-purple-50 hover:text-purple-600 text-gray-400 rounded-lg transition-colors" title="Change Role">
                              <Shield className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteConfirm(member)}
                              className="p-1.5 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-lg transition-colors" title="Delete Staff">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((pg, idx, arr) => (
                      <React.Fragment key={pg}>
                        {idx > 0 && arr[idx - 1] !== pg - 1 && <span className="text-gray-400 text-sm">...</span>}
                        <button onClick={() => setCurrentPage(pg)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pg ? 'bg-[#C8294A] text-white' : 'hover:bg-gray-100 text-gray-600'
                          }`}>
                          {pg}
                        </button>
                      </React.Fragment>
                    ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Leave Approvals Tab ── */}
      {activeTab === 'leaves' && <LeaveApprovalsTab />}

      {/* ── Modals ── */}
      {selectedStaff && <StaffModal staff={selectedStaff} onClose={() => setSelectedStaff(null)} />}

      {showAddModal && (
        <AddStaffModal onClose={() => setShowAddModal(false)} onSuccess={fetchStaff} />
      )}

      {/* Full Edit Modal */}
      {editStaff && (
        <EditStaffModal
          staff={editStaff}
          onClose={() => setEditStaff(null)}
          onSuccess={fetchStaff}
        />
      )}

      {/* Change Role Modal */}
      {changeRoleModal && (
        <ChangeRoleModal
          staff={changeRoleModal}
          onClose={() => setChangeRoleModal(null)}
          onSuccess={handleRoleChanged}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#1a1a1a]">Delete Staff Member</h3>
                <p className="text-sm text-gray-500">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Delete <span className="font-semibold text-[#1a1a1a]">{getName(deleteConfirm)}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPanel;