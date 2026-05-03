import React, { useState, useEffect } from 'react';
import {
  Users, DollarSign, TrendingUp, Award, Calendar, FileText,
  Download, RefreshCw, Database, Building2, Phone, UserCheck,
  GraduationCap, BarChart3, PieChart, CheckCircle, Briefcase
} from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { API_ENDPOINTS } from '../../../config/api';
import RevenueChart     from '../analytics/RevenueChart';
import ConversionFunnel from '../analytics/ConversionFunnel';
import LeadSourceChart  from '../analytics/LeadSourceChart';
import BranchPerformance from '../analytics/BranchPerformance';
import DailyMISReport   from '../analytics/DailyMISReport';
import BackupRestore    from '../BackupRestore';

// ─── Filter helpers ──────────────────────────────────────────────────────────
// Resolve the time-range dropdown to a [start, end] window.
//   daily    → today 00:00 → today 23:59
//   weekly   → 6 days ago 00:00 → today 23:59
//   monthly  → 29 days ago 00:00 → today 23:59
//   all      → epoch → far future (effectively unbounded)
const getDateRange = (timeRange) => {
  if (timeRange === 'all') {
    return { start: new Date(0), end: new Date(8640000000000000) };
  }
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (timeRange === 'weekly')  start.setDate(start.getDate() - 6);
  if (timeRange === 'monthly') start.setDate(start.getDate() - 29);
  return { start, end };
};

const inRange = (dateLike, { start, end }) => {
  if (!dateLike) return false;
  const t = new Date(dateLike).getTime();
  return t >= start.getTime() && t <= end.getTime();
};

// Branch may live on `branch`, `city`, or `location` depending on the source.
// Compare case-insensitively. 'all' always passes.
const inBranch = (record, branch) => {
  if (!branch || branch === 'all') return true;
  const target = branch.toLowerCase();
  return [record?.branch, record?.city, record?.location]
    .some(v => typeof v === 'string' && v.toLowerCase() === target);
};

// Format an INR amount at the right magnitude. Avoids the "₹0.0L" footgun
// when the underlying value is non-zero but smaller than a lakh.
//   < 1,000        → "₹847"
//   1,000-99,999   → "₹4.5K"
//   ≥ 1,00,000     → "₹1.25L"
const formatINR = (n) => {
  const v = Number(n) || 0;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
};

// Same date used by every "today" stat. Cached per render.
const isSameDay = (a, b) => {
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear()
      && x.getMonth()    === y.getMonth()
      && x.getDate()     === y.getDate();
};

