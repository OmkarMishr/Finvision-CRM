const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const API_ENDPOINTS = {
  baseURL: API_URL,

  // Auth endpoints
  auth: {
    register:   `${API_URL}/api/auth/register`,
    login:      `${API_URL}/api/auth/login`,
    profile:    `${API_URL}/api/auth/profile`,
    me:         `${API_URL}/api/auth/profile`,   // alias used by Settings panel
    dashboard:  `${API_URL}/api/auth/dashboard`,
    debugToken: `${API_URL}/api/auth/debug-token`
  },

  // Lead endpoints
  leads: {
    base:             `${API_URL}/api/leads`,
    stats:            `${API_URL}/api/leads/stats/overview`,
    importSheet:      `${API_URL}/api/leads/import-sheet`,
    byId:             (id) => `${API_URL}/api/leads/${id}`,
    updateStage:      (id) => `${API_URL}/api/leads/${id}/stage`,
    addRemark:        (id) => `${API_URL}/api/leads/${id}/remarks`,
    assignCounselor:  (id) => `${API_URL}/api/leads/${id}/assign-counselor`,
    assignTelecaller: (id) => `${API_URL}/api/leads/${id}/assign-telecaller`
  },

  // Student endpoints
  students: {
    base:              `${API_URL}/api/students`,
    myProfile:         `${API_URL}/api/students/my-profile`,
    stats:             `${API_URL}/api/students/stats/overview`,
    byId:              (id)     => `${API_URL}/api/students/${id}`,
    convertFromLead:   (leadId) => `${API_URL}/api/students/convert-from-lead/${leadId}`,
    convertToPaid:     (id)     => `${API_URL}/api/students/${id}/convert-to-paid`,
    addNote:           (id)     => `${API_URL}/api/students/${id}/notes`,
    updateStatus:      (id)     => `${API_URL}/api/students/${id}/status`,
    updateProfile:     `${API_URL}/api/students/update-profile`,
    removePhoto:       `${API_URL}/api/students/remove-photo`,
    uploadPhoto:       `${API_URL}/api/students/upload-photo`,
  },

  // Staff endpoints
  staff: {
    base:          `${API_URL}/api/staff`,
    create:        `${API_URL}/api/staff`,
    telecallers:   `${API_URL}/api/staff/telecallers`,
    stats:         `${API_URL}/api/staff/stats/overview`,
    byId:          (id) => `${API_URL}/api/staff/${id}`,
    update:        (id) => `${API_URL}/api/staff/${id}`,
    delete:        (id) => `${API_URL}/api/staff/${id}`,
    updateStatus:  (id) => `${API_URL}/api/staff/${id}/status`,
    resetPassword: (id) => `${API_URL}/api/staff/${id}/reset-password`,
  },

  // Staff Leave endpoints 
  leave: {
    apply:     '/api/leave/apply',
    myHistory: '/api/leave/my-history',
    balance:   '/api/leave/balance',
    cancel:    (id) => `/api/leave/cancel/${id}`,
    admin: {
      all:     '/api/leave/admin/all',
      pending: '/api/leave/admin/pending',
      stats:   '/api/leave/admin/stats',
      review:  (id) => `/api/leave/admin/${id}/review`,
      delete:  (id) => `/api/leave/admin/${id}`,
    },
  },

  // Student Attendance endpoints
  studentAttendance: {
    markSingle:  `${API_URL}/api/student-attendance/mark`,
    markBatch:   `${API_URL}/api/student-attendance/mark-batch`,
    getAll:      `${API_URL}/api/student-attendance`,
    byStudent:   (studentId) => `${API_URL}/api/student-attendance/student/${studentId}`,
    byDate:      (date)      => `${API_URL}/api/student-attendance/date/${date}`,
    byBatch:     (batchId)   => `${API_URL}/api/student-attendance/batch/${batchId}`,
    update:      (id)        => `${API_URL}/api/student-attendance/${id}`,
    delete:      (id)        => `${API_URL}/api/student-attendance/${id}`,
    statistics:  `${API_URL}/api/student-attendance/stats/overview`
  },

  // Staff Attendance endpoints
  staffAttendance: {
    checkIn:      `${API_URL}/api/staff-attendance/check-in`,
    checkOut:     `${API_URL}/api/staff-attendance/check-out`,
    myAttendance: `${API_URL}/api/staff-attendance/my-attendance`,
    today:        `${API_URL}/api/staff-attendance/today`,
    getAll:       `${API_URL}/api/staff-attendance`,
    stats:        `${API_URL}/api/staff-attendance/stats/overview`
  },

  // Batch endpoints
  batches: {
    create:        `${API_URL}/api/batches`,
    getAll:        `${API_URL}/api/batches`,
    getOne:        (id) => `${API_URL}/api/batches/${id}`,
    update:        (id) => `${API_URL}/api/batches/${id}`,
    delete:        (id) => `${API_URL}/api/batches/${id}`,
    enroll:        (id) => `${API_URL}/api/batches/${id}/enroll`,
    removeStudent: (id) => `${API_URL}/api/batches/${id}/remove-student`,
    statistics:    `${API_URL}/api/batches/stats/overview`
  },

  // Fees endpoints
  fees: {
    base:           `${API_URL}/api/fees`,
    collect:        `${API_URL}/api/fees/collect`,
    history:        (studentId) => `${API_URL}/api/fees/history/${studentId}`,
    pending:        (studentId) => `${API_URL}/api/fees/pending/${studentId}`,
    receipt:        (paymentId) => `${API_URL}/api/fees/receipt/${paymentId}`,
    validateCoupon: `${API_URL}/api/fees/coupons/validate`,
    stats:          `${API_URL}/api/fees/statistics`
  },

  // Certificate endpoints
  certificates: {
    eligibility: `${API_URL}/api/certificates/eligibility`,
    download:    `${API_URL}/api/certificates/download`,
    getAll:      `${API_URL}/api/certificates`,
  },

  // LiveClass endpoints
  liveClasses: {
    base:    `${API_URL}/api/live-classes`,
    admin:   `${API_URL}/api/live-classes/admin`,
    student: `${API_URL}/api/live-classes/student`,
    stats:   `${API_URL}/api/live-classes/stats`,
    byId:    (id) => `${API_URL}/api/live-classes/${id}`,
    join:    (id) => `${API_URL}/api/live-classes/${id}/join`
  },

  // Admin endpoints
  admin: {
    backup:         `${API_URL}/api/admin/backup`,
    restore:        `${API_URL}/api/admin/restore`,
    dashboardStats: `${API_URL}/api/admin/dashboard-stats`
  },

  // Admin Settings endpoints
  adminSettings: {
    base:          `${API_URL}/api/admin-settings`,
    institute:     `${API_URL}/api/admin-settings/institute`,
    logo:          `${API_URL}/api/admin-settings/institute/logo`,
    fees:          `${API_URL}/api/admin-settings/fees`,
    permissions:   `${API_URL}/api/admin-settings/permissions`,
    notifications: `${API_URL}/api/admin-settings/notifications`,
    security:      `${API_URL}/api/admin-settings/security`,
    password:      `${API_URL}/api/admin-settings/change-password`,
    appearance:    `${API_URL}/api/admin-settings/appearance`,
    account:       `${API_URL}/api/admin-settings/account`,
    accountPhoto:  `${API_URL}/api/admin-settings/account/photo`,
    coupons: {
      base:   `${API_URL}/api/admin-settings/coupons`,
      toggle: (id) => `${API_URL}/api/admin-settings/coupons/${id}/toggle`,
      delete: (id) => `${API_URL}/api/admin-settings/coupons/${id}`,
    },
    data: {
      overview: `${API_URL}/api/admin-settings/data/overview`,
      backup:   `${API_URL}/api/admin-settings/data/backup`,
      restore:  `${API_URL}/api/admin-settings/data/restore`,
      archived: `${API_URL}/api/admin-settings/data/archived`,
    },
  },
}

// Legacy exports for backward compatibility
export const STUDENT_ATTENDANCE_ENDPOINTS = API_ENDPOINTS.studentAttendance
export const BATCH_ENDPOINTS              = API_ENDPOINTS.batches
export const LEAD_ENDPOINTS               = API_ENDPOINTS.leads
export const STUDENT_ENDPOINTS            = API_ENDPOINTS.students
export const ADMIN_ENDPOINTS              = API_ENDPOINTS.admin
export const STAFF_ENDPOINTS              = API_ENDPOINTS.staff
export const LEAVE_ENDPOINTS              = API_ENDPOINTS.leave

export default API_URL
