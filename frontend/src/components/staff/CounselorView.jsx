import { useState, useEffect } from 'react'
import { 
  Users, TrendingUp, CheckCircle, Clock, Search, 
  Eye, PhoneCall, MessageSquare, Calendar
} from 'lucide-react'
import axios from 'axios'
import LeadDetailsModal from './LeadDetailsModal'

const CounselorView = ({ onStatsUpdate }) => {
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStage, setFilterStage] = useState('Counselling')

  const [stats, setStats] = useState({
    totalInCounselling: 0,
    converted: 0,
    pending: 0,
    conversionRate: 0
  })

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    applyFilters()
    calculateStats()
  }, [searchQuery, filterStage, leads])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('fv_token')
      const response = await axios.get('http://localhost:5000/api/leads', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLeads(response.data.leads)
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...leads]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(lead =>
        lead.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.mobile.includes(searchQuery)
      )
    }

    // Stage filter
    if (filterStage) {
      filtered = filtered.filter(lead => lead.stage === filterStage)
    }

    setFilteredLeads(filtered)
  }

  const calculateStats = () => {
    const counsellingLeads = leads.filter(l => l.stage === 'Counselling')
    const convertedLeads = leads.filter(l => l.convertedToPaid)
    const totalProcessed = leads.filter(l => 
      ['Lead Conversion', 'Paid Batch', 'Admission'].includes(l.stage)
    )
    
    setStats({
      totalInCounselling: counsellingLeads.length,
      converted: convertedLeads.length,
      pending: counsellingLeads.length,
      conversionRate: totalProcessed.length > 0 
        ? Math.round((convertedLeads.length / totalProcessed.length) * 100) 
        : 0
    })
  }

  const handleViewDetails = (lead) => {
    setSelectedLead(lead)
    setShowDetailsModal(true)
  }

  const handleLeadUpdated = () => {
    fetchLeads()
    onStatsUpdate()
    setShowDetailsModal(false)
  }

  const statsCards = [
    { label: 'In Counselling', value: stats.totalInCounselling, color: 'bg-blue-500', icon: Users },
    { label: 'Converted', value: stats.converted, color: 'bg-green-500', icon: CheckCircle },
    { label: 'Pending', value: stats.pending, color: 'bg-orange-500', icon: Clock },
    { label: 'Conversion Rate', value: `${stats.conversionRate}%`, color: 'bg-purple-500', icon: TrendingUp }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div 
              key={index} 
              className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-gray-600 text-xs font-medium mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Counselling Queue */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Counselling Queue</h2>
          
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Stage Filter */}
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stages</option>
              <option value="Counselling">Counselling</option>
              <option value="Lead Conversion">Lead Conversion</option>
              <option value="Paid Batch">Paid Batch</option>
            </select>
          </div>
        </div>

        {/* Leads Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Mobile</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Stage</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Batch Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Course</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Follow-up</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{lead.fullName}</div>
                      <div className="text-xs text-gray-500">{lead.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{lead.mobile}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStageColor(lead.stage)}`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        lead.batchType === 'Paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {lead.batchType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{lead.courseCategory}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lead.followUpDate 
                        ? new Date(lead.followUpDate).toLocaleDateString() 
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(lead)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => window.open(`tel:${lead.mobile}`)}
                          className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="Call"
                        >
                          <PhoneCall className="w-4 h-4 text-green-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLeads.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No leads found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={() => setShowDetailsModal(false)}
          onLeadUpdated={handleLeadUpdated}
        />
      )}
    </div>
  )
}

const getStageColor = (stage) => {
  const colors = {
    'Enquiry': 'bg-gray-100 text-gray-700',
    'Counselling': 'bg-blue-100 text-blue-700',
    'Free Batch': 'bg-yellow-100 text-yellow-700',
    'Lead Conversion': 'bg-purple-100 text-purple-700',
    'Paid Batch': 'bg-green-100 text-green-700',
    'Admission': 'bg-indigo-100 text-indigo-700'
  }
  return colors[stage] || 'bg-gray-100 text-gray-700'
}

export default CounselorView
