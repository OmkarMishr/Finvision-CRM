const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const API_ENDPOINTS = {
  baseURL: API_URL,
  
  // Auth endpoints
  auth: {
    register: `${API_URL}/api/auth/register`,
    login: `${API_URL}/api/auth/login`,
    profile: `${API_URL}/api/auth/profile`,
    dashboard: `${API_URL}/api/auth/dashboard`,
    debugToken: `${API_URL}/api/auth/debug-token`
  },
  
  // Lead endpoints
  leads: {
    base: `${API_URL}/api/leads`,
    stats: `${API_URL}/api/leads/stats/overview`,
    byId: (id) => `${API_URL}/api/leads/${id}`,
    updateStage: (id) => `${API_URL}/api/leads/${id}/stage`,
    addRemark: (id) => `${API_URL}/api/leads/${id}/remarks`,
    assignCounselor: (id) => `${API_URL}/api/leads/${id}/assign-counselor`
  },
  
  // Student endpoints
  students: {
    base: `${API_URL}/api/students`,
    myProfile: `${API_URL}/api/students/my-profile`,
    stats: `${API_URL}/api/students/stats/overview`,
    byId: (id) => `${API_URL}/api/students/${id}`,
    convertFromLead: (leadId) => `${API_URL}/api/students/convert-from-lead/${leadId}`,
    convertToPaid: (id) => `${API_URL}/api/students/${id}/convert-to-paid`,
    addNote: (id) => `${API_URL}/api/students/${id}/notes`,
    updateStatus: (id) => `${API_URL}/api/students/${id}/status`
  }
}

export default API_URL
