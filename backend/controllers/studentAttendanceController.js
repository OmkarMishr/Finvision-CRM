const StudentAttendance = require('../models/StudentAttendance');
const Student = require('../models/Student');
const Batch = require('../models/Batch');

// @desc    Mark attendance for single student
// @route   POST /api/student-attendance/mark
// @access  Private (Admin, Staff)
const markAttendance = async (req, res) => {
  try {
    const { studentId, date, batchType, course, branch, timeSlot, status, remarks } = req.body;
    const normalizedDate = new Date(date).setHours(0, 0, 0, 0);
    // Check if attendance already exists
    const existingAttendance = await StudentAttendance.findOne({
      studentId,
      date: normalizedDate,
      timeSlot
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        success: false,
        message: 'Attendance already marked for this session' 
      });
    }

    const attendance = await StudentAttendance.create({
      studentId,
      date: normalizedDate,
      batchType,
      course,
      branch,
      timeSlot,
      status,
      remarks,
      markedBy: req.user.id
    });

    await attendance.populate('studentId', 'fullName admissionNumber');

    res.status(201).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Mark attendance for multiple students (bulk)
// @route   POST /api/student-attendance/mark-batch
// @access  Private (Admin, Staff)
const markBatchAttendance = async (req, res) => {
  try {
    const { date, batchType, course, branch, timeSlot, students } = req.body;

    const normalizedDate = new Date(date).setHours(0, 0, 0, 0);

    const attendanceRecords = [];
    const errors = [];

    for (const student of students) {
      try {
        const existing = await StudentAttendance.findOne({
          studentId: student.studentId,
          date: normalizedDate,
          timeSlot
        });

        if (existing) {
          errors.push({ studentId: student.studentId, error: 'Already marked' });
          continue;
        }

        const attendance = await StudentAttendance.create({
          studentId: student.studentId,
          date: normalizedDate,
          batchType,
          course,
          branch,
          timeSlot,
          status: student.status,
          remarks: student.remarks,
          markedBy: req.user.id
        });

        attendanceRecords.push(attendance);
      } catch (err) {
        errors.push({ studentId: student.studentId, error: err.message });
      }
    }

    res.status(201).json({
      success: true,
      data: attendanceRecords,
      errors: errors.length > 0 ? errors : undefined,
      message: `Marked attendance for ${attendanceRecords.length} students`
    });
  } catch (error) {
    console.error('Mark batch attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get all attendance records with filters
// @route   GET /api/student-attendance
// @access  Private (Admin, Staff)
const getAllAttendance = async (req, res) => {
  try {
    const { 
      studentId, 
      date, 
      startDate, 
      endDate, 
      batchType, 
      course, 
      branch, 
      timeSlot, 
      status 
    } = req.query;

    let query = {};

    if (studentId) query.studentId = studentId;
    if (batchType) query.batchType = batchType;
    if (course) query.course = course;
    if (branch) query.branch = branch;
    if (timeSlot) query.timeSlot = timeSlot;
    if (status) query.status = status;

    if (date) {
      const targetDate = new Date(date);
      query.date = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lte: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    } else if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await StudentAttendance.find(query)
      .populate('studentId', 'fullName admissionNumber email mobile')
      .populate('markedBy', 'fullName email')
      .sort({ date: -1, timeSlot: 1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get attendance records for specific student
// @route   GET /api/student-attendance/student/:studentId
// @access  Private (Admin, Staff, Student - own)
const getStudentAttendance = async (req, res) => {
  try {
    // Students can only view their own attendance
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user.id });
      if (!student || student._id.toString() !== req.params.studentId) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    const attendance = await StudentAttendance.find({ studentId: req.params.studentId })
      .populate('markedBy', 'fullName')
      .sort({ date: -1 });

    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const absent = attendance.filter(a => a.status === 'Absent').length;
    const late = attendance.filter(a => a.status === 'Late').length;
    const halfDay = attendance.filter(a => a.status === 'Half Day').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: attendance,
      statistics: {
        total,
        present,
        absent,
        late,
        halfDay,
        percentage
      }
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get all attendance for specific date
// @route   GET /api/student-attendance/date/:date
// @access  Private (Admin, Staff)
const getAttendanceByDate = async (req, res) => {
  try {
    const targetDate = new Date(req.params.date);
    
    const attendance = await StudentAttendance.find({
      date: {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lte: new Date(targetDate.setHours(23, 59, 59, 999))
      }
    })
    .populate('studentId', 'fullName admissionNumber course batchType')
    .sort({ timeSlot: 1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('Get attendance by date error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Update attendance record
// @route   PUT /api/student-attendance/:id
// @access  Private (Admin, Staff)
const updateAttendance = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    let attendance = await StudentAttendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    attendance.status = status || attendance.status;
    attendance.remarks = remarks !== undefined ? remarks : attendance.remarks;

    await attendance.save();

    await attendance.populate('studentId', 'fullName admissionNumber');

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Delete attendance record
// @route   DELETE /api/student-attendance/:id
// @access  Private (Admin only)
const deleteAttendance = async (req, res) => {
  try {
    const attendance = await StudentAttendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    await attendance.deleteOne();

    res.json({
      success: true,
      message: 'Attendance record deleted'
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get attendance statistics
// @route   GET /api/student-attendance/stats/overview
// @access  Private (Admin, Staff)
const getAttendanceStats = async (req, res) => {
  try {
    const { startDate, endDate, batchType, course, branch } = req.query;

    let matchQuery = {};
    
    if (batchType) matchQuery.batchType = batchType;
    if (course) matchQuery.course = course;
    if (branch) matchQuery.branch = branch;
    
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await StudentAttendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalAttendance = await StudentAttendance.countDocuments(matchQuery);
    
    const formattedStats = {
      total: totalAttendance,
      present: stats.find(s => s._id === 'Present')?.count || 0,
      absent: stats.find(s => s._id === 'Absent')?.count || 0,
      late: stats.find(s => s._id === 'Late')?.count || 0,
      halfDay: stats.find(s => s._id === 'Half Day')?.count || 0
    };

    formattedStats.presentPercentage = totalAttendance > 0 
      ? (((formattedStats.present + formattedStats.late) / totalAttendance) * 100).toFixed(2) 
      : 0;

    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get attendance for specific batch
// @route   GET /api/student-attendance/batch/:batchId
// @access  Private (Admin, Staff)
const getBatchAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    
    const batch = await Batch.findById(req.params.batchId).populate('enrolledStudents');
    
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const studentIds = batch.enrolledStudents.map(s => s._id);
    
    let query = {
      studentId: { $in: studentIds },
      batchType: batch.batchType,
      course: batch.course
    };

    if (date) {
      const targetDate = new Date(date);
      query.date = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lte: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    }

    const attendance = await StudentAttendance.find(query)
      .populate('studentId', 'fullName admissionNumber email mobile');

    res.json({
      success: true,
      batch: {
        batchName: batch.batchName,
        batchType: batch.batchType,
        course: batch.course,
        totalStudents: batch.enrolledStudents.length
      },
      data: attendance
    });
  } catch (error) {
    console.error('Get batch attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}


//Mark self attendance for logged-in student with GEOLOCATION
// @desc    Mark self attendance for logged-in student
// @route   POST /api/student-attendance/mark-self
// @access  Private (Student)
const markSelfAttendance = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location permission required to mark attendance'
      });
    }

    // 🔧 IMPORTANT: Update these coordinates with your institute's actual location
    const allowedLocations = [
      {
        name: 'Development-Office CCET',
        lat: 21.22751099382196,  
        lng: 81.35853045767237, 
        radius: 200    // Radius in meters (200m = ~0.2km)
      },
      {
        name: 'Branch-office - Bhilai',
        lat: 21.21225770972837, 
        lng: 81.31623493366958,
        radius: 200
      }
      // Add more branches here if needed
    ];

    // Check if student is within any allowed location
    let matchedLocation = null;
    let distance = null;

    for (const location of allowedLocations) {
      const dist = calculateDistance(
        latitude,
        longitude,
        location.lat,
        location.lng
      );

      if (dist <= location.radius) {
        matchedLocation = location.name;
        distance = Math.round(dist);
        break;
      }
    }

    if (!matchedLocation) {
      // Calculate distance to nearest branch for error message
      const nearestBranch = allowedLocations[0];
      const distanceToNearest = Math.round(
        calculateDistance(
          latitude,
          longitude,
          nearestBranch.lat,
          nearestBranch.lng
        )
      );

      return res.status(403).json({
        success: false,
        message: `You must be at the institute premises to mark attendance. You are ${distanceToNearest}m away from ${nearestBranch.name}.`
      });
    }

    const student = await Student.findOne({ userId: req.user.id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found for this account'
      });
    }

    const today = new Date();
    const dateOnly = new Date(today.setHours(0, 0, 0, 0));

    const existing = await StudentAttendance.findOne({
      studentId: student._id,
      date: dateOnly,
      timeSlot: 'Self'
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for today'
      });
    }

    const attendance = await StudentAttendance.create({
      studentId: student._id,
      date: dateOnly,
      batchType: student.batchType || 'Unknown',
      course: student.courseCategory || 'General',
      branch: student.branch || 'Main',
      timeSlot: 'Self',
      status: 'Present',
      remarks: `Self check-in from ${matchedLocation} (${distance}m away)`,
      markedBy: req.user.id,
      location: {
        latitude,
        longitude,
        branchName: matchedLocation,
        distance: distance
      }
    });

    await attendance.populate('studentId', 'fullName admissionNumber');

    res.status(201).json({
      success: true,
      message: `Attendance marked successfully at ${matchedLocation}!`,
      data: attendance,
      locationInfo: {
        branch: matchedLocation,
        distance: distance
      }
    });
  } catch (error) {
    console.error('Self attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


module.exports = {
  markAttendance,
  markBatchAttendance,
  getAllAttendance,
  getStudentAttendance,
  getAttendanceByDate,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
  getBatchAttendance,
  markSelfAttendance
};
