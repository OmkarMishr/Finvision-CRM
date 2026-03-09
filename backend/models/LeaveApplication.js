const mongoose = require('mongoose')

const LeaveApplicationSchema = new mongoose.Schema(
  {
    // ── Applicant ─────────────────────────────────────────────────────────
    staff: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    staffName:  { type: String },
    staffEmail: { type: String },
    staffRole:  { type: String },

    // ── Leave Details ─────────────────────────────────────────────────────
    leaveType: {
      type:     String,
      enum:     ['casual', 'sick', 'earned', 'halfday', 'emergency', 'unpaid'],
      required: true,
    },
    fromDate:    { type: Date,    required: true },
    toDate:      { type: Date,    required: true },
    totalDays:   { type: Number,  default: 1     },
    isHalfDay:   { type: Boolean, default: false },
    halfDaySlot: {
      type:    String,
      enum:    ['morning', 'afternoon', null],
      default: null,
    },
    reason:    { type: String, required: true, trim: true, maxlength: 500 },
    contactNo: { type: String, default: null },

    // ── Status ────────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index:   true,
    },

    // ── Admin Review ──────────────────────────────────────────────────────
    reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt:   { type: Date,   default: null },
    adminRemarks: { type: String, default: null },
  },
  { timestamps: true }
)

// ✅ async pre-hook — no next() parameter needed at all
// Mongoose 5+ resolves the hook automatically when the async function returns
LeaveApplicationSchema.pre('save', async function () {
  if (this.isHalfDay) {
    this.totalDays = 0.5
  } else {
    const diff     = new Date(this.toDate) - new Date(this.fromDate)
    this.totalDays = Math.max(Math.floor(diff / 86400000) + 1, 1)
  }
})

// ── Indexes ───────────────────────────────────────────────────────────────────
LeaveApplicationSchema.index({ status: 1, createdAt: -1 })
LeaveApplicationSchema.index({ staff: 1, status: 1      })
LeaveApplicationSchema.index({ fromDate: 1, toDate: 1   })

module.exports = mongoose.model('LeaveApplication', LeaveApplicationSchema)