const OverviewPanel = () => {
  const [loading, setLoading]           = useState(true);
  const [timeRange, setTimeRange]       = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [branches]                      = useState(['Raipur', 'Bhilai']);

  // Raw data — fetched once, filtered client-side every time the user changes
  // timeRange or branch. This is what makes those dropdowns actually work.
  const [allLeads,           setAllLeads]           = useState([]);
  const [allStudents,        setAllStudents]        = useState([]);
  const [allPayments,        setAllPayments]        = useState([]);
  const [allAttendance,      setAllAttendance]      = useState([]);
  const [allStaffAttendance, setAllStaffAttendance] = useState([]);
  const [allStaff,           setAllStaff]           = useState([]);
  const [batchStats,         setBatchStats]         = useState({ total: 0, active: 0, free: 0, paid: 0 });

  // Re-fetch raw data on mount only. The filters don't need new fetches.
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [
        leadsRes, studentsRes, paymentsRes,
        studentAttRes, staffAttRes, staffRes, batchesRes,
      ] = await Promise.allSettled([
        axiosInstance.get(API_ENDPOINTS.leads.base),
        axiosInstance.get(API_ENDPOINTS.students.base),
        axiosInstance.get(API_ENDPOINTS.fees.base, { params: { limit: 500 } }),
        axiosInstance.get(API_ENDPOINTS.studentAttendance.getAll),
        axiosInstance.get(API_ENDPOINTS.staffAttendance.getAll),
        axiosInstance.get(API_ENDPOINTS.staff.base),
        axiosInstance.get(API_ENDPOINTS.batches.statistics),
      ]);

      const unwrap = (r) => {
        if (r.status !== 'fulfilled') return [];
        const d = r.value.data;
        return Array.isArray(d) ? d : d?.data || d?.leads || d?.students || [];
      };

      setAllLeads(unwrap(leadsRes));
      setAllStudents(unwrap(studentsRes));
      setAllPayments(unwrap(paymentsRes));
      setAllAttendance(unwrap(studentAttRes));
      setAllStaffAttendance(unwrap(staffAttRes));
      setAllStaff(unwrap(staffRes));

      if (batchesRes.status === 'fulfilled') {
        const stats = batchesRes.value.data?.data || batchesRes.value.data || {};
        setBatchStats({
          total:  stats.totalBatches  || stats.total  || 0,
          active: stats.activeBatches || stats.active || 0,
          free:   stats.freeBatches   || stats.free   || 0,
          paid:   stats.paidBatches   || stats.paid   || 0,
        });
      }
    } catch (e) {
      console.error('OverviewPanel fetchAll error:', e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Derive scoped datasets + stats from raw data + active filters ────────
  // Recomputed whenever timeRange / branch / raw datasets change.
  const range = React.useMemo(() => getDateRange(timeRange), [timeRange]);

  const filteredLeads = React.useMemo(() =>
    allLeads.filter(l => inBranch(l, selectedBranch) && inRange(l.createdAt, range)),
    [allLeads, selectedBranch, range]
  );

  const filteredStudents = React.useMemo(() =>
    allStudents.filter(s => inBranch(s, selectedBranch) && inRange(s.createdAt, range)),
    [allStudents, selectedBranch, range]
  );

  const filteredPayments = React.useMemo(() =>
    allPayments.filter(p => {
      // Payments don't store a branch — derive from the populated student.
      const studentBranch = p.studentId?.branch || p.studentId?.city;
      const branchOK = selectedBranch === 'all'
        || (typeof studentBranch === 'string' && studentBranch.toLowerCase() === selectedBranch.toLowerCase());
      return branchOK && inRange(p.paidDate || p.createdAt, range);
    }),
    [allPayments, selectedBranch, range]
  );

  const filteredAttendance = React.useMemo(() =>
    allAttendance.filter(a => inBranch(a, selectedBranch) && inRange(a.date || a.createdAt, range)),
    [allAttendance, selectedBranch, range]
  );

  const filteredStaffAttendance = React.useMemo(() =>
    allStaffAttendance.filter(a => inBranch(a, selectedBranch) && inRange(a.date || a.checkInTime || a.createdAt, range)),
    [allStaffAttendance, selectedBranch, range]
  );

  // Always-current "all students" / "all staff" counts — used as denominators
  // for attendance % (otherwise an empty filter range gives a misleading 100%).
  const activeStudentCount = React.useMemo(
    () => allStudents.filter(s => (s.status || 'Active') === 'Active'
                              && inBranch(s, selectedBranch)).length,
    [allStudents, selectedBranch]
  );
  const activeStaffCount = React.useMemo(
    () => allStaff.filter(s => s.isActive !== false && inBranch(s, selectedBranch)).length,
    [allStaff, selectedBranch]
  );

  const dashboardStats = React.useMemo(() => {
    // ── Lead funnel — pre-conversion stages live on Lead.stage ───────────
    const total       = filteredLeads.length;
    const enquiry     = filteredLeads.filter(l => l.stage === 'Enquiry').length;
    const counselling = filteredLeads.filter(l => l.stage === 'Counselling').length;

    // ── Post-conversion stages — once a Lead becomes a Student, the lead
    // record is typically removed/superseded. Counting only Lead.stage would
    // hide every student that was already admitted. So we combine:
    //   Free Batch  = leads in 'Free Batch'  + students with batchType 'Free'
    //   Paid Batch  = leads in 'Paid Batch'  + students with batchType 'Paid'
    //   Admission   = leads in 'Admission'   + every Student in the window
    //   Conversion% = converted / (leads + converted)
    const leadFreeBatch  = filteredLeads.filter(l => l.stage === 'Free Batch').length;
    const leadPaidBatch  = filteredLeads.filter(l => l.stage === 'Paid Batch').length;
    const leadAdmission  = filteredLeads.filter(l => l.stage === 'Admission').length;
    const stuFreeBatch   = filteredStudents.filter(s => s.batchType === 'Free').length;
    const stuPaidBatch   = filteredStudents.filter(s => s.batchType === 'Paid').length;

    const freeBatch = leadFreeBatch + stuFreeBatch;
    const paidBatch = leadPaidBatch + stuPaidBatch;
    const converted = leadAdmission + filteredStudents.length;

    const funnelTotal    = total + filteredStudents.length;
    const conversionRate = funnelTotal > 0
      ? ((converted / funnelTotal) * 100).toFixed(2)
      : '0.00';

    const collected = filteredPayments
      .filter(p => p.status === 'SUCCESS' || p.status === 'Completed')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const pending   = filteredStudents.reduce((sum, s) => sum + (Number(s.pendingFees) || 0), 0);
    const totalFees = filteredStudents.reduce((sum, s) => sum + (Number(s.totalFees)   || 0), 0);

    // ── Student attendance (period scoped) ─────────────────────────────────
    const stuPresent = filteredAttendance.filter(a => ['Present', 'Late'].includes(a.status)).length;
    const stuAbsent  = filteredAttendance.filter(a => a.status === 'Absent').length;
    const stuMarked  = filteredAttendance.length;
    // Daily view → use today's enrolled active students as denominator so we
    // don't show "100%" just because only present rows were recorded.
    // Other views → fall back to marked rows which is the only reliable base.
    const stuDenominator = timeRange === 'daily'
      ? Math.max(activeStudentCount, stuMarked)
      : stuMarked;
    const stuPercentage = stuDenominator > 0
      ? ((stuPresent / stuDenominator) * 100).toFixed(1)
      : '0.0';

    // ── Staff attendance (period scoped) ───────────────────────────────────
    const today    = new Date();
    const stfToday = filteredStaffAttendance.filter(a => isSameDay(a.date || a.checkInTime, today));
    const stfPresent = filteredStaffAttendance.filter(a => ['Present', 'Late'].includes(a.status)).length;
    const stfMarked  = filteredStaffAttendance.length;
    const stfDenominator = timeRange === 'daily'
      ? Math.max(activeStaffCount, stfMarked)
      : stfMarked;
    const stfPercentage = stfDenominator > 0
      ? ((stfPresent / stfDenominator) * 100).toFixed(1)
      : '0.0';

    return {
      leads: { total, enquiry, counselling, freeBatch, paidBatch, converted, conversionRate },
      students: {
        total:    filteredStudents.length,
        active:   filteredStudents.filter(s => s.status === 'Active').length,
        inactive: filteredStudents.filter(s => s.status === 'Inactive').length,
        free:     filteredStudents.filter(s => s.batchType === 'Free').length,
        paid:     filteredStudents.filter(s => s.batchType === 'Paid').length,
      },
      revenue: { total: totalFees, collected, pending },
      studentAttendance: {
        marked:     stuMarked,
        present:    stuPresent,
        absent:     stuAbsent,
        percentage: stuPercentage,
        denominator: stuDenominator,
      },
      staffAttendance: {
        marked:     stfMarked,
        today:      stfToday.length,
        present:    stfPresent,
        percentage: stfPercentage,
        denominator: stfDenominator,
      },
      batches: batchStats,
    };
  }, [filteredLeads, filteredStudents, filteredPayments, filteredAttendance,
      filteredStaffAttendance, batchStats, timeRange, activeStudentCount, activeStaffCount]);

  const recentLeads = React.useMemo(
    () => filteredLeads.slice(0, 5),
    [filteredLeads]
  );

  const recentRemarks = React.useMemo(() =>
    filteredLeads
      .filter(l => l.remarks?.length)
      .flatMap(l => l.remarks.map(r => ({ ...r, leadName: l.fullName || 'Unknown' })))
      .sort((a, b) => new Date(b.addedAt || b.timestamp || 0) - new Date(a.addedAt || a.timestamp || 0))
      .slice(0, 10),
    [filteredLeads]
  );

  const exportMISReport = () => {
    const rows = [
      ['Report Date', new Date().toLocaleString()],
      ['Time Range', timeRange.toUpperCase()],
      ['Branch', selectedBranch === 'all' ? 'All Branches' : selectedBranch],
      [''], ['LEADS'],
      ['Total Leads',     dashboardStats.leads.total],
      ['Enquiry',         dashboardStats.leads.enquiry],
      ['Counselling',     dashboardStats.leads.counselling],
      ['Free Batch',      dashboardStats.leads.freeBatch],
      ['Paid Batch',      dashboardStats.leads.paidBatch],
      ['Converted',       dashboardStats.leads.converted],
      ['Conversion Rate', `${dashboardStats.leads.conversionRate}%`],
      [''], ['REVENUE'],
      ['Collected', formatINR(dashboardStats.revenue.collected)],
      ['Pending',   formatINR(dashboardStats.revenue.pending)],
      [''], ['STUDENTS'],
      ['Total',    dashboardStats.students.total],
      ['Active',   dashboardStats.students.active],
      ['Inactive', dashboardStats.students.inactive],
      [''], ['STUDENT ATTENDANCE'],
      ['Marked',     dashboardStats.studentAttendance.marked],
      ['Present',    dashboardStats.studentAttendance.present],
      ['Absent',     dashboardStats.studentAttendance.absent],
      ['Percentage', `${dashboardStats.studentAttendance.percentage}%`],
      [''], ['STAFF ATTENDANCE'],
      ['Marked',     dashboardStats.staffAttendance.marked],
      ['Present',    dashboardStats.staffAttendance.present],
      ['Percentage', `${dashboardStats.staffAttendance.percentage}%`],
    ];
    const csv  = [['Metric','Value'], ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `MIS_${timeRange}_${new Date().toISOString().split('T')[0]}.csv` });
    a.click();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96">
      <RefreshCw className="w-12 h-12 animate-spin text-[#C8294A] mb-4" />
      <p className="text-gray-600">Loading Dashboard...</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive analytics and management</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#C8294A] bg-white text-sm">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="all">All Time</option>
          </select>
          <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#C8294A] bg-white text-sm">
            <option value="all">All Branches</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <button onClick={exportMISReport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> Export MIS
          </button>
          <button onClick={fetchAll}
            className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2d2d2d] flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-[#C8294A] text-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm font-medium">Total Leads</p>
              <h3 className="text-3xl font-bold mt-2">{dashboardStats.leads.total}</h3>
              <p className="text-white/80 text-xs mt-2">Conversion: {dashboardStats.leads.conversionRate}%</p>
            </div>
            <div className="bg-white/20 p-2.5 rounded-lg"><Users className="w-7 h-7" /></div>
          </div>
        </div>

        <div className="bg-green-600 text-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm font-medium">Total Revenue</p>
              <h3 className="text-3xl font-bold mt-2">{formatINR(dashboardStats.revenue.collected)}</h3>
              <p className="text-white/80 text-xs mt-2">Pending: {formatINR(dashboardStats.revenue.pending)}</p>
            </div>
            <div className="bg-white/20 p-2.5 rounded-lg"><DollarSign className="w-7 h-7" /></div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] text-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm font-medium">Total Students</p>
              <h3 className="text-3xl font-bold mt-2">{dashboardStats.students.total}</h3>
              <p className="text-white/80 text-xs mt-2">Active: {dashboardStats.students.active}</p>
            </div>
            <div className="bg-white/20 p-2.5 rounded-lg"><GraduationCap className="w-7 h-7" /></div>
          </div>
        </div>

        {/* Student Attendance — separate from staff so the % means something */}
        <div className="bg-orange-500 text-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm font-medium">Student Attendance</p>
              <h3 className="text-3xl font-bold mt-2">{dashboardStats.studentAttendance.percentage}%</h3>
              <p className="text-white/80 text-xs mt-2">
                Present: {dashboardStats.studentAttendance.present}/{dashboardStats.studentAttendance.denominator || 0}
              </p>
            </div>
            <div className="bg-white/20 p-2.5 rounded-lg"><CheckCircle className="w-7 h-7" /></div>
          </div>
        </div>

        {/* Staff Attendance — distinct dataset, distinct denominator */}
        <div className="bg-blue-600 text-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm font-medium">Staff Attendance</p>
              <h3 className="text-3xl font-bold mt-2">{dashboardStats.staffAttendance.percentage}%</h3>
              <p className="text-white/80 text-xs mt-2">
                Present: {dashboardStats.staffAttendance.present}/{dashboardStats.staffAttendance.denominator || 0}
              </p>
            </div>
            <div className="bg-white/20 p-2.5 rounded-lg"><Briefcase className="w-7 h-7" /></div>
          </div>
        </div>
      </div>

      {/* Lead Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: Phone,     color: 'text-gray-600',   label: 'Enquiry',    value: dashboardStats.leads.enquiry },
          { icon: UserCheck, color: 'text-[#C8294A]',  label: 'Counselling',value: dashboardStats.leads.counselling },
          { icon: Users,     color: 'text-[#1a1a1a]',  label: 'Free Batch', value: dashboardStats.leads.freeBatch },
          { icon: TrendingUp,color: 'text-yellow-600', label: 'Conversion', value: `${dashboardStats.leads.conversionRate}%` },
          { icon: DollarSign,color: 'text-green-600',  label: 'Paid Batch', value: dashboardStats.leads.paidBatch },
          { icon: Award,     color: 'text-[#C8294A]',  label: 'Admission',  value: dashboardStats.leads.converted },
        ].map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <h4 className="font-semibold text-gray-700 text-sm">{label}</h4>
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Revenue Trend</h3>
            <BarChart3 className="w-5 h-5 text-[#C8294A]" />
          </div>
          <RevenueChart timeRange={timeRange} payments={filteredPayments} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Conversion Funnel</h3>
            <TrendingUp className="w-5 h-5 text-[#C8294A]" />
          </div>
          <ConversionFunnel data={dashboardStats.leads} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Lead Sources</h3>
            <PieChart className="w-5 h-5 text-[#C8294A]" />
          </div>
          <LeadSourceChart />
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Branch Performance</h3>
            <Building2 className="w-5 h-5 text-[#C8294A]" />
          </div>
          <BranchPerformance
            branches={branches}
            leads={allLeads.filter(l => inRange(l.createdAt, range))}
            students={allStudents.filter(s => inRange(s.createdAt, range))}
            highlightBranch={selectedBranch}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Recent Leads</h3>
          </div>
          <div className="p-6 space-y-3">
            {recentLeads.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent leads</p>
              </div>
            ) : recentLeads.map(lead => (
              <div key={lead._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-800">{lead.fullName}</p>
                  <p className="text-sm text-gray-600">{lead.mobile} • {lead.email}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    lead.stage === 'Enquiry'    ? 'bg-gray-100 text-gray-800' :
                    lead.stage === 'Counselling'? 'bg-[#C8294A]/10 text-[#C8294A]' :
                    lead.stage === 'Free Batch' ? 'bg-[#1a1a1a]/10 text-[#1a1a1a]' :
                    lead.stage === 'Paid Batch' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>{lead.stage}</span>
                  <p className="text-xs text-gray-500 mt-1">{new Date(lead.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Recent Remarks</h3>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto space-y-3">
            {recentRemarks.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent remarks</p>
              </div>
            ) : recentRemarks.map((remark, i) => {
              const addedBy = remark.addedBy?.firstName
                ? `${remark.addedBy.firstName} ${remark.addedBy.lastName || ''}`.trim()
                : (remark.addedBy || 'System');
              return (
                <div key={i} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between mb-1">
                    <p className="font-medium text-gray-800">{remark.leadName}</p>
                    <span className="text-xs text-gray-500">
                      {remark.addedAt ? new Date(remark.addedAt).toLocaleDateString('en-IN') : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{remark.note || remark.text}</p>
                  <p className="text-xs text-gray-500 mt-1">By: {addedBy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MIS Report */}
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[#1a1a1a]">Daily MIS Report</h3>
          <button onClick={exportMISReport} className="text-sm text-[#C8294A] hover:text-[#a01f39] flex items-center gap-1">
            <Download className="w-4 h-4" /> Download Full Report
          </button>
        </div>
        <div className="p-6">
          <DailyMISReport stats={dashboardStats} timeRange={timeRange} />
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
        <div className="p-6 border-b flex items-center gap-2">
          <Database className="w-5 h-5 text-[#1a1a1a]" />
          <h3 className="text-lg font-semibold text-[#1a1a1a]">Backup & Restore</h3>
        </div>
        <div className="p-6"><BackupRestore /></div>
      </div>
    </div>
  );
};

export default OverviewPanel;
