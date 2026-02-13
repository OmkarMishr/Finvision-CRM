const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCategory: {
    type: String,
    required: true,
    enum: ['Basic', 'Advanced', 'Basic + Advanced', 'Advisory']
  },
  fee: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number, // in months
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
