import { useState, useEffect } from 'react'
import { Calendar, Users, Clock, Download, Filter, Search, ChevronDown, UserCheck, Briefcase, TrendingUp, X, CheckCircle, XCircle} from 'lucide-react'
import axiosInstance from '../../config/axios'
import { API_ENDPOINTS } from '../../config/api'

const AttendancePanel = () => {
  const [activeTab, setActiveTab] = useState('students') // 'students' or 'staff'
  const [loading, setLoading] = useState(false)
  
  // Student filters
  const [studentFilters, setStudentFilters] = useState({
    startDate: '',
    endDate: '',
    batchType: '',
    course: '',
    branch: '',
    timeSlot: '',
    status: ''
  })
  
  // Staff filters
  const [staffFilters, setStaffFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  })
  
  const [studentAttendance, setStudentAttendance] = useState([])
  const [staffAttendance, setStaffAttendance] = useState([])
  const [studentStats, setStudentStats] = useState(null)
  const [staffStats, setStaffStats] = useState(null)
  
  const [batches, setBatches] = useState([])
  const [courses, setCourses] = useState([])
  const [branches, setBranches] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMetadata()
    fetchStudentAttendance()
    fetchStaffAttendance()
    fetchStudentStats()
    fetchStaffStats()
  }, [])

  // Fetch metadata for filters
  const fetchMetadata = async () => {
    try {
      // Fetch batches
      const batchRes = await axiosInstance.get(API_ENDPOINTS.batches.getAll)
      setBatches(batchRes.data.data || [])
      
      // Extract unique courses and branches from batches
      const uniqueCourses = [...new Set(batchRes.data.data?.map(b => b.course) || [])]
      const uniqueBranches = [...new Set(batchRes.data.data?.map(b => b.branch) || [])]
      
      setCourses(uniqueCourses)
      setBranches(uniqueBranches)
    } catch (error) {
      console.error('Error fetching metadata:', error)
    }
  }

  // Fetch student attendance
  const fetchStudentAttendance = async (filters = studentFilters) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.batchType) params.append('batchType', filters.batchType)
      if (filters.course) params.append('course', filters.course)
      if (filters.branch) params.append('branch', filters.branch)
      if (filters.timeSlot) params.append('timeSlot', filters.timeSlot)
      if (filters.status) params.append('status', filters.status)
      
      const response = await axiosInstance.get(`${API_ENDPOINTS.studentAttendance.getAll}?${params}`)
      setStudentAttendance(response.data.data || [])
    } catch (error) {
      console.error('Error fetching student attendance:', error)
      setStudentAttendance([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch staff attendance
  const fetchStaffAttendance = async (filters = staffFilters) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.status) params.append('status', filters.status)
      
      const response = await axiosInstance.get(`${API_ENDPOINTS.staffAttendance.getAll}?${params}`)
      setStaffAttendance(response.data.data || [])
    } catch (error) {
      console.error('Error fetching staff attendance:', error)
      setStaffAttendance([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch student stats
  const fetchStudentStats = async () => {
    try {
      const params = new URLSearchParams()
      if (studentFilters.startDate) params.append('startDate', studentFilters.startDate)
      if (studentFilters.endDate) params.append('endDate', studentFilters.endDate)
      if (studentFilters.batchType) params.append('batchType', studentFilters.batchType)
      
      const response = await axiosInstance.get(`${API_ENDPOINTS.studentAttendance.stats}?${params}`)
      setStudentStats(response.data.data || null)
    } catch (error) {
      console.error('Error fetching student stats:', error)
    }
  }

  // Fetch staff stats
  const fetchStaffStats = async () => {
    try {
      const params = new URLSearchParams()
      if (staffFilters.startDate) params.append('startDate', staffFilters.startDate)
      if (staffFilters.endDate) params.append('endDate', staffFilters.endDate)
      
      const response = await axiosInstance.get(`${API_ENDPOINTS.staffAttendance.stats}?${params}`)
      setStaffStats(response.data.data || null)
    } catch (error) {
      console.error('Error fetching staff stats:', error)
    }
  }

  // Handle student filter change
  const handleStudentFilterChange = (key, value) => {
    const newFilters = { ...studentFilters, [key]: value }
    setStudentFilters(newFilters)
  }

  // Handle staff filter change
  const handleStaffFilterChange = (key, value) => {
    const newFilters = { ...staffFilters, [key]: value }
    setStaffFilters(newFilters)
  }

  // Apply filters
  const applyStudentFilters = () => {
    fetchStudentAttendance(studentFilters)
    fetchStudentStats()
  }

  const applyStaffFilters = () => {
    fetchStaffAttendance(staffFilters)
    fetchStaffStats()
  }

  // Reset filters
  const resetStudentFilters = () => {
    const emptyFilters = {
      startDate: '',
      endDate: '',
      batchType: '',
      course: '',
      branch: '',
      timeSlot: '',
      status: ''
    }
    setStudentFilters(emptyFilters)
    fetchStudentAttendance(emptyFilters)
    fetchStudentStats()
  }

  const resetStaffFilters = () => {
    const emptyFilters = {
      startDate: '',
      endDate: '',
      status: ''
    }
    setStaffFilters(emptyFilters)
    fetchStaffAttendance(emptyFilters)
    fetchStaffStats()
  }

  // Export to CSV
  const exportToCSV = () => {
    const data = activeTab === 'students' ? studentAttendance : staffAttendance
    
    if (data.length === 0) {
      alert('No data to export')
      return
    }

    let csv = ''
    
    if (activeTab === 'students') {
      csv = 'Date,Student Name,Admission No,Batch Type,Course,Branch,Time Slot,Status,Remarks\n'
      data.forEach(record => {
        csv += `${new Date(record.date).toLocaleDateString()},${record.studentId?.fullName || 'N/A'},${record.studentId?.admissionNumber || 'N/A'},${record.batchType},${record.course},${record.branch},${record.timeSlot},${record.status},"${record.remarks}"\n`
      })
    } else {
      csv = 'Date,Staff Name,Email,Check-in,Check-out,Working Hours,Status,Branch,Remarks\n'
      data.forEach(record => {
        csv += `${new Date(record.date).toLocaleDateString()},${record.userId?.fullName || 'N/A'},${record.userId?.email || 'N/A'},${record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : 'N/A'},${record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : 'N/A'},${record.workingHours || 0}h,${record.status},${record.branch},"${record.remarks}"\n`
      })
    }

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}_attendance_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Filter data by search term
  const filteredStudentData = studentAttendance.filter(record => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      record.studentId?.fullName?.toLowerCase().includes(search) ||
      record.studentId?.admissionNumber?.toLowerCase().includes(search) ||
      record.course?.toLowerCase().includes(search) ||
      record.branch?.toLowerCase().includes(search)
    )
  })

  const filteredStaffData = staffAttendance.filter(record => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      record.userId?.fullName?.toLowerCase().includes(search) ||
      record.userId?.email?.toLowerCase().includes(search) ||
      record.branch?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Attendance Management</h1>
            <p className="text-indigo-100">View and manage student & staff attendance records</p>
          </div>
          <div className="hidden sm:block">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Calendar className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-white rounded-2xl shadow-lg p-2 inline-flex gap-2">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'students'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          Student Attendance
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          Staff Attendance
        </button>
      </div>

      {/* Statistics Cards */}
      {activeTab === 'students' && studentStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Records" value={studentStats.total} color="bg-blue-500" icon={Users} />
          <StatCard label="Present" value={studentStats.present} color="bg-green-500" icon={CheckCircle} />
          <StatCard label="Absent" value={studentStats.absent} color="bg-red-500" icon={XCircle} />
          <StatCard label="Late" value={studentStats.late} color="bg-orange-500" icon={Clock} />
          <StatCard label="Half Day" value={studentStats.halfDay} color="bg-yellow-500" icon={TrendingUp} />
        </div>
      )}

      {activeTab === 'staff' && staffStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Days" value={staffStats.totalDays} color="bg-blue-500" icon={Calendar} />
          <StatCard label="Present" value={staffStats.present} color="bg-green-500" icon={CheckCircle} />
          <StatCard label="Late" value={staffStats.late} color="bg-orange-500" icon={Clock} />
          <StatCard label="Half Days" value={staffStats.halfDay} color="bg-yellow-500" icon={TrendingUp} />
          <StatCard 
            label="Avg Hours" 
            value={staffStats.avgWorkingHours ? `${staffStats.avgWorkingHours}h` : '0h'} 
            color="bg-purple-500" 
            icon={Clock} 
          />
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Filters & Actions */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 w-full lg:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, admission no, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Student Filters */}
          {activeTab === 'students' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              <input
                type="date"
                value={studentFilters.startDate}
                onChange={(e) => handleStudentFilterChange('startDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={studentFilters.endDate}
                onChange={(e) => handleStudentFilterChange('endDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="End Date"
              />
              <select
                value={studentFilters.batchType}
                onChange={(e) => handleStudentFilterChange('batchType', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">All Batch Types</option>
                <option value="Free">Free</option>
                <option value="Paid">Paid</option>
              </select>
              <select
                value={studentFilters.course}
                onChange={(e) => handleStudentFilterChange('course', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
              <select
                value={studentFilters.branch}
                onChange={(e) => handleStudentFilterChange('branch', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
              <select
                value={studentFilters.timeSlot}
                onChange={(e) => handleStudentFilterChange('timeSlot', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">All Time Slots</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Self">Self</option>
              </select>
              <select
                value={studentFilters.status}
                onChange={(e) => handleStudentFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">All Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
              </select>
              <button
                onClick={applyStudentFilters}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
              >
                Apply
              </button>
              <button
                onClick={resetStudentFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm font-medium flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Reset
              </button>
            </div>
          )}

          {/* Staff Filters */}
          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input
                type="date"
                value={staffFilters.startDate}
                onChange={(e) => handleStaffFilterChange('startDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={staffFilters.endDate}
                onChange={(e) => handleStaffFilterChange('endDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="End Date"
              />
              <select
                value={staffFilters.status}
                onChange={(e) => handleStaffFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="">All Status</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
                <option value="Leave">Leave</option>
              </select>
              <button
                onClick={applyStaffFilters}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
              >
                Apply
              </button>
              <button
                onClick={resetStaffFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm font-medium flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'students' ? (
            <StudentAttendanceTable data={filteredStudentData} />
          ) : (
            <StaffAttendanceTable data={filteredStaffData} />
          )}
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
const StatCard = ({ label, value, color, icon: Icon }) => (
  <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all">
    <div className="flex items-center justify-between mb-3">
      <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <p className="text-gray-600 text-xs font-medium mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
)

// Student Attendance Table
const StudentAttendanceTable = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg">No attendance records found</p>
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Admission No</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Batch Type</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Course</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Branch</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time Slot</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((record, index) => (
          <tr key={index} className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {new Date(record.date).toLocaleDateString('en-IN')}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">{record.studentId?.fullName || 'N/A'}</div>
              <div className="text-xs text-gray-500">{record.studentId?.email || ''}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {record.studentId?.admissionNumber || 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                record.batchType === 'Paid' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {record.batchType}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.course}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.branch}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.timeSlot}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                record.status === 'Present' ? 'bg-green-100 text-green-700' :
                record.status === 'Absent' ? 'bg-red-100 text-red-700' :
                record.status === 'Late' ? 'bg-orange-100 text-orange-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {record.status}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {record.location?.branchName ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs">{record.location.branchName}</span>
                  <span className="text-xs text-gray-400">({record.location.distance}m)</span>
                </div>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Staff Attendance Table
const StaffAttendanceTable = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg">No attendance records found</p>
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Staff Member</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check-in</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check-out</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Working Hours</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Branch</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((record, index) => (
          <tr key={index} className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {new Date(record.date).toLocaleDateString('en-IN')}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">{record.userId?.fullName || 'N/A'}</div>
              <div className="text-xs text-gray-500">{record.userId?.email || ''}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
              }) : 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
              }) : '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
              {record.workingHours ? `${record.workingHours}h` : '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                record.status === 'Present' ? 'bg-green-100 text-green-700' :
                record.status === 'Late' ? 'bg-orange-100 text-orange-700' :
                record.status === 'Half Day' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {record.status}
              </span>
              {record.isLate && (
                <div className="text-xs text-orange-600 mt-1">
                  Late by {record.lateByMinutes}m
                </div>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.branch}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {record.checkInLocation?.branchName ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs">{record.checkInLocation.branchName}</span>
                  <span className="text-xs text-gray-400">({record.checkInLocation.distance}m)</span>
                </div>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default AttendancePanel
