import { useState } from 'react'
import { User, Phone, Mail, MapPin, Calendar, ArrowRight } from 'lucide-react'
import axios from 'axios'

const LeadPipeline = ({ leads, onLeadClick, onLeadUpdated }) => {
  const stages = [
    { id: 'Enquiry', label: 'Enquiry', color: 'bg-gray-100 border-gray-300' },
    { id: 'Counselling', label: 'Counselling', color: 'bg-blue-100 border-blue-300' },
    { id: 'Free Batch', label: 'Free Batch', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'Lead Conversion', label: 'Lead Conversion', color: 'bg-purple-100 border-purple-300' },
    { id: 'Paid Batch', label: 'Paid Batch', color: 'bg-green-100 border-green-300' },
    { id: 'Admission', label: 'Admission', color: 'bg-indigo-100 border-indigo-300' }
  ]

  const [draggedLead, setDraggedLead] = useState(null)

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, targetStage) => {
    e.preventDefault()
    
    if (!draggedLead || draggedLead.stage === targetStage) {
      setDraggedLead(null)
      return
    }

    try {
      const token = localStorage.getItem('fv_token')
      await axios.put(
        `http://localhost:5000/api/leads/${draggedLead._id}/stage`,
        { stage: targetStage },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      onLeadUpdated()
    } catch (error) {
      console.error('Error updating lead stage:', error)
      alert('Failed to update lead stage')
    } finally {
      setDraggedLead(null)
    }
  }

  const getLeadsByStage = (stage) => {
    return leads.filter(lead => lead.stage === stage)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stages.map((stage) => {
        const stageLeads = getLeadsByStage(stage.id)
        
        return (
          <div
            key={stage.id}
            className={`${stage.color} rounded-2xl border-2 p-4 min-h-[500px]`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="mb-4">
              <h3 className="font-bold text-gray-900 text-sm mb-1">{stage.label}</h3>
              <p className="text-xs text-gray-600">{stageLeads.length} leads</p>
            </div>

            <div className="space-y-3">
              {stageLeads.map((lead) => (
                <div
                  key={lead._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead)}
                  onClick={() => onLeadClick(lead)}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 cursor-move border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-sm">{lead.fullName}</h4>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      lead.batchType === 'Paid' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {lead.batchType}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Phone className="w-3 h-3" />
                      <span>{lead.mobile}</span>
                    </div>
                    
                    {lead.email && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span>{lead.leadSource}</span>
                    </div>

                    {lead.followUpDate && (
                      <div className="flex items-center gap-2 text-xs text-orange-600">
                        <Calendar className="w-3 h-3" />
                        <span>Follow-up: {new Date(lead.followUpDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default LeadPipeline
