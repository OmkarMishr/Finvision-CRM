import { useState } from 'react'
import { X, User, Phone, Mail, DollarSign, Calendar, BookOpen } from 'lucide-react'
import axiosInstance from '../../config/axios'
import { API_ENDPOINTS } from '../../config/api'

const ConvertToStudentModal = ({ lead, onClose, onConverted }) => {
  const [formData, setFormData] = useState({
    totalFees: lead.batchType === 'Paid' ? '' : 0,
    batchSection: lead.batchSection || '',
    courseCategory: lead.courseCategory,
    batchType: lead.batchType
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const convertData = {
        ...formData,
        totalFees: formData.batchType === 'Paid' ? parseFloat(formData.totalFees) : 0
      }

      const response = await axiosInstance.post(
        API_ENDPOINTS.students.convertFromLead(lead._id),
        convertData
      )

      if (response.data.success) {
        onConverted(response.data.student)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to convert lead to student')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-2xl font-bold text-white">Convert to Student</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-3">Lead Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">{lead.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Mobile:</span>
                <span className="font-medium text-gray-900">{lead.mobile}</span>
              </div>
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{lead.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Course:</span>
                <span className="font-medium text-gray-900">{lead.courseCategory}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Batch Type
              </label>
              <select
                name="batchType"
                value={formData.batchType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all outline-none"
              >
                <option value="Free">Free Batch</option>
                <option value="Paid">Paid Batch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Course Category
              </label>
              <select
                name="courseCategory"
                value={formData.courseCategory}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all outline-none"
              >
                <option value="Basic">Basic</option>
                <option value="Advanced">Advanced</option>
                <option value="Basic + Advanced">Basic + Advanced</option>
                <option value="Advisory">Advisory</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Batch Section / Time
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="batchSection"
                  value={formData.batchSection}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all outline-none"
                  placeholder="e.g., Morning 9-11 AM"
                />
              </div>
            </div>

            {formData.batchType === 'Paid' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Course Fees
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="totalFees"
                    value={formData.totalFees}
                    onChange={handleChange}
                    required={formData.batchType === 'Paid'}
                    min="0"
                    step="100"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all outline-none"
                    placeholder="Enter total fees amount"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Converting...
                </span>
              ) : (
                'Convert to Student'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConvertToStudentModal
