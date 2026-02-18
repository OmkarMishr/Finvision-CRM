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
    updateStatus: (id) => `${API_URL}/api/students/${id}/status`,
    updateProfile: `${API_URL}/api/students/update-profile`,
    removePhoto: `${API_URL}/api/students/remove-photo`,
    uploadPhoto: `${API_URL}/api/students/upload-photo`,
  },

  // Student Attendance endpoints
  studentAttendance: {
    markSingle: `${API_URL}/api/student-attendance/mark`,
    markBatch: `${API_URL}/api/student-attendance/mark-batch`,
    getAll: `${API_URL}/api/student-attendance`,
    byStudent: (studentId) => `${API_URL}/api/student-attendance/student/${studentId}`,
    byDate: (date) => `${API_URL}/api/student-attendance/date/${date}`,
    byBatch: (batchId) => `${API_URL}/api/student-attendance/batch/${batchId}`,
    update: (id) => `${API_URL}/api/student-attendance/${id}`,
    delete: (id) => `${API_URL}/api/student-attendance/${id}`,
    statistics: `${API_URL}/api/student-attendance/stats/overview`
  },
  // Staff Attendance endpoints
  staffAttendance: {
    checkIn: `${API_URL}/api/staff-attendance/check-in`,
    checkOut: `${API_URL}/api/staff-attendance/check-out`,
    myAttendance: `${API_URL}/api/staff-attendance/my-attendance`,
    today: `${API_URL}/api/staff-attendance/today`,
    getAll: `${API_URL}/api/staff-attendance`,
    stats: `${API_URL}/api/staff-attendance/stats/overview`
  },
  
  // Batch endpoints
  batches: {
    create: `${API_URL}/api/batches`,
    getAll: `${API_URL}/api/batches`,
    getOne: (id) => `${API_URL}/api/batches/${id}`,
    update: (id) => `${API_URL}/api/batches/${id}`,
    delete: (id) => `${API_URL}/api/batches/${id}`,
    enroll: (id) => `${API_URL}/api/batches/${id}/enroll`,
    removeStudent: (id) => `${API_URL}/api/batches/${id}/remove-student`,
    statistics: `${API_URL}/api/batches/stats/overview`
  },

  //fees Endpoints
  fees: {
    base: `${API_URL}/api/fees`,
    collect: `${API_URL}/api/fees/collect`,            
    history: (studentId) => `${API_URL}/api/fees/history/${studentId}`, // GET
    pending: (studentId) => `${API_URL}/api/fees/pending/${studentId}`, // GET
    receipt: (paymentId) => `${API_URL}/api/fees/receipt/${paymentId}`, // GET (PDF / HTML)
    validateCoupon: `${API_URL}/api/fees/coupons/validate`,   // POST {code}
    stats: `${API_URL}/api/fees/statistics`            // admin-level (revenue & conversion)
  },
  //Certificate Endpoints
   certificates: {
    eligibility: `${API_URL}/api/certificates/eligibility`,
    download: `${API_URL}/api/certificates/download`,
    getAll: `${API_URL}/api/certificates`,
  },
  // LiveClass Endpoints
  liveClasses: {
    base: `${API_URL}/api/live-classes`,
    admin: `${API_URL}/api/live-classes/admin`,
    student: `${API_URL}/api/live-classes/student`,
    stats: `${API_URL}/api/live-classes/stats`,
    byId: (id) => `${API_URL}/api/live-classes/${id}`,
    join: (id) => `${API_URL}/api/live-classes/${id}/join`
  },,

  // Admin endpoints
  admin: {
    backup: `${API_URL}/api/admin/backup`,
    restore: `${API_URL}/api/admin/restore`,
    dashboardStats: `${API_URL}/api/admin/dashboard-stats`
  }
}

// Legacy exports for backward compatibility (if needed)
export const STUDENT_ATTENDANCE_ENDPOINTS = API_ENDPOINTS.studentAttendance
export const BATCH_ENDPOINTS = API_ENDPOINTS.batches
export const LEAD_ENDPOINTS = API_ENDPOINTS.leads
export const STUDENT_ENDPOINTS = API_ENDPOINTS.students
export const ADMIN_ENDPOINTS = API_ENDPOINTS.admin

export default API_URL
