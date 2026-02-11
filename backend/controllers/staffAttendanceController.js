const StaffAttendance = require('../models/StaffAttendance');
const User = require('../models/User');

// Haversine formula to calculate distance
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

// Check if location is within allowed premises
function validateLocation(latitude, longitude) {
    const allowedLocations = [
        {
          name: 'Development-office CCET',
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
    // Add more branches here
  ];

  for (const location of allowedLocations) {
    const distance = calculateDistance(
      latitude,
      longitude,
      location.lat,
      location.lng
    );

    if (distance <= location.radius) {
      return {
        valid: true,
        branchName: location.name,
        distance: Math.round(distance)
      };
    }
  }

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

  return {
    valid: false,
    branchName: nearestBranch.name,
    distance: distanceToNearest
  };
}

// @desc    Check-in (Mark attendance for staff)
// @route   POST /api/staff-attendance/check-in
// @access  Private (Staff)
const checkIn = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Validate location is provided
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location permission required to check in'
      });
    }

    // Validate location is within allowed premises
    const locationCheck = validateLocation(latitude, longitude);

    if (!locationCheck.valid) {
      return res.status(403).json({
        success: false,
        message: `You must be at the institute premises to check in. You are ${locationCheck.distance}m away from ${locationCheck.branchName}.`
      });
    }

    const today = new Date();
    const dateOnly = new Date(today.setHours(0, 0, 0, 0));

    // Check if already checked in today
    const existing = await StaffAttendance.findOne({
      userId: req.user.id,
      date: dateOnly
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.checkOutTime 
          ? 'You have already completed attendance for today'
          : 'You have already checked in today. Please check out first.'
      });
    }

    // Calculate if late (assuming office starts at 9:00 AM)
    const checkInTime = new Date();
    const expectedTime = new Date(dateOnly);
    expectedTime.setHours(9, 0, 0, 0); // 9:00 AM

    const isLate = checkInTime > expectedTime;
    const lateByMinutes = isLate 
      ? Math.round((checkInTime - expectedTime) / (1000 * 60))
      : 0;

    const attendance = await StaffAttendance.create({
      userId: req.user.id,
      date: dateOnly,
      checkInTime: checkInTime,
      status: isLate ? 'Late' : 'Present',
      isLate,
      lateByMinutes,
      branch: locationCheck.branchName.split(' - ')[0] || 'Main',
      remarks: isLate ? `Late by ${lateByMinutes} minutes` : 'On time',
      checkInLocation: {
        latitude,
        longitude,
        branchName: locationCheck.branchName,
        distance: locationCheck.distance
      }
    });

    await attendance.populate('userId', 'fullName email');

    res.status(201).json({
      success: true,
      message: isLate 
        ? `Checked in (Late by ${lateByMinutes} minutes)` 
        : 'Checked in successfully!',
      data: attendance,
      locationInfo: {
        branch: locationCheck.branchName,
        distance: locationCheck.distance
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Check-out (Complete attendance for the day)
// @route   POST /api/staff-attendance/check-out
// @access  Private (Staff)
const checkOut = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Validate location
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location permission required to check out'
      });
    }

    const locationCheck = validateLocation(latitude, longitude);

    if (!locationCheck.valid) {
      return res.status(403).json({
        success: false,
        message: `You must be at the institute premises to check out. You are ${locationCheck.distance}m away from ${locationCheck.branchName}.`
      });
    }

    const today = new Date();
    const dateOnly = new Date(today.setHours(0, 0, 0, 0));

    // Find today's check-in record
    const attendance = await StaffAttendance.findOne({
      userId: req.user.id,
      date: dateOnly,
      checkOutTime: null // Not checked out yet
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No check-in record found for today. Please check in first.'
      });
    }

    // Update check-out details
    attendance.checkOutTime = new Date();
    attendance.checkOutLocation = {
      latitude,
      longitude,
      branchName: locationCheck.branchName,
      distance: locationCheck.distance
    };

    // Calculate working hours
    const workingMs = attendance.checkOutTime - attendance.checkInTime;
    attendance.workingHours = (workingMs / (1000 * 60 * 60)).toFixed(2);

    // Determine if it's half day (less than 4 hours)
    if (attendance.workingHours < 4) {
      attendance.status = 'Half Day';
      attendance.remarks = `${attendance.remarks} | Half day (${attendance.workingHours}h worked)`;
    }

    await attendance.save();
    await attendance.populate('userId', 'fullName email');

    res.json({
      success: true,
      message: `Checked out successfully! Total working hours: ${attendance.workingHours}h`,
      data: attendance,
      locationInfo: {
        branch: locationCheck.branchName,
        distance: locationCheck.distance
      }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get my attendance records
// @route   GET /api/staff-attendance/my-attendance
// @access  Private (Staff)
const getMyAttendance = async (req, res) => {
  try {
    const { startDate, endDate, month } = req.query;

    let query = { userId: req.user.id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (month) {
      // Get records for specific month (format: 2026-02)
      const [year, monthNum] = month.split('-');
      const start = new Date(year, monthNum - 1, 1);
      const end = new Date(year, monthNum, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    const attendance = await StaffAttendance.find(query)
      .sort({ date: -1 })
      .populate('userId', 'fullName email');

    // Calculate statistics
    const total = attendance.length;
    const present = attendance.filter(a => 
      a.status === 'Present' || a.status === 'Late'
    ).length;
    const late = attendance.filter(a => a.status === 'Late').length;
    const halfDay = attendance.filter(a => a.status === 'Half Day').length;
    const totalWorkingHours = attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0);
    const avgWorkingHours = total > 0 ? (totalWorkingHours / total).toFixed(2) : 0;

    res.json({
      success: true,
      data: attendance,
      statistics: {
        totalDays: total,
        presentDays: present,
        lateDays: late,
        halfDays: halfDay,
        totalWorkingHours: totalWorkingHours.toFixed(2),
        avgWorkingHours
      }
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get today's attendance status
// @route   GET /api/staff-attendance/today
// @access  Private (Staff)
const getTodayStatus = async (req, res) => {
  try {
    const today = new Date();
    const dateOnly = new Date(today.setHours(0, 0, 0, 0));

    const attendance = await StaffAttendance.findOne({
      userId: req.user.id,
      date: dateOnly
    }).populate('userId', 'fullName email');

    if (!attendance) {
      return res.json({
        success: true,
        data: null,
        status: 'not_checked_in',
        message: 'You have not checked in today'
      });
    }

    const status = attendance.checkOutTime 
      ? 'completed' 
      : 'checked_in';

    res.json({
      success: true,
      data: attendance,
      status,
      message: status === 'completed' 
        ? 'Attendance completed for today'
        : 'You are currently checked in'
    });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all staff attendance (Admin only)
// @route   GET /api/staff-attendance
// @access  Private (Admin)
const getAllStaffAttendance = async (req, res) => {
  try {
    const { date, startDate, endDate, userId, status } = req.query;

    let query = {};

    if (userId) query.userId = userId;
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

    const attendance = await StaffAttendance.find(query)
      .populate('userId', 'fullName email role staffRole')
      .sort({ date: -1, checkInTime: -1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('Get all staff attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get staff attendance statistics (Admin)
// @route   GET /api/staff-attendance/stats/overview
// @access  Private (Admin)
const getStaffAttendanceStats = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    let matchQuery = {};

    if (userId) matchQuery.userId = userId;

    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await StaffAttendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalDays = await StaffAttendance.countDocuments(matchQuery);

    const formattedStats = {
      totalDays,
      present: stats.find(s => s._id === 'Present')?.count || 0,
      late: stats.find(s => s._id === 'Late')?.count || 0,
      halfDay: stats.find(s => s._id === 'Half Day')?.count || 0,
      leave: stats.find(s => s._id === 'Leave')?.count || 0
    };

    // Calculate average working hours
    const workingHoursData = await StaffAttendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          avgHours: { $avg: '$workingHours' },
          totalHours: { $sum: '$workingHours' }
        }
      }
    ]);

    if (workingHoursData.length > 0) {
      formattedStats.avgWorkingHours = workingHoursData[0].avgHours?.toFixed(2) || 0;
      formattedStats.totalWorkingHours = workingHoursData[0].totalHours?.toFixed(2) || 0;
    }

    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.error('Get staff attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getTodayStatus,
  getAllStaffAttendance,
  getStaffAttendanceStats
};
