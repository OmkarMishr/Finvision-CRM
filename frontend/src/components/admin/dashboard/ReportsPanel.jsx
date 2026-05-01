import React from 'react';
import { CheckCircle, XCircle, TrendingUp, Users, Download, RefreshCw } from 'lucide-react';
import ExportButton from '../../common/ExportButton';

const DEFAULT_STATS = {
  leads:      { total: 0, enquiry: 0, counselling: 0, freeBatch: 0, paidBatch: 0, converted: 0, conversionRate: 0 },
  students:   { total: 0, active: 0, inactive: 0, free: 0, paid: 0 },
  revenue:    { total: 0, collected: 0, pending: 0 },
  attendance: { today: 0, present: 0, absent: 0, percentage: 0 },
  batches:    { total: 0, active: 0, free: 0, paid: 0 }
};

const ReportsPanel = ({
  stats      = DEFAULT_STATS, 
  timeRange  = 'daily',      
  setTimeRange,       
  onRefresh                 
}) => {

  const buildExportRows = () => ({
    headers: ['Section', 'Metric', 'Value'],
    rows: [
      ['Meta',       'Report Date',      new Date().toLocaleString('en-IN')],
      ['Meta',       'Time Range',       String(timeRange).toUpperCase()],
      ['Leads',      'Total',            stats.leads.total],
      ['Leads',      'Enquiry',          stats.leads.enquiry],
      ['Leads',      'Counselling',      stats.leads.counselling],
      ['Leads',      'Free Batch',       stats.leads.freeBatch],
      ['Leads',      'Paid Batch',       stats.leads.paidBatch],
      ['Leads',      'Converted',        stats.leads.converted],
      ['Leads',      'Conversion Rate',  `${stats.leads.conversionRate}%`],
      ['Students',   'Total',            stats.students.total],
      ['Students',   'Active',           stats.students.active],
      ['Students',   'Inactive',         stats.students.inactive],
      ['Revenue',    'Total',            `₹${stats.revenue.total.toLocaleString('en-IN')}`],
      ['Revenue',    'Collected',        `₹${stats.revenue.collected.toLocaleString('en-IN')}`],
      ['Revenue',    'Pending',          `₹${stats.revenue.pending.toLocaleString('en-IN')}`],
      ['Attendance', 'Present',          stats.attendance.present],
      ['Attendance', 'Absent',           stats.attendance.absent],
      ['Attendance', 'Percentage',       `${stats.attendance.percentage}%`],
      ['Batches',    'Total',            stats.batches.total],
      ['Batches',    'Active',           stats.batches.active],
    ],
  });

  const reportData = [
    {
      category: 'Lead Management',
      metrics: [
        { label: 'Total Leads',       value: stats.leads.total,                icon: Users,       color: 'text-[#C8294A]'  },
        { label: 'Enquiry Stage',     value: stats.leads.enquiry,              icon: CheckCircle, color: 'text-gray-600'   },
        { label: 'Counselling Stage', value: stats.leads.counselling,          icon: CheckCircle, color: 'text-[#C8294A]'  },
        { label: 'Free Batch',        value: stats.leads.freeBatch,            icon: CheckCircle, color: 'text-[#1a1a1a]'  },
        { label: 'Paid Batch',        value: stats.leads.paidBatch,            icon: CheckCircle, color: 'text-green-600'  },
        { label: 'Converted',         value: stats.leads.converted,            icon: CheckCircle, color: 'text-green-600'  },
        { label: 'Conversion Rate',   value: `${stats.leads.conversionRate}%`, icon: TrendingUp,  color: 'text-yellow-600' }
      ]
    },
    {
      category: 'Student Management',
      metrics: [
        { label: 'Total Students',      value: stats.students.total,    icon: Users,       color: 'text-[#1a1a1a]' },
        { label: 'Active Students',     value: stats.students.active,   icon: CheckCircle, color: 'text-green-600' },
        { label: 'Inactive Students',   value: stats.students.inactive, icon: XCircle,     color: 'text-red-600'   },
        { label: 'Free Batch Students', value: stats.students.free,     icon: Users,       color: 'text-[#1a1a1a]' },
        { label: 'Paid Batch Students', value: stats.students.paid,     icon: Users,       color: 'text-green-600' }
      ]
    },
    {
      category: 'Revenue',
      metrics: [
        { label: 'Total Revenue', value: `₹${stats.revenue.total.toLocaleString()}`,     icon: TrendingUp,  color: 'text-green-600' },
        { label: 'Collected',     value: `₹${stats.revenue.collected.toLocaleString()}`, icon: CheckCircle, color: 'text-green-600' },
        { label: 'Pending',       value: `₹${stats.revenue.pending.toLocaleString()}`,   icon: XCircle,     color: 'text-red-600'   }
      ]
    },
    {
      category: 'Attendance (Today)',
      metrics: [
        { label: 'Total Classes', value: stats.attendance.today,              icon: Users,       color: 'text-[#C8294A]'  },
        { label: 'Present',       value: stats.attendance.present,            icon: CheckCircle, color: 'text-green-600'  },
        { label: 'Absent',        value: stats.attendance.absent,             icon: XCircle,     color: 'text-red-600'    },
        { label: 'Attendance %',  value: `${stats.attendance.percentage}%`,   icon: TrendingUp,  color: 'text-orange-600' }
      ]
    },
    {
      category: 'Batches',
      metrics: [
        { label: 'Total Batches',  value: stats.batches.total,  icon: Users,       color: 'text-[#C8294A]' },
        { label: 'Active Batches', value: stats.batches.active, icon: CheckCircle, color: 'text-green-600' },
        { label: 'Free Batches',   value: stats.batches.free,   icon: Users,       color: 'text-[#1a1a1a]' },
        { label: 'Paid Batches',   value: stats.batches.paid,   icon: Users,       color: 'text-green-600' }
      ]
    }
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">MIS Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generated: {new Date().toLocaleString()}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {setTimeRange && (
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#C8294A] bg-white text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          )}
          {onRefresh && (
            <button onClick={onRefresh}
              className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2d2d2d] flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          )}
          <ExportButton
            filename={`MIS_${timeRange}`}
            title={`MIS Report — ${String(timeRange).toUpperCase()}`}
            getRows={buildExportRows}
          />
        </div>
      </div>

      {/* Report Sections */}
      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        <h4 className="text-lg font-semibold text-[#1a1a1a]">
          {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} MIS Report
        </h4>

        {reportData.map((section, index) => (
          <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
            <h5 className="font-semibold text-[#1a1a1a] mb-3">{section.category}</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {section.metrics.map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Icon className={`w-5 h-5 shrink-0 ${metric.color}`} />
                    <div>
                      <p className="text-xs text-gray-500">{metric.label}</p>
                      <p className="text-lg font-bold text-[#1a1a1a]">{metric.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPanel;
