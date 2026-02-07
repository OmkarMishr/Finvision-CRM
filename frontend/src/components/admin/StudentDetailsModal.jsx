import { useState } from 'react'
import { X, User, Phone, Mail, MapPin, Calendar, MessageSquare,Edit, Save, DollarSign, BookOpen, TrendingUp, Award} from 'lucide-react'
import axiosInstance from '../../config/axios'
import { API_ENDPOINTS } from '../../config/api'

const StudentDetailsModal = ({ student, onClose, onStudentUpdated }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: student.fullName,
    mobile: student.mobile,
    email: student.email || '',
    age: student.age || '',
    education: student.education || '',
    city: student.city || '',
    occupation: student.occupation || '',
    courseCategory: student.courseCategory,
    batchSection: student.batchSection || '',
    status: student.status
  })
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleUpdate = async () => {
    setLoading(true)
    try {
      await axiosInstance.put(
        API_ENDPOINTS.students.byId(student._id),
        formData
      )
      setIsEditing(false)
      onStudentUpdated()
    } catch (error) {
      console.error('Error updating student:', error)
      alert('Failed to update student')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      await axiosInstance.post(
        API_ENDPOINTS.students.addNote(student._id),
        { note: newNote }
      )
      setNewNote('')
      onStudentUpdated()
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Failed to add note')
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (window.confirm(`Change student status to ${newStatus}?`)) {
      try {
        await axiosInstance.put(
          API_ENDPOINTS.students.updateStatus(student._id),
          { status: newStatus }
        )
        onStudentUpdated()
      } catch (error) {
        console.error('Error updating status:', error)
        alert('Failed to update status')
      }
    }
  }

  const statuses = ['Active', 'Inactive', 'Completed', 'Dropped']

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{student.fullName}</h2>
            <p className="text-blue-100 text-sm mt-1">
              Admission No: {student.admissionNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && activeTab === 'details' && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Edit className="w-5 h-5 text-white" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'details'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'fees'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Fees
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'attendance'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'notes'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Notes
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'details' && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Current Status
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {statuses.map((status) => {
                    const isActive = status === student.status
                    
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={loading}
                        className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{student.fullName}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{student.mobile}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{student.email || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{student.city || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course Category
                  </label>
                  {isEditing ? (
                    <select
                      name="courseCategory"
                      value={formData.courseCategory}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Basic + Advanced">Basic + Advanced</option>
                      <option value="Advisory">Advisory</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                        {student.courseCategory}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Batch Type
                  </label>
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    student.batchType === 'Paid' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {student.batchType}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Batch Section
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="batchSection"
                      value={formData.batchSection}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{student.batchSection || 'Not assigned'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Admission Date
                  </label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(student.admissionDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'fees' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-100">Total Fees</span>
                    <DollarSign className="w-8 h-8 text-blue-200" />
                  </div>
                  <p className="text-3xl font-bold">₹{student.totalFees.toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-100">Paid</span>
                    <DollarSign className="w-8 h-8 text-green-200" />
                  </div>
                  <p className="text-3xl font-bold">₹{student.paidFees.toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-100">Pending</span>
                    <DollarSign className="w-8 h-8 text-red-200" />
                  </div>
                  <p className="text-3xl font-bold">₹{student.pendingFees.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Payment Progress</h3>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all"
                    style={{ 
                      width: `${student.totalFees > 0 ? (student.paidFees / student.totalFees) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  {student.totalFees > 0 
                    ? `${Math.round((student.paidFees / student.totalFees) * 100)}% Paid`
                    : 'No fees structure assigned'
                  }
                </p>
              </div>

              {student.lastPaymentDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600">Last Payment Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(student.lastPaymentDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-100">Total Classes</span>
                    <BookOpen className="w-8 h-8 text-purple-200" />
                  </div>
                  <p className="text-3xl font-bold">{student.totalClasses}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-100">Attended</span>
                    <Award className="w-8 h-8 text-green-200" />
                  </div>
                  <p className="text-3xl font-bold">{student.attendedClasses}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-100">Percentage</span>
                    <TrendingUp className="w-8 h-8 text-blue-200" />
                  </div>
                  <p className="text-3xl font-bold">{student.attendancePercentage}%</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Attendance Progress</h3>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className={`h-4 rounded-full transition-all ${
                      student.attendancePercentage >= 75 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      student.attendancePercentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                      'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                    style={{ width: `${student.attendancePercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  {student.attendancePercentage >= 75 
                    ? 'Excellent Attendance!' 
                    : student.attendancePercentage >= 50 
                    ? 'Good Attendance' 
                    : 'Need Improvement'
                  }
                </p>
              </div>

              <div className={`border-l-4 rounded-lg p-4 ${
                student.attendancePercentage >= 75 
                  ? 'bg-green-50 border-green-500' 
                  : student.attendancePercentage >= 50 
                  ? 'bg-yellow-50 border-yellow-500' 
                  : 'bg-red-50 border-red-500'
              }`}>
                <p className="font-semibold text-gray-900 mb-1">
                  {student.attendancePercentage >= 75 
                    ? 'Eligible for Certificate' 
                    : 'Certificate Eligibility: 75% Required'
                  }
                </p>
                <p className="text-sm text-gray-600">
                  {student.attendancePercentage >= 75 
                    ? 'This student has met the minimum attendance requirement for certification.' 
                    : `Need ${Math.ceil(75 - student.attendancePercentage)}% more attendance to be eligible.`
                  }
                </p>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Add a note..."
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {student.notes && student.notes.length > 0 ? (
                  student.notes.map((note, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <p className="text-gray-900 mb-2">{note.note}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(note.addedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No notes yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentDetailsModal
