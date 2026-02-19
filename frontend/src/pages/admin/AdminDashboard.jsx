import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useLocation } from 'react-router-dom';

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

const AdminDashboard = () => {
  const location = useLocation();

  // Resolve active panel from current URL path
  const ActivePanel = PANEL_MAP[location.pathname] || OverviewPanel;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <ActivePanel
        // Pass pathname so AttendancePanel knows if it's staff or student
        attendanceType={
          location.pathname === '/admin/staff-attendance' ? 'staff' : 'student'
        }
      />
    </div>
  );
};

export default AdminDashboard;
