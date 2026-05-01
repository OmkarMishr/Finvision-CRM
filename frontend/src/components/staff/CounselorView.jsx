import { useState, useEffect } from 'react'
import {
  Users, TrendingUp, CheckCircle, Clock, Search,
  Eye, PhoneCall, MessageSquare
} from 'lucide-react'
import axiosInstance from '../../config/axios'
import { API_ENDPOINTS } from '../../config/api'
import LeadDetailsModal from './LeadDetailsModal'
import BulkWhatsAppModal from '../common/BulkWhatsAppModal'

const CounselorView = ({ onStatsUpdate }) => {
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStage, setFilterStage] = useState('Counselling')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)

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

  // ✅ Mirrors TelecallerView's working fetch pattern exactly
  const fetchLeads = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('fv_token')
      const response = await axiosInstance.get(API_ENDPOINTS.leads.base, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // ✅ Same safe parsing as TelecallerView
      const data = response.data?.leads || response.data?.data || []
      console.log('CounselorView leads fetched:', data.length)

      setLeads(data)
      setFilteredLeads(data)
    } catch (error) {
      console.error('Error fetching leads:', error)
      setLeads([])
      setFilteredLeads([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...leads]

    if (searchQuery) {
      filtered = filtered.filter(lead =>
        lead.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.mobile?.includes(searchQuery)
      )
    }

    if (filterStage) {
      filtered = filtered.filter(lead => lead.stage === filterStage)
    }

    setFilteredLeads(filtered)
  }

  const calculateStats = () => {
    // ✅ Stats computed from all leads (not filtered), same as TelecallerView
    const counsellingLeads = leads.filter(l => l.stage === 'Counselling')
    const convertedLeads   = leads.filter(l => l.convertedToPaid === true)
    const totalProcessed   = leads.filter(l =>
      ['Lead Conversion', 'Paid Batch', 'Admission'].includes(l.stage)
    )

    const newStats = {
      totalInCounselling: counsellingLeads.length,
      converted:          convertedLeads.length,
      pending:            counsellingLeads.length,
      conversionRate:     totalProcessed.length > 0
        ? Math.round((convertedLeads.length / totalProcessed.length) * 100)
        : 0
    }

    setStats(newStats)
  }

  const handleViewDetails = (lead) => {
    setSelectedLead(lead)
    setShowDetailsModal(true)
  }

  const handleLeadUpdated = () => {
    fetchLeads()
    onStatsUpdate?.()
    setShowDetailsModal(false)
  }

  const statsCards = [
    { label: 'In Counselling', value: stats.totalInCounselling, color: 'bg-blue-500',   icon: Users        },
    { label: 'Converted',      value: stats.converted,          color: 'bg-green-500',  icon: CheckCircle  },
    { label: 'Pending',        value: stats.pending,            color: 'bg-orange-500', icon: Clock        },
    { label: 'Conversion Rate',value: `${stats.conversionRate}%`,color: 'bg-purple-500',icon: TrendingUp   }
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

        {selectedIds.size > 0 && (
          <div className="sticky top-2 z-20 bg-[#1a1a1a] text-white rounded-xl shadow-lg px-4 py-3 mb-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="font-semibold">{selectedIds.size} selected</span>
              <button onClick={() => setSelectedIds(new Set(filteredLeads.map(l => l._id)))}
                className="text-xs text-white/80 hover:text-white underline">
                Select all {filteredLeads.length}
              </button>
              <button onClick={() => setSelectedIds(new Set())}
                className="text-xs text-white/60 hover:text-white">Clear</button>
            </div>
            <button onClick={() => setBulkOpen(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Send WhatsApp
            </button>
          </div>
        )}

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
                  <th className="px-4 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={filteredLeads.length > 0 && filteredLeads.every(l => selectedIds.has(l._id))}
                      onChange={() => {
                        const ids = filteredLeads.map(l => l._id);
                        const allSel = ids.length > 0 && ids.every(id => selectedIds.has(id));
                        setSelectedIds(allSel ? new Set() : new Set(ids));
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
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
                  <tr key={lead._id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(lead._id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lead._id)}
                        onChange={() => setSelectedIds(prev => {
                          const next = new Set(prev);
                          if (next.has(lead._id)) next.delete(lead._id); else next.add(lead._id);
                          return next;
                        })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
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

            {filteredLeads.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">No leads found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showDetailsModal && selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={() => setShowDetailsModal(false)}
          onLeadUpdated={handleLeadUpdated}
        />
      )}

      {bulkOpen && (
        <BulkWhatsAppModal
          leads={filteredLeads.filter(l => selectedIds.has(l._id))}
          onClose={() => setBulkOpen(false)}
        />
      )}
    </div>
  )
}

const getStageColor = (stage) => {
  const colors = {
    'Enquiry':        'bg-gray-100 text-gray-700',
    'Counselling':    'bg-blue-100 text-blue-700',
    'Free Batch':     'bg-yellow-100 text-yellow-700',
    'Lead Conversion':'bg-purple-100 text-purple-700',
    'Paid Batch':     'bg-green-100 text-green-700',
    'Admission':      'bg-indigo-100 text-indigo-700'
  }
  return colors[stage] || 'bg-gray-100 text-gray-700'
}

export default CounselorView