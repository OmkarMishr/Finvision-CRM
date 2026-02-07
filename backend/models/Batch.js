const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchName: {
    type: String,
    required: true,
    unique: true
  },
  batchType: {
    type: String,
    enum: ['Free', 'Paid'],
    required: true
  },
  course: {
    type: String,
    enum: ['Basic', 'Advanced', 'Basic + Advanced', 'Advisory'],
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  instructor: {
    type: String
  },
  maxStudents: {
    type: Number,
    default: 30
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Scheduled'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Batch', batchSchema);
