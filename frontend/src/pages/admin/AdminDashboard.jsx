import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';

// Panel Components
import OverviewPanel   from '../../components/admin/dashboard/OverviewPanel';
import LeadsPanel      from '../../components/admin/dashboard/LeadsPanel';
import StudentsPanel   from '../../components/admin/dashboard/StudentsPanel';
import StaffPanel      from '../../components/admin/dashboard/StaffPanel';
import FeesPanel       from '../../components/admin/dashboard/FeesPanel';
import AttendancePanel from '../../components/admin/dashboard/AttendancePanel';
import LiveClassesPanel from '../../components/admin/dashboard/LiveClassesPanel';
import CertificatesPanel from '../../components/admin/dashboard/CertificatesPanel';
import ReportsPanel    from '../../components/admin/dashboard/ReportsPanel';
import SettingsPanel   from '../../components/admin/dashboard/SettingsPanel';

// Map sidebar href → panel component
const PANEL_MAP = {
  '/dashboard':               OverviewPanel,
  '/admin/leads':             LeadsPanel,
  '/admin/students':          StudentsPanel,
  '/admin/staff':             StaffPanel,
  '/admin/fee':               FeesPanel,
  '/admin/student-attendance': AttendancePanel,
  '/admin/staff-attendance':  AttendancePanel,
  '/admin/classes':           LiveClassesPanel,
  '/admin/certificates':      CertificatesPanel,
  '/admin/reports':           ReportsPanel,
  '/admin/settings':          SettingsPanel,
};

const DEFAULT_STATS = {
  leads:      { total: 0, enquiry: 0, counselling: 0, freeBatch: 0, paidBatch: 0, converted: 0, conversionRate: 0 },
  students:   { total: 0, active: 0, inactive: 0, free: 0, paid: 0 },
  revenue:    { total: 0, collected: 0, pending: 0 },
  attendance: { today: 0, present: 0, absent: 0, percentage: 0 },
  batches:    { total: 0, active: 0, free: 0, paid: 0 }
};
const AdminDashboard = () => {
  const location = useLocation();
  const [timeRange, setTimeRange] = useState('daily');
  const [stats, setStats]         = useState(DEFAULT_STATS);
  const [statsLoaded, setStatsLoaded] = useState(false);

  // Resolve active panel from current URL path
  const ActivePanel = PANEL_MAP[location.pathname] || OverviewPanel;
  useEffect(() => {
    if (location.pathname === '/admin/reports' && !statsLoaded) {
      fetchAllStats();
    }
  }, [location.pathname]);

  //  Re-fetch when timeRange changes on reports page
  useEffect(() => {
    if (location.pathname === '/admin/reports') {
      fetchAllStats();
    }
  }, [timeRange]);

  const fetchAllStats = async () => {
    try {
      const [leadsRes, studentsRes, feesRes, attendanceRes, batchesRes] = await Promise.allSettled([
        axiosInstance.get(API_ENDPOINTS.leads.stats),
        axiosInstance.get(API_ENDPOINTS.students.stats),
        axiosInstance.get(API_ENDPOINTS.fees.stats),
        axiosInstance.get(API_ENDPOINTS.studentAttendance.statistics),
        axiosInstance.get(API_ENDPOINTS.batches.statistics),
      ]);

      // Leads
      if (leadsRes.status === 'fulfilled') {
        const d       = leadsRes.value.data.data || leadsRes.value.data || {};
        const total   = d.totalLeads || d.total || 0;
        const byStage = d.byStage || {};
        const converted = byStage['Admission'] || 0;
        setStats(p => ({ ...p, leads: {
          total, converted,
          conversionRate: total > 0 ? ((converted / total) * 100).toFixed(2) : 0,
          enquiry:        byStage['Enquiry']     || 0,
          counselling:    byStage['Counselling'] || 0,
          freeBatch:      byStage['Free Batch']  || 0,
          paidBatch:      byStage['Paid Batch']  || 0,
        }}));
      }

      // Students
      if (studentsRes.status === 'fulfilled') {
        const d = studentsRes.value.data.data || studentsRes.value.data || {};
        setStats(p => ({ ...p, students: {
          total:    d.total    || d.totalStudents  || 0,
          active:   d.active   || d.activeStudents || 0,
          inactive: d.inactive || 0,
          free:     d.freeBatch || 0,
          paid:     d.paidBatch || 0,
        }}));
      }

      // Revenue/Fees
      if (feesRes.status === 'fulfilled') {
        const d = feesRes.value.data.data || feesRes.value.data || {};
        setStats(p => ({ ...p, revenue: {
          total:     d.totalRevenue    || 0,
          collected: d.collectedAmount || 0,
          pending:   d.pendingAmount   || 0,
        }}));
      }

      // Attendance
      if (attendanceRes.status === 'fulfilled') {
        const d = attendanceRes.value.data?.data || attendanceRes.value.data || {};
        setStats(p => ({ ...p, attendance: {
          today:      d.total              || 0,
          present:    d.present            || 0,
          absent:     d.absent             || 0,
          percentage: parseFloat(d.presentPercentage || 0),
        }}));
      }

      // Batches
      if (batchesRes.status === 'fulfilled') {
        const d = batchesRes.value.data.data || batchesRes.value.data || {};
        setStats(p => ({ ...p, batches: {
          total:  d.totalBatches  || d.total  || 0,
          active: d.activeBatches || d.active || 0,
          free:   d.freeBatches   || d.free   || 0,
          paid:   d.paidBatches   || d.paid   || 0,
        }}));
      }

      setStatsLoaded(true);
    } catch (e) {
      console.error('AdminDashboard fetchAllStats error:', e);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <ActivePanel
        // Pass pathname so AttendancePanel knows if it's staff or student
        attendanceType={
          location.pathname === '/admin/staff-attendance' ? 'staff' : 'student'
        }
        // ReportsPanel props 
        stats={stats}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        onRefresh={fetchAllStats}
      />
    </div>
  );
};

export default AdminDashboard;
