import React from 'react';
import { CheckCircle, XCircle, TrendingUp, Users, Briefcase } from 'lucide-react';

// Match the magnitude of the stat so a ₹4,000 amount doesn't read as ₹0.0L.
const formatINR = (n) => {
  const v = Number(n) || 0;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
};

const DailyMISReport = ({ stats, timeRange }) => {
  // Tolerate both the new shape (studentAttendance / staffAttendance) and the
  // legacy shape (single `attendance`) so this component doesn't crash if a
  // future caller hasn't migrated yet.
  const stuAtt = stats.studentAttendance || stats.attendance || {};
  const stfAtt = stats.staffAttendance   || {};

  const reportData = [
    {
      category: 'Lead Management',
      metrics: [
        { label: 'Total Leads',      value: stats.leads.total,                 icon: Users,       color: 'text-blue-600'  },
        { label: 'Enquiry Stage',    value: stats.leads.enquiry,               icon: CheckCircle, color: 'text-gray-600'  },
        { label: 'Counselling Stage',value: stats.leads.counselling,           icon: CheckCircle, color: 'text-blue-600'  },
        { label: 'Free Batch',       value: stats.leads.freeBatch,             icon: CheckCircle, color: 'text-purple-600'},
        { label: 'Paid Batch',       value: stats.leads.paidBatch,             icon: CheckCircle, color: 'text-green-600' },
        { label: 'Converted',        value: stats.leads.converted,             icon: CheckCircle, color: 'text-green-600' },
        { label: 'Conversion Rate',  value: `${stats.leads.conversionRate}%`,  icon: TrendingUp,  color: 'text-yellow-600'},
      ],
    },
    {
      category: 'Student Management',
      metrics: [
        { label: 'Total Students',       value: stats.students.total,    icon: Users,       color: 'text-purple-600' },
        { label: 'Active Students',      value: stats.students.active,   icon: CheckCircle, color: 'text-green-600'  },
        { label: 'Inactive Students',    value: stats.students.inactive, icon: XCircle,     color: 'text-red-600'    },
        { label: 'Free Batch Students',  value: stats.students.free,     icon: Users,       color: 'text-purple-600' },
        { label: 'Paid Batch Students',  value: stats.students.paid,     icon: Users,       color: 'text-green-600'  },
      ],
    },
    {
      category: 'Revenue',
      metrics: [
        { label: 'Total Revenue', value: formatINR(stats.revenue.total),     icon: TrendingUp,  color: 'text-green-600' },
        { label: 'Collected',     value: formatINR(stats.revenue.collected), icon: CheckCircle, color: 'text-green-600' },
        { label: 'Pending',       value: formatINR(stats.revenue.pending),   icon: XCircle,     color: 'text-red-600'   },
      ],
    },
    {
      category: 'Student Attendance',
      metrics: [
        { label: 'Marked',     value: stuAtt.marked     ?? stuAtt.today ?? 0, icon: Users,       color: 'text-blue-600'   },
        { label: 'Present',    value: stuAtt.present    ?? 0,                 icon: CheckCircle, color: 'text-green-600'  },
        { label: 'Absent',     value: stuAtt.absent     ?? 0,                 icon: XCircle,     color: 'text-red-600'    },
        { label: 'Attendance %',value: `${stuAtt.percentage ?? 0}%`,          icon: TrendingUp,  color: 'text-orange-600' },
      ],
    },
    {
      category: 'Staff Attendance',
      metrics: [
        { label: 'Marked',     value: stfAtt.marked     ?? 0,         icon: Briefcase,   color: 'text-blue-600'   },
        { label: 'Present',    value: stfAtt.present    ?? 0,         icon: CheckCircle, color: 'text-green-600'  },
        { label: 'Today',      value: stfAtt.today      ?? 0,         icon: Users,       color: 'text-purple-600' },
        { label: 'Attendance %',value: `${stfAtt.percentage ?? 0}%`,  icon: TrendingUp,  color: 'text-orange-600' },
      ],
    },
    {
      category: 'Batches',
      metrics: [
        { label: 'Total Batches',  value: stats.batches.total,  icon: Users,       color: 'text-blue-600'  },
        { label: 'Active Batches', value: stats.batches.active, icon: CheckCircle, color: 'text-green-600' },
        { label: 'Free Batches',   value: stats.batches.free,   icon: Users,       color: 'text-purple-600'},
        { label: 'Paid Batches',   value: stats.batches.paid,   icon: Users,       color: 'text-green-600' },
      ],
    },
  ];

  const headerLabel =
    timeRange === 'all'
      ? 'All Time'
      : `${timeRange.charAt(0).toUpperCase()}${timeRange.slice(1)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-800">{headerLabel} MIS Report</h4>
        <span className="text-sm text-gray-600">
          Generated: {new Date().toLocaleString('en-IN')}
        </span>
      </div>

      {reportData.map((section, index) => (
        <div key={index} className="border-b pb-4 last:border-b-0">
          <h5 className="font-semibold text-gray-700 mb-3">{section.category}</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {section.metrics.map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                  <div>
                    <p className="text-xs text-gray-600">{metric.label}</p>
                    <p className="text-lg font-bold text-gray-800">{metric.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DailyMISReport;
