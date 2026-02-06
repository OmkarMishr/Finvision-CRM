import { useState } from 'react'
import { 
  X, User, Phone, Mail, MapPin, Calendar, MessageSquare, 
  Edit, Save, ArrowRight, UserCheck, DollarSign
} from 'lucide-react'
import axios from 'axios'

const LeadDetailsModal = ({ lead, onClose, onLeadUpdated }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: lead.fullName,
    mobile: lead.mobile,
    email: lead.email || '',
    age: lead.age || '',
    education: lead.education || '',
    city: lead.city || '',
    occupation: lead.occupation || '',
    leadSource: lead.leadSource,
    courseCategory: lead.courseCategory,
    batchSection: lead.batchSection || '',
    batchType: lead.batchType,
    stage: lead.stage,
    followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : ''
  })
  const [newRemark, setNewRemark] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('fv_token')
      await axios.put(
        `http://localhost:5000/api/leads/${lead._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setIsEditing(false)
      onLeadUpdated()
    } catch (error) {
      console.error('Error updating lead:', error)
      alert('Failed to update lead')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return

    try {
      const token = localStorage.getItem('fv_token')
      await axios.post(
        `http://localhost:5000/api/leads/${lead._id}/remarks`,
        { note: newRemark },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setNewRemark('')
      onLeadUpdated()
    } catch (error) {
      console.error('Error adding remark:', error)
      alert('Failed to add remark')
    }
  }

  const handleStageChange = async (newStage) => {
    if (window.confirm(`Move this lead to ${newStage}?`)) {
      try {
        const token = localStorage.getItem('fv_token')
        await axios.put(
          `http://localhost:5000/api/leads/${lead._id}/stage`,
          { stage: newStage },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        onLeadUpdated()
      } catch (error) {
        console.error('Error updating stage:', error)
        alert('Failed to update stage')
      }
    }
  }

  const stages = ['Enquiry', 'Counselling', 'Free Batch', 'Lead Conversion', 'Paid Batch', 'Admission']

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{lead.fullName}</h2>
            <p className="text-blue-100 text-sm mt-1">Lead ID: {lead._id.slice(-8)}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Current Stage & Quick Actions */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Current Stage
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {stages.map((stage, index) => {
                const isActive = stage === lead.stage
                const isPassed = stages.indexOf(lead.stage) > index
                
                return (
                  <div key={stage} className="flex items-center">
                    <button
                      onClick={() => handleStageChange(stage)}
                      disabled={loading}
                      className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                          : isPassed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {stage}
                    </button>
                    {index < stages.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-gray-400 mx-1" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Lead Information */}
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
                  <span>{lead.fullName}</span>
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
                  <span>{lead.mobile}</span>
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
                  <span>{lead.email || 'Not provided'}</span>
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
                  <span>{lead.city || 'Not provided'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lead Source
              </label>
              {isEditing ? (
                <select
                  name="leadSource"
                  value={formData.leadSource}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                >
                  <option value="Walk-in">Walk-in</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Google">Google</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Referral">Referral</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                  {lead.leadSource}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Batch Type
              </label>
              {isEditing ? (
                <select
                  name="batchType"
                  value={formData.batchType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                >
                  <option value="Free">Free Batch</option>
                  <option value="Paid">Paid Batch</option>
                </select>
              ) : (
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  lead.batchType === 'Paid' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {lead.batchType}
                </span>
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
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                  {lead.courseCategory}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Follow-up Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  name="followUpDate"
                  value={formData.followUpDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>
                    {lead.followUpDate 
                      ? new Date(lead.followUpDate).toLocaleDateString() 
                      : 'Not set'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Edit Buttons */}
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

          {/* Remarks Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Remarks & Notes
            </h3>

            {/* Add Remark */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRemark()}
                  placeholder="Add a remark..."
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                />
                <button
                  onClick={handleAddRemark}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Remarks List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {lead.remarks && lead.remarks.length > 0 ? (
                lead.remarks.map((remark, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-gray-900 mb-2">{remark.note}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(remark.addedAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No remarks yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeadDetailsModal
