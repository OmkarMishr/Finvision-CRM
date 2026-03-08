const mongoose = require('mongoose');

const adminSettingSchema = new mongoose.Schema({
  // Singleton — always one doc
  type: {
    type: String,
    default: 'global',
    unique: true,
  },

  // ── Institute Profile ──────────────────────────────────────────────────────
  institute: {
    name:    { type: String, default: 'Finvision Academy' },
    tagline: { type: String, default: 'Institute of Financial Excellence' },
    email:   { type: String, default: 'support@finvisionacademy.com' },
    phone:   { type: String, default: '' },
    address: { type: String, default: '' },
    website: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
  },

  // ── Fees Configuration ─────────────────────────────────────────────────────
  fees: {
    feeHeads: {
      type: [String],
      default: ['Course Fee', 'Exam Fee', 'Certification Fee', 'Other'],
    },
    gst: {
      enabled:    { type: Boolean, default: false },
      percentage: { type: Number,  default: 18    },
    },
    receipt: {
      footerText: { type: String,  default: 'Thank you for your payment!' },
      showLogo:   { type: Boolean, default: true  },
    },
  },

  // ── Roles & Permissions ────────────────────────────────────────────────────
  // Stored as: { staff: { Leads: ['View','Edit'], ... }, counselor: { ... } }
  permissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      staff: {
        Dashboard:  ['View'],
        Leads:      ['View', 'Create', 'Edit'],
        Students:   ['View', 'Edit'],
        Batches:    ['View'],
        Fees:       ['View'],
        Staff:      [],
        Attendance: ['View', 'Create'],
        Reports:    [],
      },
      counselor: {
        Dashboard:  ['View'],
        Leads:      ['View', 'Edit'],
        Students:   ['View'],
        Batches:    ['View'],
        Fees:       ['View'],
        Staff:      [],
        Attendance: [],
        Reports:    [],
      },
    },
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    email: {
      newLead:      { type: Boolean, default: true  },
      feePayment:   { type: Boolean, default: true  },
      newStudent:   { type: Boolean, default: true  },
      staffAdded:   { type: Boolean, default: false },
      batchFull:    { type: Boolean, default: true  },
      dailySummary: { type: Boolean, default: false },
    },
    inApp: {
      newLead:    { type: Boolean, default: true  },
      feePayment: { type: Boolean, default: true  },
      attendance: { type: Boolean, default: false },
      batchFull:  { type: Boolean, default: true  },
    },
  },

  // ── Security ───────────────────────────────────────────────────────────────
  security: {
    twoFAEnabled:       { type: Boolean, default: false },
    newDeviceAlerts:    { type: Boolean, default: true  },
  },

  // ── Appearance ─────────────────────────────────────────────────────────────
  appearance: {
    theme:             { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    dateFormat:        { type: String, enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], default: 'DD/MM/YYYY' },
    sidebarCollapsed:  { type: Boolean, default: false },
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model('AdminSetting', adminSettingSchema);
