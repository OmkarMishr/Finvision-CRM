const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  certificateNo: {
    type: String,
    required: true,
    unique: true
  },
  totalClasses: {
    type: Number,
    required: true
  },
  presentClasses: {
    type: Number,
    required: true
  },
  attendancePercentage: {
    type: Number,
    required: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
certificateSchema.index({ studentId: 1 });
certificateSchema.index({ certificateNo: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
