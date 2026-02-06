const mongoose = require('mongoose')

const leadSchema = new mongoose.Schema(
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

    // Lead Source
    leadSource: {
      type: String,
      enum: ['Facebook', 'Google', 'Instagram', 'Referral', 'Walk-in', 'Other'],
      default: 'Walk-in'
    },

    // Course Category
    courseCategory: {
      type: String,
      enum: ['Basic', 'Advanced', 'Basic + Advanced', 'Advisory'],
      default: 'Basic'
    },

    // Batch Information
    batchSection: {
      type: String, // Time slot like "Morning 9-11", "Evening 5-7"
      trim: true
    },
    batchType: {
      type: String,
      enum: ['Free', 'Paid'],
      default: 'Free'
    },

    // Lead Stage (Pipeline)
    stage: {
      type: String,
      enum: ['Enquiry', 'Counselling', 'Free Batch', 'Lead Conversion', 'Paid Batch', 'Admission'],
      default: 'Enquiry'
    },

    // Status
    status: {
      type: String,
      enum: ['Active', 'Pending', 'Converted', 'Closed', 'Lost'],
      default: 'Active'
    },

    // Assigned Staff
    assignedTelecaller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedCounselor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Follow-up
    followUpDate: {
      type: Date
    },
    lastFollowUp: {
      type: Date
    },

    // Remarks & Notes
    remarks: {
        type: [{
          note: {
            type: String,
            required: true
          },
          addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          },
          addedAt: {
            type: Date,
            default: Date.now
          }
        }],
        default: [] 
      },

    // Conversion Tracking
    convertedToPaid: {
      type: Boolean,
      default: false
    },
    conversionDate: {
      type: Date
    },
    admissionDate: {
      type: Date
    },

    // Revenue
    expectedRevenue: {
      type: Number,
      default: 0
    },
    actualRevenue: {
      type: Number,
      default: 0
    },

    // Branch
    branch: {
      type: String,
      default: 'Main'
    },

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

// Index for faster queries
leadSchema.index({ mobile: 1 })
leadSchema.index({ email: 1 })
leadSchema.index({ stage: 1 })
leadSchema.index({ assignedTelecaller: 1 })
leadSchema.index({ assignedCounselor: 1 })
leadSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Lead', leadSchema)
