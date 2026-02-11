import React, { useState, useEffect } from 'react';
import {Users, DollarSign, TrendingUp, Award, Calendar,FileText, Download, RefreshCw, Database, Building2,Phone, UserCheck, GraduationCap, BarChart3, PieChart,Clock, CheckCircle, XCircle, AlertCircle} from 'lucide-react';
import axiosInstance from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';
import RevenueChart from '../../components/admin/analytics/RevenueChart';
import ConversionFunnel from '../../components/admin/analytics/ConversionFunnel';
import LeadSourceChart from '../../components/admin/analytics/LeadSourceChart';
import BranchPerformance from '../../components/admin/analytics/BranchPerformance';
import DailyMISReport from '../../components/admin/analytics/DailyMISReport';
import BackupRestore from '../../components/admin/BackupRestore';
import AttendancePanel from '../../components/admin/AttendancePanel';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('daily');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [activeSection, setActiveSection] = useState('dashboard'); 

  const [dashboardStats, setDashboardStats] = useState({
    leads: {
      total: 0,
      enquiry: 0,
      counselling: 0,
      freeBatch: 0,
      paidBatch: 0,
      converted: 0,
      conversionRate: 0
    },
    students: {
      total: 0,
      active: 0,
      inactive: 0,
      free: 0,
      paid: 0
    },
    revenue: {
      total: 0,
      collected: 0,
      pending: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    },
    attendance: {
      today: 0,
      present: 0,
      absent: 0,
      percentage: 0
    },
    batches: {
      total: 0,
      active: 0,
      free: 0,
      paid: 0
    }
  });

  const [recentLeads, setRecentLeads] = useState([]);
  const [recentRemarks, setRecentRemarks] = useState([]);
  const [branches, setBranches] = useState(['Mumbai', 'Delhi', 'Bangalore', 'Pune']);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, selectedBranch]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchLeadStats(),
        fetchStudentStats(),
        fetchRevenueStats(),
        fetchAttendanceStats(),
        fetchBatchStats(),
        fetchRecentData()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadStats = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.leads.stats);
      const stats = response.data.data || response.data || {};
      
      const total = stats.totalLeads || stats.total || 0;
      const byStage = stats.byStage || {};
      const converted = byStage['Admission'] || byStage['admission'] || 0;
      const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(2) : 0;

      setDashboardStats(prev => ({
        ...prev,
        leads: {
          total: total,
          enquiry: byStage['Enquiry'] || byStage['enquiry'] || 0,
          counselling: byStage['Counselling'] || byStage['counselling'] || 0,
          freeBatch: byStage['Free Batch'] || byStage['freeBatch'] || 0,
          paidBatch: byStage['Paid Batch'] || byStage['paidBatch'] || 0,
          converted: converted,
          conversionRate: conversionRate
        }
      }));
    } catch (error) {
      console.error('Error fetching lead stats:', error);
      setDashboardStats(prev => ({
        ...prev,
        leads: {
          total: 0,
          enquiry: 0,
          counselling: 0,
          freeBatch: 0,
          paidBatch: 0,
          converted: 0,
          conversionRate: 0
        }
      }));
    }
  };

  const fetchStudentStats = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.students.stats);

      const stats = response.data.data || response.data || {};

      setDashboardStats(prev => ({
        ...prev,
        students: {
          total: stats.total || stats.totalStudents || 0,
          active: stats.active || stats.activeStudents || 0,
          inactive: stats.inactive || stats.inactiveStudents || 0,
          free: stats.freeBatch || stats.freeStudents || 0,
          paid: stats.paidBatch || stats.paidStudents || 0
        }
      }));
    } catch (error) {
      console.error('Error fetching student stats:', error);
      setDashboardStats(prev => ({
        ...prev,
        students: {
          total: 0,
          active: 0,
          inactive: 0,
          free: 0,
          paid: 0
        }
      }));
    }
  };

  const fetchRevenueStats = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.students.base);
      
      // Handle different response structures
      let students = [];
      
      if (Array.isArray(response.data)) {
        students = response.data;
      } else if (Array.isArray(response.data.data)) {
        students = response.data.data;
      } else if (response.data.students && Array.isArray(response.data.students)) {
        students = response.data.students;
      } else {
        console.warn('Students data is not an array:', response.data);
        students = [];
      }

      const total = students.reduce((sum, s) => sum + (s.totalFees || 0), 0);
      const collected = students.reduce((sum, s) => sum + (s.paidFees || 0), 0);
      const pending = students.reduce((sum, s) => sum + (s.pendingFees || 0), 0);

      setDashboardStats(prev => ({
        ...prev,
        revenue: {
          total,
          collected,
          pending,
          today: 0,
          thisWeek: 0,
          thisMonth: collected
        }
      }));
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      setDashboardStats(prev => ({
        ...prev,
        revenue: {
          total: 0,
          collected: 0,
          pending: 0,
          today: 0,
          thisWeek: 0,
          thisMonth: 0
        }
      }));
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      // Use the correct statistics endpoint
      const response = await axiosInstance.get(
        API_ENDPOINTS.studentAttendance.statistics
      );
         
      // Handle different response structures
      const statsData = response.data?.data || response.data || {};
      
      setDashboardStats(prev => ({
        ...prev,
        attendance: {
          today: statsData.total || 0,
          present: statsData.present || 0,
          absent: statsData.absent || 0,
          percentage: parseFloat(statsData.presentPercentage || 0)
        }
      }));
    } catch (error) {
      console.error('❌ Error fetching attendance stats:', error.response?.data || error.message);
      setDashboardStats(prev => ({
        ...prev,
        attendance: {
          today: 0,
          present: 0,
          absent: 0,
          percentage: 0
        }
      }));
    }
  };

  const fetchBatchStats = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.batches.statistics);

      const stats = response.data.data || response.data || {};

      setDashboardStats(prev => ({
        ...prev,
        batches: {
          total: stats.totalBatches || stats.total || 0,
          active: stats.activeBatches || stats.active || 0,
          free: stats.freeBatches || stats.free || 0,
          paid: stats.paidBatches || stats.paid || 0
        }
      }));
    } catch (error) {
      console.error('Error fetching batch stats:', error);
      setDashboardStats(prev => ({
        ...prev,
        batches: {
          total: 0,
          active: 0,
          free: 0,
          paid: 0
        }
      }));
    }
  };

  const fetchRecentData = async () => {
    try {
      const leadsResponse = await axiosInstance.get(API_ENDPOINTS.leads.base);
      
      // Handle different response structures
      let allLeads = [];
      
      if (Array.isArray(leadsResponse.data)) {
        allLeads = leadsResponse.data;
      } else if (Array.isArray(leadsResponse.data.data)) {
        allLeads = leadsResponse.data.data;
      } else if (leadsResponse.data.leads && Array.isArray(leadsResponse.data.leads)) {
        allLeads = leadsResponse.data.leads;
      } else {
        console.warn('Leads data is not an array:', leadsResponse.data);
        allLeads = [];
      }

      // Get recent 5 leads
      setRecentLeads(allLeads.slice(0, 5));

      // Extract remarks from leads
      const remarksData = allLeads
        .filter(lead => lead.remarks && Array.isArray(lead.remarks) && lead.remarks.length > 0)
        .flatMap(lead => lead.remarks.map(remark => ({
          ...remark,
          leadName: lead.fullName || 'Unknown',
          leadId: lead._id
        })))
        .sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0))
        .slice(0, 10);
      
      setRecentRemarks(remarksData);

    } catch (error) {
      console.error('Error fetching recent data:', error);
      setRecentLeads([]);
      setRecentRemarks([]);
    }
  };

  const exportMISReport = () => {
    const headers = ['Metric', 'Value'];
    
    const rows = [
      ['Report Date', new Date().toLocaleString()],
      ['Time Range', timeRange.toUpperCase()],
      ['Branch', selectedBranch === 'all' ? 'All Branches' : selectedBranch],
      [''],
      ['LEADS'],
      ['Total Leads', dashboardStats.leads.total],
      ['Enquiry Stage', dashboardStats.leads.enquiry],
      ['Counselling Stage', dashboardStats.leads.counselling],
      ['Free Batch', dashboardStats.leads.freeBatch],
      ['Paid Batch', dashboardStats.leads.paidBatch],
      ['Converted (Admission)', dashboardStats.leads.converted],
      ['Conversion Rate', `${dashboardStats.leads.conversionRate}%`],
      [''],
      ['STUDENTS'],
      ['Total Students', dashboardStats.students.total],
      ['Active Students', dashboardStats.students.active],
      ['Inactive Students', dashboardStats.students.inactive],
      ['Free Batch Students', dashboardStats.students.free],
      ['Paid Batch Students', dashboardStats.students.paid],
      [''],
      ['REVENUE'],
      ['Total Revenue', `₹${dashboardStats.revenue.total.toLocaleString()}`],
      ['Collected', `₹${dashboardStats.revenue.collected.toLocaleString()}`],
      ['Pending', `₹${dashboardStats.revenue.pending.toLocaleString()}`],
      ['This Month', `₹${dashboardStats.revenue.thisMonth.toLocaleString()}`],
      [''],
      ['ATTENDANCE (Today)'],
      ['Total Classes', dashboardStats.attendance.today],
      ['Present', dashboardStats.attendance.present],
      ['Absent', dashboardStats.attendance.absent],
      ['Attendance %', `${dashboardStats.attendance.percentage}%`],
      [''],
      ['BATCHES'],
      ['Total Batches', dashboardStats.batches.total],
      ['Active Batches', dashboardStats.batches.active],
      ['Free Batches', dashboardStats.batches.free],
      ['Paid Batches', dashboardStats.batches.paid],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MIS_Report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-lg text-gray-600">Loading Dashboard...</p>
        <p className="text-sm text-gray-500 mt-2">Fetching analytics data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive analytics and management</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* ection Toggle Buttons */}
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeSection === 'dashboard'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveSection('attendance')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeSection === 'attendance'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Attendance
          </button>

          {/* Show filters only on dashboard */}
          {activeSection === 'dashboard' && (
            <>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>

              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Branches</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>

              <button
                onClick={exportMISReport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export MIS
              </button>

              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </>
          )}
        </div>
      </div>

      {/* Conditional Rendering: Dashboard or Attendance */}
      {activeSection === 'attendance' ? (
        /* Attendance Panel */
        <AttendancePanel />
      ) : (
        /* Original Dashboard Content */
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Leads */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Leads</p>
                  <h3 className="text-4xl font-bold mt-2">{dashboardStats.leads.total}</h3>
                  <p className="text-blue-100 text-sm mt-2">
                    Conversion: {dashboardStats.leads.conversionRate}%
                  </p>
                </div>
                <div className="bg-blue-400 bg-opacity-30 p-3 rounded-lg">
                  <Users className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                  <h3 className="text-4xl font-bold mt-2">
                    ₹{(dashboardStats.revenue.collected / 100000).toFixed(1)}L
                  </h3>
                  <p className="text-green-100 text-sm mt-2">
                    Pending: ₹{(dashboardStats.revenue.pending / 100000).toFixed(1)}L
                  </p>
                </div>
                <div className="bg-green-400 bg-opacity-30 p-3 rounded-lg">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* Total Students */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Students</p>
                  <h3 className="text-4xl font-bold mt-2">{dashboardStats.students.total}</h3>
                  <p className="text-purple-100 text-sm mt-2">
                    Active: {dashboardStats.students.active}
                  </p>
                </div>
                <div className="bg-purple-400 bg-opacity-30 p-3 rounded-lg">
                  <GraduationCap className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* Today's Attendance */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Today's Attendance</p>
                  <h3 className="text-4xl font-bold mt-2">{dashboardStats.attendance.percentage}%</h3>
                  <p className="text-orange-100 text-sm mt-2">
                    Present: {dashboardStats.attendance.present}/{dashboardStats.attendance.today}
                  </p>
                </div>
                <div className="bg-orange-400 bg-opacity-30 p-3 rounded-lg">
                  <CheckCircle className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Lead Pipeline Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-700 text-sm">Enquiry</h4>
              </div>
              <p className="text-3xl font-bold text-gray-800">{dashboardStats.leads.enquiry}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-700 text-sm">Counselling</h4>
              </div>
              <p className="text-3xl font-bold text-blue-600">{dashboardStats.leads.counselling}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-700 text-sm">Free Batch</h4>
              </div>
              <p className="text-3xl font-bold text-purple-600">{dashboardStats.leads.freeBatch}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
                <h4 className="font-semibold text-gray-700 text-sm">Conversion</h4>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{dashboardStats.leads.conversionRate}%</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-700 text-sm">Paid Batch</h4>
              </div>
              <p className="text-3xl font-bold text-green-600">{dashboardStats.leads.paidBatch}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-700 text-sm">Admission</h4>
              </div>
              <p className="text-3xl font-bold text-blue-600">{dashboardStats.leads.converted}</p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Revenue Trend</h3>
                <BarChart3 className="w-5 h-5 text-gray-600" />
              </div>
              <RevenueChart timeRange={timeRange} />
            </div>

            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Conversion Funnel</h3>
                <TrendingUp className="w-5 h-5 text-gray-600" />
              </div>
              <ConversionFunnel data={dashboardStats.leads} />
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Lead Sources</h3>
                <PieChart className="w-5 h-5 text-gray-600" />
              </div>
              <LeadSourceChart />
            </div>

            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Branch Performance</h3>
                <Building2 className="w-5 h-5 text-gray-600" />
              </div>
              <BranchPerformance branches={branches} />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Leads */}
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Recent Leads</h3>
              </div>
              <div className="p-6">
                {recentLeads.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent leads</p>
                    <p className="text-sm text-gray-400 mt-1">New leads will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentLeads.map((lead) => (
                      <div key={lead._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{lead.fullName}</p>
                          <p className="text-sm text-gray-600">{lead.mobile} • {lead.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            lead.stage === 'Enquiry' ? 'bg-gray-100 text-gray-800' :
                            lead.stage === 'Counselling' ? 'bg-blue-100 text-blue-800' :
                            lead.stage === 'Free Batch' ? 'bg-purple-100 text-purple-800' :
                            lead.stage === 'Paid Batch' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {lead.stage}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Remarks */}
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Recent Remarks</h3>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                {recentRemarks.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent remarks</p>
                    <p className="text-sm text-gray-400 mt-1">Remarks will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentRemarks.map((remark, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-gray-800">{remark.leadName}</p>
                          <span className="text-xs text-gray-500">
                            {new Date(remark.timestamp || remark.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{remark.text}</p>
                        <p className="text-xs text-gray-500 mt-1">By: {remark.addedBy || 'System'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Daily MIS Report */}
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Daily MIS Report</h3>
                <button
                  onClick={exportMISReport}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download Full Report
                </button>
              </div>
            </div>
            <div className="p-6">
              <DailyMISReport stats={dashboardStats} timeRange={timeRange} />
            </div>
          </div>

          {/* Backup & Restore Section */}
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-800">Backup & Restore</h3>
              </div>
            </div>
            <div className="p-6">
              <BackupRestore />
            </div>
          </div>
        </>
      )}
    </div>
  );
};


export default AdminDashboard;
