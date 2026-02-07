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
  },

  // Student Attendance endpoints
  STUDENT_ATTENDANCE_ENDPOINTS: {
    MARK_SINGLE: '/student-attendance/mark',
    MARK_BATCH: '/student-attendance/mark-batch',
    GET_ALL: '/student-attendance',
    GET_BY_STUDENT: (studentId) => `/student-attendance/student/${studentId}`,
    GET_BY_DATE: (date) => `/student-attendance/date/${date}`,
    GET_BY_BATCH: (batchId) => `/student-attendance/batch/${batchId}`,
    UPDATE: (id) => `/student-attendance/${id}`,
    DELETE: (id) => `/student-attendance/${id}`,
    STATISTICS: '/student-attendance/stats/overview'
  },

  // Batch endpoints
  BATCH_ENDPOINTS: {
    CREATE: '/batches',
    GET_ALL: '/batches',
    GET_ONE: (id) => `/batches/${id}`,
    UPDATE: (id) => `/batches/${id}`,
    DELETE: (id) => `/batches/${id}`,
    ENROLL: (id) => `/batches/${id}/enroll`,
    REMOVE_STUDENT: (id) => `/batches/${id}/remove-student`,
    STATISTICS: '/batches/stats/overview'
  },
}

export default API_URL
