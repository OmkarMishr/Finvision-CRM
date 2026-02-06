import { useState, useEffect } from 'react'
import { 
  Plus, Search, Filter, Download, Eye, Edit, Trash2,
  PhoneCall, MessageCircle, UserCheck, Calendar, ArrowRight
} from 'lucide-react'
import axios from 'axios'
import LeadPipeline from './LeadPipeline'
import AddLeadModal from './AddLeadModal'
import LeadDetailsModal from './LeadDetailsModal'

const TelecallerView = ({ onStatsUpdate }) => {
  const [view, setView] = useState('pipeline') // pipeline or table
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    stage: '',
    batchType: '',
    leadSource: ''
  })

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, filters, leads])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('fv_token')
      const response = await axios.get('http://localhost:5000/api/leads', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLeads(response.data.leads)
      setFilteredLeads(response.data.leads)
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
        lead.mobile.includes(searchQuery) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Stage filter
    if (filters.stage) {
      filtered = filtered.filter(lead => lead.stage === filters.stage)
    }

    // Batch type filter
    if (filters.batchType) {
      filtered = filtered.filter(lead => lead.batchType === filters.batchType)
    }

    // Lead source filter
    if (filters.leadSource) {
      filtered = filtered.filter(lead => lead.leadSource === filters.leadSource)
    }

    setFilteredLeads(filtered)
  }

  const handleLeadAdded = () => {
    fetchLeads()
    onStatsUpdate()
    setShowAddModal(false)
  }

  const handleLeadUpdated = () => {
    fetchLeads()
    onStatsUpdate()
    setShowDetailsModal(false)
  }

  const handleViewDetails = (lead) => {
    setSelectedLead(lead)
    setShowDetailsModal(true)
  }

  const exportToExcel = () => {
    // Simple CSV export
    const csv = [
      ['Name', 'Mobile', 'Email', 'Stage', 'Batch Type', 'Lead Source', 'City'],
      ...filteredLeads.map(lead => [
        lead.fullName,
        lead.mobile,
        lead.email || '',
        lead.stage,
        lead.batchType,
        lead.leadSource,
        lead.city || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Lead
            </button>

            <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setView('pipeline')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  view === 'pipeline'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pipeline
              </button>
              <button
                onClick={() => setView('table')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  view === 'table'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Table
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Export Button */}
            <button
              onClick={exportToExcel}
              className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
              title="Export to CSV"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <select
            value={filters.stage}
            onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Stages</option>
            <option value="Enquiry">Enquiry</option>
            <option value="Counselling">Counselling</option>
            <option value="Free Batch">Free Batch</option>
            <option value="Lead Conversion">Lead Conversion</option>
            <option value="Paid Batch">Paid Batch</option>
            <option value="Admission">Admission</option>
          </select>

          <select
            value={filters.batchType}
            onChange={(e) => setFilters({ ...filters, batchType: e.target.value })}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Batch Types</option>
            <option value="Free">Free Batch</option>
            <option value="Paid">Paid Batch</option>
          </select>

          <select
            value={filters.leadSource}
            onChange={(e) => setFilters({ ...filters, leadSource: e.target.value })}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sources</option>
            <option value="Facebook">Facebook</option>
            <option value="Google">Google</option>
            <option value="Instagram">Instagram</option>
            <option value="Referral">Referral</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leads...</p>
        </div>
      ) : view === 'pipeline' ? (
        <LeadPipeline 
          leads={filteredLeads} 
          onLeadClick={handleViewDetails}
          onLeadUpdated={handleLeadUpdated}
        />
      ) : (
        <LeadTable 
          leads={filteredLeads} 
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Modals */}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onLeadAdded={handleLeadAdded}
        />
      )}

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

// Lead Table Component
const LeadTable = ({ leads, onViewDetails }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Mobile</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Stage</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Batch Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Source</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{lead.fullName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{lead.mobile}</td>
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
                <td className="px-6 py-4 text-sm text-gray-600">{lead.leadSource}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onViewDetails(lead)}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4 text-blue-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leads.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No leads found</p>
        </div>
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

export default TelecallerView
