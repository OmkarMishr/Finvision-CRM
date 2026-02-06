import { useState } from 'react'
import { X, User, Phone, Mail, MapPin, Briefcase, GraduationCap, Calendar } from 'lucide-react'
import axiosInstance from '../../config/axios'
import { API_ENDPOINTS } from '../../config/api'

const AddLeadModal = ({ onClose, onLeadAdded }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    age: '',
    education: '',
    city: '',
    occupation: '',
    leadSource: 'Walk-in',
    courseCategory: 'Basic',
    batchSection: '',
    batchType: 'Free',
    stage: 'Enquiry',
    followUpDate: ''
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
      const token = localStorage.getItem('fv_token')
      
      // ✅ Prepare clean data - remove empty fields
      const cleanData = {}
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          cleanData[key] = formData[key]
        }
      })

      //  Convert age to number if provided
      if (cleanData.age) {
        cleanData.age = parseInt(cleanData.age)
      }

      console.log('Submitting lead data:', cleanData)

      const response = await axiosInstance.post(API_ENDPOINTS.leads.base,
        cleanData,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      console.log('Lead created:', response.data)
      onLeadAdded()
    } catch (err) {
      console.error('Error creating lead:', err)
      setError(err.response?.data?.message || 'Failed to create lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Add New Lead</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  placeholder="Enter full name"
                />
              </div>
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  placeholder="10 digit mobile number"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  placeholder="Email address"
                />
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="15"
                max="100"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                placeholder="Age"
              />
            </div>

            {/* Education */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Education
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  placeholder="Educational qualification"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  placeholder="City"
                />
              </div>
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Occupation
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  placeholder="Current occupation"
                />
              </div>
            </div>

            {/* Lead Source */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lead Source *
              </label>
              <select
                name="leadSource"
                value={formData.leadSource}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
              >
                <option value="Walk-in">Walk-in</option>
                <option value="Facebook">Facebook</option>
                <option value="Google">Google</option>
                <option value="Instagram">Instagram</option>
                <option value="Referral">Referral</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Course Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Course Category *
              </label>
              <select
                name="courseCategory"
                value={formData.courseCategory}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
              >
                <option value="Basic">Basic</option>
                <option value="Advanced">Advanced</option>
                <option value="Basic + Advanced">Basic + Advanced</option>
                <option value="Advisory">Advisory</option>
              </select>
            </div>

            {/* Batch Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Batch Type *
              </label>
              <select
                name="batchType"
                value={formData.batchType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
              >
                <option value="Free">Free Batch</option>
                <option value="Paid">Paid Batch</option>
              </select>
            </div>

            {/* Batch Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Batch Section (Time)
              </label>
              <input
                type="text"
                name="batchSection"
                value={formData.batchSection}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                placeholder="e.g., Morning 9-11 AM"
              />
            </div>

            {/* Stage */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lead Stage *
              </label>
              <select
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
              >
                <option value="Enquiry">Enquiry</option>
                <option value="Counselling">Counselling</option>
                <option value="Free Batch">Free Batch</option>
                <option value="Lead Conversion">Lead Conversion</option>
                <option value="Paid Batch">Paid Batch</option>
                <option value="Admission">Admission</option>
              </select>
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Follow-up Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  name="followUpDate"
                  value={formData.followUpDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </span>
              ) : (
                'Create Lead'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddLeadModal
