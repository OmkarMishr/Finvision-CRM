const mongoose = require('mongoose');

const liveClassSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  courseCategory: {
    type: String,
    enum: ['Basic', 'Advanced', 'Basic + Advanced', 'Advisory', 'All'],
    default: 'All'
  },
  batchType: {
    type: String,
    enum: ['Free', 'Paid', 'All'],
    default: 'All'
  },
  platform: {
    type: String,
    enum: ['Google Meet', 'Zoom', 'Other'],
    required: true
  },
  meetingLink: {
    type: String,
    required: true,
    trim: true
  },
  meetingId: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    trim: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instructorName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Live', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  recordingLink: {
    type: String,
    trim: true
  },
  maxParticipants: {
    type: Number,
    default: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  attendees: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    joinedAt: Date,
    leftAt: Date,
    duration: Number // in minutes
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
liveClassSchema.index({ scheduledDate: 1, status: 1 });
liveClassSchema.index({ courseCategory: 1, batchType: 1 });

// Virtual for formatted date
liveClassSchema.virtual('formattedDate').get(function() {
  return this.scheduledDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
});

module.exports = mongoose.model('LiveClass', liveClassSchema);
