import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Search, Filter, Eye, Download, RefreshCw,
  ChevronLeft, ChevronRight, X, CheckCircle, XCircle,
  TrendingUp, CreditCard, Clock, AlertCircle, Receipt,
  Users, Calendar, BarChart3, Banknote, Plus
} from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { API_ENDPOINTS } from '../../../config/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAYMENT_MODES   = ['Cash', 'Online', 'UPI', 'Bank Transfer', 'Card', 'Cheque'];
const PAYMENT_STATUS  = ['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'];
const FEE_HEADS       = ['Course Fee', 'Exam Fee', 'Certification Fee', 'Other'];

const STATUS_CONFIG = {
  SUCCESS:  { color: 'bg-green-100 text-green-700',  icon: CheckCircle,   dot: 'bg-green-500'  },
  PENDING:  { color: 'bg-yellow-100 text-yellow-700',icon: Clock,         dot: 'bg-yellow-500' },
  FAILED:   { color: 'bg-red-100 text-red-600',      icon: XCircle,       dot: 'bg-red-500'    },
  REFUNDED: { color: 'bg-gray-100 text-gray-600',    icon: AlertCircle,   dot: 'bg-gray-400'   },
};

const MODE_CONFIG = {
  Cash:          'bg-green-100 text-green-700',
  Online:        'bg-blue-100 text-blue-700',
  UPI:           'bg-purple-100 text-purple-700',
  'Bank Transfer':'bg-orange-100 text-orange-700',
  Card:          'bg-[#C8294A]/10 text-[#C8294A]',
  Cheque:        'bg-gray-100 text-gray-600',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, bg }) => (
  <div className={`${bg} text-white p-5 rounded-xl shadow-lg flex justify-between items-start`}>
    <div>
      <p className="text-white/80 text-sm font-medium">{label}</p>
      <h3 className="text-2xl font-bold mt-1">{value}</h3>
      {sub && <p className="text-white/70 text-xs mt-0.5">{sub}</p>}
    </div>
    <div className="bg-white/20 p-2.5 rounded-lg shrink-0">
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg  = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};

