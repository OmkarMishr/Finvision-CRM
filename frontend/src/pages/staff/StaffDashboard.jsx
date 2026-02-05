import { useState } from 'react'
import { Search, Download, FileSpreadsheet, Calendar, Bell, Users, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const StaffDashboard = () => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    source: '',
    enquiryFor: '',
    fromDate: '',
    toDate: '',
    status: ''
  })

  // Mock data - Replace with API call
  const stats = [
    { label: 'Active', value: 3, color: 'bg-green-500', icon: CheckCircle },
    { label: 'Inactive', value: 0, color: 'bg-orange-500', icon: XCircle },
    { label: 'Total Admission', value: 86, color: 'bg-lime-500', icon: Users },
    { label: 'Rejected', value: 0, color: 'bg-red-500', icon: XCircle }
  ]

  const enquiries = [
    {
      srNo: 106,
      status: 'Done',
      source: 'Facebook',
      enquiryDate: '03-02-2026',
      followUpDate: '2026-02-05',
      studentName: 'Sakshi kalal',
      mobile: '6354099011',
      fromStaff: ''
    },
    {
      srNo: 107,
      status: 'Done',
      source: 'Google',
      enquiryDate: '04-02-2026',
      followUpDate: '2026-02-06',
      studentName: 'ANKITA',
      mobile: '9876543210',
      fromStaff: 'Staff Name'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
              <div>
                <p className="text-sm text-gray-500">Thursday 5 February</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.[0] || 'S'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Select Criteria</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Enquiry Source</label>
              <select
                value={filters.source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Source</option>
                <option value="facebook">Facebook</option>
                <option value="google">Google</option>
                <option value="referral">Referral</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Enquiry For</label>
              <input
                type="text"
                placeholder="Select"
                value={filters.enquiryFor}
                onChange={(e) => setFilters({ ...filters, enquiryFor: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Enquiry From Date</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Enquiry To Date</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Enquiry Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Status</option>
                <option value="done">Done</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors">
              Reset
            </button>
            <button className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors">
              Search
            </button>
          </div>
        </div>

        {/* Enquiries Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Admission Enquiries (106)</h2>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium transition-colors">
                  Add New+
                </button>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search Data..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors">
                  <FileSpreadsheet className="w-5 h-5" />
                </button>
                <button className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Table - Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SR NO.</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Enquiry Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Follow Up Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">From Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enquiries.map((enquiry, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{enquiry.srNo}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <span className="text-gray-600">✏️</span>
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <span className="text-gray-600">🗑️</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg">
                        {enquiry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{enquiry.source}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{enquiry.enquiryDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{enquiry.followUpDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{enquiry.studentName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{enquiry.mobile}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{enquiry.fromStaff || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards - Mobile */}
          <div className="lg:hidden divide-y divide-gray-200">
            {enquiries.map((enquiry, index) => (
              <div key={index} className="p-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{enquiry.studentName}</p>
                    <p className="text-xs text-gray-500">SR NO: {enquiry.srNo}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg">
                    {enquiry.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Mobile</p>
                    <p className="text-gray-900 font-medium">{enquiry.mobile}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Source</p>
                    <p className="text-gray-900 font-medium">{enquiry.source}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Enquiry Date</p>
                    <p className="text-gray-900 font-medium">{enquiry.enquiryDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Follow Up</p>
                    <p className="text-gray-900 font-medium">{enquiry.followUpDate}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors">
                    Edit
                  </button>
                  <button className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 text-sm rounded-lg font-medium transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard
