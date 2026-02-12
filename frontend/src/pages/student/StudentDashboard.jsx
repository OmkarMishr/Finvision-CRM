import { useState, useEffect, useCallback } from 'react'
import { Calendar, FileText, CreditCard, BookOpen, Award, Bell, Menu, GraduationCap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/layout/Sidebar'
import axiosInstance from '../../config/axios'
import { API_ENDPOINTS } from '../../config/api'

//  Import modular components
import StudentOverview from '../../components/student/StudentOverview'
import StudentDetails from '../../components/student/StudentDetails'
import StudentAttendanceTab from '../../components/student/StudentAttendanceTab'
import StudentCertificate from '../../components/student/StudentCertificate'

const StudentDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [studentData, setStudentData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStudentData = useCallback(async () => {
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
          fatherName: student.fatherName || 'Not available',
          dob: student.dob || '2005-12-08',
          gender: student.gender || 'Not available',
          profilePhoto: student.profilePhoto || null
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
        education: 'Not provided',
        profilePhoto: null
      })
    } finally {
      setLoading(false)
    }
  }, [user?.email, user?.name])

  useEffect(() => {
    fetchStudentData()
  }, [fetchStudentData])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'details', label: 'View Details', icon: FileText },
    { id: 'fees', label: 'Fees', icon: CreditCard },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'certificate', label: 'Certificate', icon: Award },
    { id: 'books', label: 'Books Issued', icon: BookOpen }
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
              {/* Modular Components */}
              {activeTab === 'overview' && <StudentOverview studentData={studentData} />}
              {activeTab === 'details' && <StudentDetails studentData={studentData} onDataUpdate={setStudentData} />}
              {activeTab === 'attendance' && <StudentAttendanceTab studentData={studentData} onAttendanceMarked={fetchStudentData} />}
              {activeTab === 'certificate' && <StudentCertificate studentData={studentData} />}
              
              {/* Coming Soon for other tabs */}
              {activeTab !== 'overview' && 
               activeTab !== 'details' && 
               activeTab !== 'attendance' && 
               activeTab !== 'certificate' && (
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