// ─── Collect Payment Modal ────────────────────────────────────────────────────
const CollectPaymentModal = ({ onClose, onSuccess }) => {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    studentId:   '',
    feeHead:     'Course Fee',
    baseAmount:  '',
    amount:      '',
    couponCode:  '',
    paymentMode: 'Cash',
    remarks:     '',
  });
  const [couponInfo,    setCouponInfo]    = useState(null);
  const [couponError,   setCouponError]   = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [pendingFees,   setPendingFees]   = useState(null);

  // Fetch students for dropdown
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res  = await axiosInstance.get(API_ENDPOINTS.students.base);
        const data = Array.isArray(res.data)       ? res.data
                   : Array.isArray(res.data?.data) ? res.data.data
                   : res.data?.students            || [];
        setStudents(data);
      } catch (e) { console.error(e); }
    };
    fetchStudents();
  }, []);

  // Fetch pending fees when student selected
  useEffect(() => {
    if (!form.studentId) { setPendingFees(null); return; }
    const fetchPending = async () => {
      try {
        const res = await axiosInstance.get(API_ENDPOINTS.fees.pending(form.studentId));
        const d   = res.data?.data || {};
        setPendingFees(d);
        setForm(p => ({
          ...p,
          baseAmount: d.pendingAmount || '',
          amount:     d.pendingAmount || '',
        }));
      } catch (e) { console.error(e); }
    };
    fetchPending();
  }, [form.studentId]);

  const validateCoupon = async () => {
    if (!form.couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponInfo(null);
    try {
      const res = await axiosInstance.post(API_ENDPOINTS.fees.validateCoupon, {
        code:      form.couponCode.toUpperCase(),
        studentId: form.studentId,
        courseId:  pendingFees?.courseId,
      });
      const c = res.data.coupon;
      setCouponInfo(c);

      // Calculate discounted amount
      let discount = 0;
      if (c.discountType === 'PERCENT') {
        discount = (Number(form.baseAmount) * c.discountValue) / 100;
        if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
      } else {
        discount = c.discountValue;
      }
      setForm(p => ({ ...p, amount: Math.max(0, Number(p.baseAmount) - discount) }));
    } catch (e) {
      setCouponError(e.response?.data?.message || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId) { setError('Please select a student'); return; }
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post(API_ENDPOINTS.fees.collect, {
        studentId:  form.studentId,
        courseId:   pendingFees?.courseId,
        feeHead:    form.feeHead,
        baseAmount: Number(form.baseAmount),
        amount:     Number(form.amount),
        couponCode: form.couponCode || undefined,
        paymentMode: form.paymentMode,
        remarks:    form.remarks,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const filteredStudents = students.filter(s =>
    !studentSearch ||
    s.fullName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.mobile?.includes(studentSearch)
  );

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A]";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Collect Payment</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Student Search + Select */}
          <div>
            <label className={labelCls}>Student *</label>
            <input
              placeholder="Search student name or mobile..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              className={`${inputCls} mb-2`}
            />
            <select required value={form.studentId} onChange={set('studentId')}
              className={`${inputCls} bg-white`}>
              <option value="">Select Student</option>
              {filteredStudents.map(s => (
                <option key={s._id} value={s._id}>
                  {s.fullName} — {s.mobile || s.admissionNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Pending Fees Banner */}
          {pendingFees && (
            <div className="bg-[#C8294A]/5 border border-[#C8294A]/20 rounded-xl p-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-500">Total Fee</p>
                  <p className="text-sm font-bold text-[#1a1a1a]">₹{(pendingFees.totalFee || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-sm font-bold text-red-600">₹{(pendingFees.pendingAmount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="text-sm font-bold text-orange-600">
                    {pendingFees.dueDate ? new Date(pendingFees.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Fee Head */}
            <div>
              <label className={labelCls}>Fee Head *</label>
              <select required value={form.feeHead} onChange={set('feeHead')}
                className={`${inputCls} bg-white`}>
                {FEE_HEADS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* Payment Mode */}
            <div>
              <label className={labelCls}>Payment Mode *</label>
              <select required value={form.paymentMode} onChange={set('paymentMode')}
                className={`${inputCls} bg-white`}>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Base Amount */}
            <div>
              <label className={labelCls}>Base Amount (₹) *</label>
              <input required type="number" min="1" value={form.baseAmount}
                onChange={e => {
                  setForm(p => ({ ...p, baseAmount: e.target.value, amount: e.target.value }));
                  setCouponInfo(null);
                }}
                placeholder="0" className={inputCls} />
            </div>

            {/* Final Amount */}
            <div>
              <label className={labelCls}>Final Amount (₹) *</label>
              <input required type="number" min="1" value={form.amount}
                onChange={set('amount')}
                placeholder="0" className={inputCls} />
            </div>
          </div>

          {/* Coupon Code */}
          <div>
            <label className={labelCls}>Coupon Code</label>
            <div className="flex gap-2">
              <input value={form.couponCode} onChange={set('couponCode')}
                placeholder="Enter coupon code"
                className={`${inputCls} flex-1 uppercase`} />
              <button type="button" onClick={validateCoupon}
                disabled={!form.couponCode || !form.studentId || couponLoading}
                className="px-3 py-2 bg-[#C8294A] text-white rounded-lg text-sm hover:bg-[#a01f39] disabled:opacity-50 whitespace-nowrap">
                {couponLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Apply'}
              </button>
            </div>
            {couponError && (
              <p className="text-red-500 text-xs mt-1">{couponError}</p>
            )}
            {couponInfo && (
              <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Coupon applied! {couponInfo.discountType === 'PERCENT'
                  ? `${couponInfo.discountValue}% off`
                  : `₹${couponInfo.discountValue} off`
                }
              </p>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className={labelCls}>Remarks</label>
            <textarea value={form.remarks} onChange={set('remarks')}
              placeholder="Optional notes..." rows={2}
              className={inputCls} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 bg-[#C8294A] text-white rounded-lg text-sm font-medium hover:bg-[#a01f39] disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
                : <><DollarSign className="w-4 h-4" /> Collect Payment</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Payment Detail Modal ─────────────────────────────────────────────────────
const PaymentModal = ({ payment, onClose }) => {
  if (!payment) return null;

  const downloadReceipt = async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.fees.receipt(payment._id), {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      Object.assign(document.createElement('a'), {
        href: url,
        download: `Receipt_${payment.receiptNo}.pdf`
      }).click();
    } catch (e) {
      console.error('Receipt download failed:', e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Payment Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Receipt No + Status */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
            <div>
              <p className="text-xs text-gray-500">Receipt Number</p>
              <p className="font-bold text-[#1a1a1a] font-mono">{payment.receiptNo}</p>
            </div>
            <StatusBadge status={payment.status} />
          </div>

          {/* Student Info */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Student</h4>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <p className="font-semibold text-[#1a1a1a]">{payment.studentId?.fullName || 'N/A'}</p>
              <p className="text-sm text-gray-500">{payment.studentId?.mobile}</p>
              <p className="text-xs text-gray-400">Admission: {payment.studentId?.admissionNumber}</p>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Fee Breakdown</h4>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fee Head</span>
                <span className="font-medium">{payment.feeHead}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Course</span>
                <span className="font-medium">{payment.courseId?.courseCategory || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Base Amount</span>
                <span className="font-medium">₹{(payment.baseAmount || 0).toLocaleString()}</span>
              </div>
              {payment.couponCode && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Coupon ({payment.couponCode})</span>
                    <span className="font-medium text-green-600">
                      − ₹{(payment.couponDiscount || 0).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold text-[#1a1a1a]">Amount Paid</span>
                <span className="font-bold text-[#C8294A] text-lg">
                  ₹{(payment.amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Payment Mode</p>
              <p className="font-semibold text-sm">{payment.paymentMode}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Paid Date</p>
              <p className="font-semibold text-sm">
                {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('en-IN') : 'N/A'}
              </p>
            </div>
          </div>

          {payment.remarks && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Remarks</p>
              <p className="text-sm text-[#1a1a1a]">{payment.remarks}</p>
            </div>
          )}

          {/* Download Receipt */}
          {payment.status === 'SUCCESS' && (
            <button onClick={downloadReceipt}
              className="w-full px-4 py-2.5 bg-[#C8294A] text-white rounded-xl text-sm font-medium hover:bg-[#a01f39] flex items-center justify-center gap-2">
              <Receipt className="w-4 h-4" /> Download Receipt PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main FeesPanel ───────────────────────────────────────────────────────────
const FeesPanel = () => {
  const [payments,        setPayments]        = useState([]);
  const [stats,           setStats]           = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [statsLoading,    setStatsLoading]    = useState(true);
  const [search,          setSearch]          = useState('');
  const [filterStatus,    setFilterStatus]    = useState('');
  const [filterMode,      setFilterMode]      = useState('');
  const [dateFrom,        setDateFrom]        = useState('');
  const [dateTo,          setDateTo]          = useState('');
  const [currentPage,     setCurrentPage]     = useState(1);
  const [totalPages,      setTotalPages]      = useState(1);
  const [totalRecords,    setTotalRecords]    = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showCollect,     setShowCollect]     = useState(false);

  const PER_PAGE = 15;

  const fetchPayments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: PER_PAGE,
        ...(filterStatus && { status: filterStatus }),
        ...(filterMode   && { paymentMode: filterMode }),
        ...(dateFrom     && { dateFrom }),
        ...(dateTo       && { dateTo }),
      });
      const res  = await axiosInstance.get(`${API_ENDPOINTS.fees.base}?${params}`);
      const data = res.data;
      setPayments(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.totalPages  || 1);
      setTotalRecords(data.totalRecords || 0);
    } catch (e) {
      console.error('Error fetching payments:', e);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterMode, dateFrom, dateTo]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const params = new URLSearchParams({
        ...(dateFrom && { dateFrom }),
        ...(dateTo   && { dateTo }),
      });
      const res = await axiosInstance.get(`${API_ENDPOINTS.fees.stats}?${params}`);
      setStats(res.data?.data || null);
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setStatsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchPayments(1);
    fetchStats();
    setCurrentPage(1);
  }, [fetchPayments, fetchStats]);

  // ─── Client-side search on loaded page ───────────────────────────────────
  const filtered = payments.filter(p => {
    if (!search) return true;
    const name    = p.studentId?.fullName?.toLowerCase() || '';
    const mobile  = p.studentId?.mobile || '';
    const receipt = p.receiptNo || '';
    return (
      name.includes(search.toLowerCase()) ||
      mobile.includes(search) ||
      receipt.includes(search)
    );
  });

  const exportCSV = () => {
    const headers = ['Receipt No', 'Student', 'Mobile', 'Fee Head', 'Course', 'Base Amount', 'Discount', 'Amount Paid', 'Mode', 'Status', 'Date'];
    const rows = payments.map(p => [
      p.receiptNo,
      p.studentId?.fullName || '',
      p.studentId?.mobile || '',
      p.feeHead, p.courseId?.courseCategory || '',
      p.baseAmount || 0, p.couponDiscount || 0, p.amount || 0,
      p.paymentMode, p.status,
      p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN') : ''
    ]);
    const csv  = [headers, ...rows].map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `Fees_${new Date().toISOString().split('T')[0]}.csv`
    }).click();
  };

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Fee Management</h1>
          <p className="text-gray-500 text-sm mt-1">{totalRecords} total transactions</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowCollect(true)}
            className="px-4 py-2 bg-[#C8294A] text-white rounded-lg hover:bg-[#a01f39] flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Collect Payment
          </button>
          <button onClick={() => { fetchPayments(currentPage); fetchStats(); }}
            className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2d2d2d] flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={statsLoading ? '...' : `₹${((stats?.totalRevenue || 0) / 1000).toFixed(0)}K`}
          sub={`₹${(stats?.totalRevenue || 0).toLocaleString()} total`}
          bg="bg-[#C8294A]"
        />
        <StatCard
          icon={AlertCircle}
          label="Total Pending"
          value={statsLoading ? '...' : `₹${((stats?.totalPending || 0) / 1000).toFixed(0)}K`}
          sub={`₹${(stats?.totalPending || 0).toLocaleString()} pending`}
          bg="bg-orange-500"
        />
        <StatCard
          icon={Receipt}
          label="Total Payments"
          value={statsLoading ? '...' : stats?.totalPayments || 0}
          sub="successful transactions"
          bg="bg-green-600"
        />
        <StatCard
          icon={Users}
          label="Conversion Rate"
          value={statsLoading ? '...' : `${stats?.conversionRatio || 0}%`}
          sub={`${stats?.totalStudents || 0} active students`}
          bg="bg-[#1a1a1a]"
        />
      </div>

      {/* Payment Mode Breakdown */}
      {stats?.paymentModeBreakdown?.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Payment Mode Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.paymentModeBreakdown.map(m => (
              <button key={m._id}
                onClick={() => { setFilterMode(filterMode === m._id ? '' : m._id); setCurrentPage(1); }}
                className={`p-3 rounded-xl text-center border-2 transition-all ${
                  filterMode === m._id ? 'border-[#C8294A] shadow-md' : 'border-transparent hover:border-gray-200'
                } ${MODE_CONFIG[m._id] || 'bg-gray-100 text-gray-600'}`}
              >
                <p className="text-xl font-bold">{m.count}</p>
                <p className="text-xs font-medium mt-0.5">{m._id}</p>
                <p className="text-xs opacity-70">₹{(m.totalAmount / 1000).toFixed(0)}K</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Revenue (last 6 months) */}
      {stats?.monthlyStats?.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Monthly Revenue
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[...stats.monthlyStats].reverse().slice(0, 6).map(m => {
              const maxRev = Math.max(...stats.monthlyStats.map(s => s.totalRevenue));
              const pct    = maxRev > 0 ? (m.totalRevenue / maxRev) * 100 : 0;
              return (
                <div key={`${m._id.year}-${m._id.month}`} className="text-center">
                  <div className="h-16 flex items-end justify-center mb-1">
                    <div
                      className="w-8 bg-[#C8294A] rounded-t-md transition-all"
                      style={{ height: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-[#1a1a1a]">
                    ₹{(m.totalRevenue / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-gray-400">
                    {MONTH_NAMES[m._id.month - 1]} {m._id.year}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-col md:flex-row gap-3 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, mobile, receipt..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white">
          <option value="">All Status</option>
          {PAYMENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Mode Filter */}
        <select value={filterMode}
          onChange={e => { setFilterMode(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white">
          <option value="">All Modes</option>
          {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        {/* Date Range */}
        <input type="date" value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A]" />
        <input type="date" value={dateTo}
          onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A]" />

        {/* Clear dates */}
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="px-3 py-2 text-xs text-[#C8294A] hover:underline flex items-center gap-1">
            <X className="w-3 h-3" /> Clear Dates
          </button>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          <span>{filtered.length} results</span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-10 h-10 animate-spin text-[#C8294A] mb-3" />
            <p className="text-gray-500 text-sm">Loading payments...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Receipt', 'Student', 'Fee Head', 'Amount', 'Mode', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-14">
                      <Banknote className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 font-medium">No payments found</p>
                      <p className="text-gray-400 text-xs mt-1">Try adjusting filters</p>
                    </td>
                  </tr>
                ) : filtered.map(payment => (
                  <tr key={payment._id} className="hover:bg-gray-50 transition-colors">

                    {/* Receipt No */}
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-[#C8294A]">
                        {payment.receiptNo?.slice(-10)}
                      </p>
                    </td>

                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#C8294A]/10 flex items-center justify-center shrink-0">
                          <span className="text-[#C8294A] text-xs font-bold">
                            {payment.studentId?.fullName?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-[#1a1a1a] text-xs">
                            {payment.studentId?.fullName || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400">{payment.studentId?.mobile || ''}</p>
                        </div>
                      </div>
                    </td>

                    {/* Fee Head */}
                    <td className="px-4 py-3">
                      <p className="text-gray-700 text-xs">{payment.feeHead}</p>
                      {payment.courseId?.courseCategory && (
                        <p className="text-xs text-gray-400">{payment.courseId.courseCategory}</p>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#1a1a1a]">₹{(payment.amount || 0).toLocaleString()}</p>
                      {payment.couponDiscount > 0 && (
                        <p className="text-xs text-green-600">
                          −₹{payment.couponDiscount.toLocaleString()} disc.
                        </p>
                      )}
                    </td>

                    {/* Mode */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${MODE_CONFIG[payment.paymentMode] || 'bg-gray-100 text-gray-600'}`}>
                        {payment.paymentMode}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={payment.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {payment.paidDate
                        ? new Date(payment.paidDate).toLocaleDateString('en-IN')
                        : '—'
                      }
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedPayment(payment)}
                        className="p-1.5 hover:bg-[#C8294A]/10 hover:text-[#C8294A] text-gray-400 rounded-lg transition-colors"
                        title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages} · {totalRecords} total
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); fetchPayments(currentPage - 1); }}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="text-gray-400 text-sm">...</span>
                    )}
                    <button onClick={() => { setCurrentPage(page); fetchPayments(page); }}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-[#C8294A] text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}>
                      {page}
                    </button>
                  </React.Fragment>
                ))
              }
              <button onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); fetchPayments(currentPage + 1); }}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedPayment && (
        <PaymentModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}

      {showCollect && (
        <CollectPaymentModal
          onClose={() => setShowCollect(false)}
          onSuccess={() => { fetchPayments(1); fetchStats(); setCurrentPage(1); }}
        />
      )}
    </div>
  );
};

export default FeesPanel;
