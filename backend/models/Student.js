const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema(
  {
    // Basic Information
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    age: {
      type: Number
    },
    education: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    occupation: {
      type: String,
      trim: true
    },

    // Admission Information
    admissionNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    admissionDate: {
      type: Date,
      default: Date.now
    },

    // Batch Information
    batchSection: {
      type: String,
      trim: true
    },
    batchType: {
      type: String,
      enum: ['Free', 'Paid'],
      default: 'Free'
    },

    // Course Information
    courseCategory: {
      type: String,
      enum: ['Basic', 'Advanced', 'Basic + Advanced', 'Advisory'],
      required: true
    },

    // Lead Source
    leadSource: {
      type: String,
      enum: ['Facebook', 'Google', 'Instagram', 'Referral', 'Walk-in', 'Other'],
      default: 'Walk-in'
    },

    // Status
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Completed', 'Dropped'],
      default: 'Active'
    },

    // Conversion Information
    convertedFromLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead'
    },
    conversionDate: {
      type: Date
    },

    // Fee Information
    totalFees: {
      type: Number,
      default: 0
    },
    paidFees: {
      type: Number,
      default: 0
    },
    pendingFees: {
      type: Number,
      default: 0
    },
    lastPaymentDate: {
      type: Date
    },

    // Attendance
    totalClasses: {
      type: Number,
      default: 0
    },
    attendedClasses: {
      type: Number,
      default: 0
    },
    attendancePercentage: {
      type: Number,
      default: 0
    },

    // User Account Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Branch
    branch: {
      type: String,
      default: 'Main'
    },

    // Assigned Staff
    assignedCounselor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Notes
    notes: [{
      note: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],

    // Created By
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

// Generate admission number before saving
studentSchema.pre('save', async function() {
  if (this.isNew && !this.admissionNumber) {
    const year = new Date().getFullYear()
    const count = await this.constructor.countDocuments()
    this.admissionNumber = `FV${year}${String(count + 1).padStart(4, '0')}`
  }
  
  // Calculate pending fees
  this.pendingFees = this.totalFees - this.paidFees
  
  // Calculate attendance percentage
  if (this.totalClasses > 0) {
    this.attendancePercentage = Math.round((this.attendedClasses / this.totalClasses) * 100)
  }
})

// Indexes for faster queries
studentSchema.index({ mobile: 1 })
studentSchema.index({ email: 1 })
studentSchema.index({ admissionNumber: 1 })
studentSchema.index({ status: 1 })
studentSchema.index({ batchType: 1 })
studentSchema.index({ branch: 1 })
studentSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Student', studentSchema)
