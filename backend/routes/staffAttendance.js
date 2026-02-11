const express = require('express');
const router = express.Router();
const {checkIn,checkOut,getMyAttendance,getTodayStatus,getAllStaffAttendance,getStaffAttendanceStats} = require('../controllers/staffAttendanceController');
const { protect, authorize } = require('../middleware/auth');

// Staff routes (self-attendance)
router.post('/check-in', protect, authorize('staff'), checkIn);
router.post('/check-out', protect, authorize('staff'), checkOut);
router.get('/my-attendance', protect, authorize('staff'), getMyAttendance);
router.get('/today', protect, authorize('staff'), getTodayStatus);

// Admin routes (view all staff attendance)
router.get('/stats/overview', protect, authorize('admin'), getStaffAttendanceStats);
router.get('/', protect, authorize('admin'), getAllStaffAttendance);

module.exports = router;
