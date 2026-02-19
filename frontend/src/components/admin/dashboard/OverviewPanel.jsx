import React, { useState, useEffect } from 'react';
import {
  Users, DollarSign, TrendingUp, Award, Calendar, FileText,
  Download, RefreshCw, Database, Building2, Phone, UserCheck,
  GraduationCap, BarChart3, PieChart, CheckCircle
} from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { API_ENDPOINTS } from '../../../config/api';
import RevenueChart     from '../analytics/RevenueChart';
import ConversionFunnel from '../analytics/ConversionFunnel';
import LeadSourceChart  from '../analytics/LeadSourceChart';
import BranchPerformance from '../analytics/BranchPerformance';
import DailyMISReport   from '../analytics/DailyMISReport';
import BackupRestore    from '../BackupRestore';

const OverviewPanel = () => {
  const [loading, setLoading]           = useState(true);
  const [timeRange, setTimeRange]       = useState('daily');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [branches]                      = useState(['Mumbai', 'Delhi', 'Bangalore', 'Pune']);

  const [dashboardStats, setDashboardStats] = useState({
    leads:      { total: 0, enquiry: 0, counselling: 0, freeBatch: 0, paidBatch: 0, converted: 0, conversionRate: 0 },
    students:   { total: 0, active: 0, inactive: 0, free: 0, paid: 0 },
    revenue:    { total: 0, collected: 0, pending: 0, today: 0, thisWeek: 0, thisMonth: 0 },
    attendance: { today: 0, present: 0, absent: 0, percentage: 0 },
    batches:    { total: 0, active: 0, free: 0, paid: 0 }
  });

  const [recentLeads,   setRecentLeads]   = useState([]);
  const [recentRemarks, setRecentRemarks] = useState([]);

  useEffect(() => { fetchAll(); }, [timeRange, selectedBranch]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchLeadStats(), fetchStudentStats(), fetchRevenueStats(),
        fetchAttendanceStats(), fetchBatchStats(), fetchRecentData()
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadStats = async () => {
    try {
      const res   = await axiosInstance.get(API_ENDPOINTS.leads.stats);
      const stats = res.data.data || res.data || {};
      const total = stats.totalLeads || stats.total || 0;
      const byStage   = stats.byStage || {};
      const converted = byStage['Admission'] || 0;
      const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(2) : 0;
      setDashboardStats(p => ({ ...p, leads: {
        total, converted, conversionRate,
        enquiry:     byStage['Enquiry']     || 0,
        counselling: byStage['Counselling'] || 0,
        freeBatch:   byStage['Free Batch']  || 0,
        paidBatch:   byStage['Paid Batch']  || 0,
      }}));
    } catch (e) { console.error(e); }
  };

  const fetchStudentStats = async () => {
    try {
      const res   = await axiosInstance.get(API_ENDPOINTS.students.stats);
      const stats = res.data.data || res.data || {};
      setDashboardStats(p => ({ ...p, students: {
        total:    stats.total    || 0,
        active:   stats.active   || 0,
        inactive: stats.inactive || 0,
        free:     stats.freeBatch || 0,
        paid:     stats.paidBatch || 0,
      }}));
    } catch (e) { console.error(e); }
  };

  const fetchRevenueStats = async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.fees.stats);
      const stats = res.data.data || res.data || {};
      setDashboardStats(p => ({ ...p, revenue: {
        total:     stats.totalRevenue    || 0,
        collected: stats.collectedAmount || 0,
        pending:   stats.pendingAmount   || 0,
        today:     stats.todayRevenue    || 0,
        thisWeek:  stats.weekRevenue     || 0,
        thisMonth: stats.monthRevenue    || 0,
      }}));
    } catch (e) { console.error(e); }
  };

  const fetchAttendanceStats = async () => {
    try {
      const res       = await axiosInstance.get(API_ENDPOINTS.studentAttendance.statistics);
      const statsData = res.data?.data || res.data || {};
      setDashboardStats(p => ({ ...p, attendance: {
        today:      statsData.total              || 0,
        present:    statsData.present            || 0,
        absent:     statsData.absent             || 0,
        percentage: parseFloat(statsData.presentPercentage || 0),
      }}));
    } catch (e) { console.error(e); }
  };

  const fetchBatchStats = async () => {
    try {
      const res   = await axiosInstance.get(API_ENDPOINTS.batches.statistics);
      const stats = res.data.data || res.data || {};
      setDashboardStats(p => ({ ...p, batches: {
        total:  stats.totalBatches  || 0,
        active: stats.activeBatches || 0,
        free:   stats.freeBatches   || 0,
        paid:   stats.paidBatches   || 0,
      }}));
    } catch (e) { console.error(e); }
  };

  const fetchRecentData = async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.leads.base);
      let allLeads = Array.isArray(res.data) ? res.data
        : Array.isArray(res.data?.data) ? res.data.data
        : res.data?.leads || [];
      setRecentLeads(allLeads.slice(0, 5));
      const remarks = allLeads
        .filter(l => l.remarks?.length)
        .flatMap(l => l.remarks.map(r => ({ ...r, leadName: l.fullName || 'Unknown' })))
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        .slice(0, 10);
      setRecentRemarks(remarks);
    } catch (e) { console.error(e); }
  };

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
      ['Collected', `₹${dashboardStats.revenue.collected.toLocaleString()}`],
      ['Pending',   `₹${dashboardStats.revenue.pending.toLocaleString()}`],
      [''], ['STUDENTS'],
      ['Total',    dashboardStats.students.total],
      ['Active',   dashboardStats.students.active],
      ['Inactive', dashboardStats.students.inactive],
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#C8294A] text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm font-medium">Total Leads</p>
              <h3 className="text-4xl font-bold mt-2">{dashboardStats.leads.total}</h3>
              <p className="text-white/80 text-sm mt-2">Conversion: {dashboardStats.leads.conversionRate}%</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg"><Users className="w-8 h-8" /></div>
          </div>
        </div>

        <div className="bg-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm font-medium">Total Revenue</p>
              <h3 className="text-4xl font-bold mt-2">₹{(dashboardStats.revenue.collected / 100000).toFixed(1)}L</h3>
              <p className="text-white/80 text-sm mt-2">Pending: ₹{(dashboardStats.revenue.pending / 100000).toFixed(1)}L</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg"><DollarSign className="w-8 h-8" /></div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm font-medium">Total Students</p>
              <h3 className="text-4xl font-bold mt-2">{dashboardStats.students.total}</h3>
              <p className="text-white/80 text-sm mt-2">Active: {dashboardStats.students.active}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg"><GraduationCap className="w-8 h-8" /></div>
          </div>
        </div>

        <div className="bg-orange-500 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm font-medium">Today's Attendance</p>
              <h3 className="text-4xl font-bold mt-2">{dashboardStats.attendance.percentage}%</h3>
              <p className="text-white/80 text-sm mt-2">Present: {dashboardStats.attendance.present}/{dashboardStats.attendance.today}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg"><CheckCircle className="w-8 h-8" /></div>
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
          <RevenueChart timeRange={timeRange} />
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
          <BranchPerformance branches={branches} />
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
            ) : recentRemarks.map((remark, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex justify-between mb-1">
                  <p className="font-medium text-gray-800">{remark.leadName}</p>
                  <span className="text-xs text-gray-500">{new Date(remark.timestamp || remark.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-600">{remark.text}</p>
                <p className="text-xs text-gray-500 mt-1">By: {remark.addedBy || 'System'}</p>
              </div>
            ))}
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
