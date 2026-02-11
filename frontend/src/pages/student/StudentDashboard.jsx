import { useState, useEffect } from 'react'
import { Calendar, FileText, CreditCard, BookOpen, Award, Bell, Menu,TrendingUp, DollarSign, Clock, Users, GraduationCap, CheckCircle, AlertCircle, MapPin} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/layout/Sidebar'
import axiosInstance from '../../config/axios'
import { API_ENDPOINTS } from '../../config/api'
import StudentAttendanceView from '../../components/student/StudentAttendanceView'


const StudentDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [studentData, setStudentData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Attendance marking state
  const [markingAttendance, setMarkingAttendance] = useState(false)
  const [markMessage, setMarkMessage] = useState(null)
  const [markError, setMarkError] = useState(null)
  const [locationInfo, setLocationInfo] = useState(null)


  useEffect(() => {
    fetchStudentData()
  }, [])


  const fetchStudentData = async () => {
    try {
      setLoading(true)
      
      const response = await axiosInstance.get(API_ENDPOINTS.students.myProfile)
      
      if (response.data.success) {
        const student = response.data.student
        
        setStudentData({
          _id: student._id,
          admissionNumber: student.admissionNumber,
          fullName: student.fullName,
          email: student.email || user?.email,
          mobile: student.mobile,
          courseCategory: student.courseCategory,
          batchType: student.batchType,
          batchSection: student.batchSection || 'Not assigned',
          status: student.status,
          totalFees: student.totalFees,
          paidFees: student.paidFees,
          pendingFees: student.pendingFees,
          totalClasses: student.totalClasses,
          attendedClasses: student.attendedClasses,
          attendancePercentage: student.attendancePercentage,
          admissionDate: student.admissionDate,
          city: student.city || 'Not provided',
          education: student.education || 'Not provided',
          age: student.age || 'Not provided',
          occupation: student.occupation || 'Not provided',
          nextClass: 'Tomorrow 9:00 AM',
          upcomingExam: 'Phase-1 Exam - 15 Feb 2026',
          fatherName: 'Not available',
          dob: '2005-12-08',
          gender: 'Not available'
        })
      }
    } catch (error) {
      console.error('Error fetching student data:', error)
      
      if (error.response?.status === 404) {
        alert('Student profile not found. Please contact administration to link your account.')
      }
      
      setStudentData({
        _id: null,
        admissionNumber: 'Not Assigned',
        fullName: user?.name || 'Student Name',
        email: user?.email || 'student@example.com',
        mobile: 'Not provided',
        courseCategory: 'Not assigned',
        batchType: 'Not assigned',
        batchSection: 'Not assigned',
        status: 'Pending',
        totalFees: 0,
        paidFees: 0,
        pendingFees: 0,
        totalClasses: 0,
        attendedClasses: 0,
        attendancePercentage: 0,
        nextClass: 'Not scheduled',
        upcomingExam: 'No exams scheduled',
        admissionDate: new Date().toISOString(),
        fatherName: 'Not available',
        dob: 'Not available',
        gender: 'Not available',
        city: 'Not provided',
        education: 'Not provided'
      })
    } finally {
      setLoading(false)
    }
  }


  // Mark self attendance with GEOLOCATION
  const markSelfAttendance = async () => {
    try {
      setMarkingAttendance(true)
      setMarkMessage(null)
      setMarkError(null)
      setLocationInfo(null)

      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setMarkError('Geolocation is not supported by your browser')
        setMarkingAttendance(false)
        return
      }

      // Get user's current location
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            // Send location to backend
            const response = await axiosInstance.post('/api/student-attendance/mark-self', {
              latitude,
              longitude
            })

            setMarkMessage(response.data.message || 'Attendance marked successfully!')
            
            // Show location info
            if (response.data.locationInfo) {
              setLocationInfo(response.data.locationInfo)
            }
            fetchStudentData()
          } catch (error) {
            if (error.response?.status === 400) {
              setMarkError(error.response.data.message || 'Attendance already marked for today')
            } else if (error.response?.status === 403) {
              setMarkError(error.response.data.message || 'You must be at the institute to mark attendance')
            } else if (error.response?.status === 404) {
              setMarkError('Student profile not found. Please contact administration.')
            } else {
              setMarkError('Failed to mark attendance. Please try again.')
            }
          } finally {
            setMarkingAttendance(false)
          }
        },
        (error) => {
          // Handle geolocation errors
          setMarkingAttendance(false)
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setMarkError('Location permission denied. Please enable location access in your browser settings.')
              break
            case error.POSITION_UNAVAILABLE:
              setMarkError('Location information is unavailable. Please check your GPS/WiFi and try again.')
              break
            case error.TIMEOUT:
              setMarkError('Location request timed out. Please try again.')
              break
            default:
              setMarkError('Unable to get your location. Please try again.')
          }
        },
        {
          enableHighAccuracy: true, // Use GPS if available
          timeout: 10000,           // 10 seconds timeout
          maximumAge: 0             // Don't use cached position
        }
      )
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      setMarkError('An unexpected error occurred. Please try again.')
      setMarkingAttendance(false)
    }
  }


  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'details', label: 'View Details', icon: FileText },
    { id: 'fees', label: 'Fees', icon: CreditCard },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'books', label: 'Books Issued', icon: BookOpen },
    { id: 'certificate', label: 'Certificate', icon: Award }
  ]


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }


  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ml-0 lg:ml-72">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                >
                  <Menu className="w-6 h-6 text-gray-700" />
                </button>

                <img src="/assets/images/finvision-logo.png" alt="Logo" className="h-10 w-10 object-contain" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Student Portal</h2>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.firstName?.[0] || user?.name?.[0] || 'S'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'Student'}</p>
                    <p className="text-xs text-gray-500">Student</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 sm:p-8 mb-8 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">👋</span>
                  <h1 className="text-2xl sm:text-3xl font-bold">Welcome, {studentData.fullName}!</h1>
                </div>
                <p className="text-indigo-100 text-sm sm:text-base mb-3">
                  Opportunities are like sunrises. If you wait too long, you miss them.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    <span>Admission No: {studentData.admissionNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{studentData.courseCategory}</span>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <GraduationCap className="w-16 h-16 text-white/80" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="border-b border-gray-200 overflow-x-auto">
              <div className="flex gap-2 px-4 sm:px-6 min-w-max">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-indigo-600 text-indigo-600 font-medium'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-blue-100">Attendance</span>
                        <TrendingUp className="w-8 h-8 text-blue-200" />
                      </div>
                      <p className="text-4xl font-bold mb-2">{studentData.attendancePercentage}%</p>
                      <p className="text-sm text-blue-100">
                        {studentData.attendedClasses}/{studentData.totalClasses} Classes
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-green-100">Fees Paid</span>
                        <DollarSign className="w-8 h-8 text-green-200" />
                      </div>
                      <p className="text-4xl font-bold mb-2">₹{studentData.paidFees.toLocaleString()}</p>
                      <p className="text-sm text-green-100">
                        of ₹{studentData.totalFees.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-purple-100">Batch Type</span>
                        <BookOpen className="w-8 h-8 text-purple-200" />
                      </div>
                      <p className="text-2xl font-bold mb-2">{studentData.batchType}</p>
                      <p className="text-sm text-purple-100">{studentData.batchSection}</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-orange-100">Status</span>
                        <Award className="w-8 h-8 text-orange-200" />
                      </div>
                      <p className="text-2xl font-bold mb-2">{studentData.status}</p>
                      <p className="text-sm text-orange-100">Currently Active</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                        Fee Status
                      </h2>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Fees</span>
                          <span className="font-semibold text-gray-900">
                            ₹{studentData.totalFees.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Paid</span>
                          <span className="font-semibold text-green-600">
                            ₹{studentData.paidFees.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Pending</span>
                          <span className="font-semibold text-red-600">
                            ₹{studentData.pendingFees.toLocaleString()}
                          </span>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full"
                              style={{ 
                                width: `${(studentData.paidFees / studentData.totalFees) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 text-center">
                            {Math.round((studentData.paidFees / studentData.totalFees) * 100)}% Paid
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Award className="w-6 h-6 text-purple-600" />
                        Attendance Report
                      </h2>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Classes</span>
                          <span className="font-semibold text-gray-900">
                            {studentData.totalClasses}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Attended</span>
                          <span className="font-semibold text-green-600">
                            {studentData.attendedClasses}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Missed</span>
                          <span className="font-semibold text-red-600">
                            {studentData.totalClasses - studentData.attendedClasses}
                          </span>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div 
                              className={`h-3 rounded-full ${
                                studentData.attendancePercentage >= 75 
                                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                                  : 'bg-gradient-to-r from-red-500 to-red-600'
                              }`}
                              style={{ width: `${studentData.attendancePercentage}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 text-center">
                            {studentData.attendancePercentage >= 75 
                              ? 'Eligible for Certificate' 
                              : 'Need 75% for Certificate'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Bell className="w-6 h-6 text-orange-600" />
                      Upcoming Events
                    </h2>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <Clock className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Next Class</p>
                          <p className="text-sm text-gray-600">{studentData.nextClass}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                        <BookOpen className="w-8 h-8 text-purple-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Upcoming Exam</p>
                          <p className="text-sm text-gray-600">{studentData.upcomingExam}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 sm:p-8 rounded-xl mb-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                          {studentData.fullName[0]}
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Admission No.</p>
                          <p className="text-sm font-semibold text-gray-900">{studentData.admissionNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Course</p>
                          <p className="text-sm font-semibold text-gray-900">{studentData.courseCategory}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Batch Type</p>
                          <p className="text-sm font-semibold text-gray-900">{studentData.batchType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Batch Section</p>
                          <p className="text-sm font-semibold text-gray-900">{studentData.batchSection}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Admission Date</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(studentData.admissionDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                            {studentData.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                      <input
                        type="text"
                        value={studentData.fullName}
                        disabled
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mobile</label>
                      <input
                        type="text"
                        value={studentData.mobile}
                        disabled
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                      <input
                        type="email"
                        value={studentData.email}
                        disabled
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">D.O.B</label>
                      <input
                        type="text"
                        value={new Date(studentData.dob).toLocaleDateString()}
                        disabled
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gender</label>
                      <input
                        type="text"
                        value={studentData.gender}
                        disabled
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">City</label>
                      <input
                        type="text"
                        value={studentData.city}
                        disabled
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Education</label>
                      <input
                        type="text"
                        value={studentData.education}
                        disabled
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Father Name</label>
                      <input
                        type="text"
                        value={studentData.fatherName}
                        disabled
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/*  ATTENDANCE TAB WITH GEOLOCATION-BASED SELF-MARK */}
              {activeTab === 'attendance' && (
                <div className="space-y-6">
                  {/* Mark Self Attendance Card with Geolocation */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Mark Today's Attendance</h3>
                          <p className="text-sm text-gray-600">
                            {new Date().toLocaleDateString('en-IN', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Success Message */}
                    {markMessage && (
                      <div className="mb-4 flex items-start gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl text-sm">
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{markMessage}</p>
                          {locationInfo && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Marked at {locationInfo.branch} ({locationInfo.distance}m away)
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {markError && (
                      <div className="mb-4 flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{markError}</p>
                          {markError.includes('permission denied') && (
                            <p className="text-xs text-red-600 mt-1">
                              Tip: Go to browser settings → Site settings → Location → Allow
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={markSelfAttendance}
                      disabled={markingAttendance || !studentData._id}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all shadow-lg ${
                        markingAttendance || !studentData._id
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transform hover:-translate-y-0.5'
                      }`}
                    >
                      {markingAttendance ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Getting Location...</span>
                        </>
                      ) : !studentData._id ? (
                        <>
                          <AlertCircle className="w-5 h-5" />
                          <span>Profile Not Linked</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-5 h-5" />
                          <span>Mark My Attendance (With Location)</span>
                        </>
                      )}
                    </button>

                    {!studentData._id && (
                      <p className="text-xs text-gray-500 text-center mt-3">
                        Contact administration to link your student profile
                      </p>
                    )}
                  </div>

                  {/* Attendance History */}
                  {studentData._id ? (
                    <StudentAttendanceView studentId={studentData._id} />
                  ) : (
                    <div className="text-center py-12 bg-white rounded-2xl shadow border border-gray-200">
                      <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Calendar className="w-10 h-10 text-yellow-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Linked</h3>
                      <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Your account is not linked to a student profile yet. Please contact the administration to link your account and view attendance history.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Other tabs - Coming Soon */}
              {activeTab !== 'overview' && 
               activeTab !== 'details' && 
               activeTab !== 'attendance' && (
                <ComingSoonPlaceholder activeTab={activeTab} tabs={tabs} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const ComingSoonPlaceholder = ({ activeTab, tabs }) => {
  const currentTab = tabs.find(t => t.id === activeTab)
  const Icon = currentTab?.icon

  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
        {Icon && <Icon className="w-10 h-10 text-gray-400" />}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
      <p className="text-gray-500 text-sm max-w-md mx-auto">
        The {currentTab?.label} feature is currently under development and will be available soon.
      </p>
    </div>
  )
}

export default StudentDashboard
