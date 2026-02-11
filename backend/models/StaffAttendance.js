const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    checkInTime: {
      type: Date,
      required: true
    },
    checkOutTime: {
      type: Date
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Half Day', 'Leave'],
      default: 'Present'
    },
    workingHours: {
      type: Number, // In hours
      default: 0
    },
    branch: {
      type: String,
      default: 'Main'
    },
    remarks: {
      type: String,
      default: ''
    },
    // Geolocation data
    checkInLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      branchName: { type: String },
      distance: { type: Number } // Distance from branch in meters
    },
    checkOutLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      branchName: { type: String },
      distance: { type: Number }
    },
    // Auto-calculated
    isLate: {
      type: Boolean,
      default: false
    },
    lateByMinutes: {
      type: Number,
      default: 0
    }
  },
  { 
    timestamps: true 
  }
);

// Index for faster queries
staffAttendanceSchema.index({ userId: 1, date: 1 });

// Calculate working hours before saving
staffAttendanceSchema.pre('save', function() {
    if (this.checkInTime && this.checkOutTime) {
      const diffMs = this.checkOutTime - this.checkInTime;
      this.workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)); // Convert to hours
    }
  });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);
