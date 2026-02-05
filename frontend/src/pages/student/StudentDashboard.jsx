import { useState } from 'react'
import { Calendar, FileText, CreditCard, BookOpen, Award, Bell, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/layout/Sidebar'

const StudentDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('details')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Mock student data - Replace with API call
  const studentData = {
    name: user?.name || 'Student Name',
    admissionNo: '12345',
    rollNo: '3',
    fatherName: 'Father Name',
    class: '8th',
    section: '8th combine',
    dob: '2025-12-08',
    gender: 'Female',
    religion: 'Hindu',
    category: 'ITI',
    mobile: '9876543210',
    email: user?.email || 'student@example.com'
  }

  const tabs = [
    { id: 'details', label: 'View Details', icon: FileText },
    { id: 'fees', label: 'Fees', icon: CreditCard },
    { id: 'idcard', label: 'Id Card', icon: Award },
    { id: 'certificate', label: 'Certificate', icon: Award },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'books', label: 'Books Issued', icon: BookOpen }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>

              <img src="/assets/images/finvision-logo.png" alt="Logo" className="h-10 w-10 object-contain" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Student Portal</h2>
                <p className="text-xs text-gray-500">Thursday 5 February 2026</p>
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
                  {user?.name?.[0] || 'S'}
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
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 sm:p-8 mb-8 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">👋</span>
                <h1 className="text-2xl sm:text-3xl font-bold">Welcome, {studentData.name}!</h1>
              </div>
              <p className="text-indigo-100 text-sm sm:text-base">
                Opportunities are like sunrises. If you wait too long, you miss them.
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="w-16 h-16 text-white/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Student Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Profile Header with Photo */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              {/* Student Photo */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                  {studentData.name[0]}
                </div>
              </div>

              {/* Student Info */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Name</p>
                  <p className="text-sm font-semibold text-gray-900">{studentData.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Admission No.</p>
                  <p className="text-sm font-semibold text-gray-900">{studentData.admissionNo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Roll No.</p>
                  <p className="text-sm font-semibold text-gray-900">{studentData.rollNo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Father Name</p>
                  <p className="text-sm font-semibold text-gray-900">{studentData.fatherName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Class</p>
                  <p className="text-sm font-semibold text-gray-900">{studentData.class}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Section</p>
                  <p className="text-sm font-semibold text-gray-900">{studentData.section}</p>
                </div>
              </div>

              {/* Print Button */}
              <button className="self-start px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200">
                Print Form
              </button>
            </div>
          </div>

          {/* Tabs */}
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

          {/* Tab Content */}
          <div className="p-6 sm:p-8">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
                    <input
                      type="text"
                      value={studentData.name}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Admission No.</label>
                    <input
                      type="text"
                      value={studentData.admissionNo}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Roll No.</label>
                    <input
                      type="text"
                      value={studentData.rollNo}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Class</label>
                    <input
                      type="text"
                      value={studentData.class}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Section</label>
                    <input
                      type="text"
                      value={studentData.section}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">D.O.B</label>
                    <input
                      type="text"
                      value={studentData.dob}
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
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Religion</label>
                    <input
                      type="text"
                      value={studentData.religion}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
                    <input
                      type="text"
                      value={studentData.category}
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
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                    <input
                      type="email"
                      value={studentData.email}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'details' && (
              <ComingSoonPlaceholder activeTab={activeTab} tabs={tabs} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Coming Soon Placeholder Component
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
