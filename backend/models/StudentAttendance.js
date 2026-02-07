const mongoose = require('mongoose');

const studentAttendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  date: {
    type: Date,
    required: true
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
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half Day'],
    default: 'Present'
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  remarks: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance entries
studentAttendanceSchema.index({ studentId: 1, date: 1, timeSlot: 1 }, { unique: true });

// Update student attendance statistics after save
studentAttendanceSchema.post('save', async function() {
  const Student = mongoose.model('Student');
  const student = await Student.findById(this.studentId);
  
  if (student) {
    const totalClasses = await this.constructor.countDocuments({ 
      studentId: this.studentId,
      batchType: student.batchType
    });
    
    const attendedClasses = await this.constructor.countDocuments({ 
      studentId: this.studentId,
      batchType: student.batchType,
      status: { $in: ['Present', 'Late'] }
    });
    
    student.totalClasses = totalClasses;
    student.attendedClasses = attendedClasses;
    await student.save();
  }
});

// Update student attendance statistics after delete
studentAttendanceSchema.post('deleteOne', { document: true, query: false }, async function() {
  const Student = mongoose.model('Student');
  const student = await Student.findById(this.studentId);
  
  if (student) {
    const totalClasses = await this.constructor.countDocuments({ 
      studentId: this.studentId,
      batchType: student.batchType
    });
    
    const attendedClasses = await this.constructor.countDocuments({ 
      studentId: this.studentId,
      batchType: student.batchType,
      status: { $in: ['Present', 'Late'] }
    });
    
    student.totalClasses = totalClasses;
    student.attendedClasses = attendedClasses;
    await student.save();
  }
});

module.exports = mongoose.model('StudentAttendance', studentAttendanceSchema);
