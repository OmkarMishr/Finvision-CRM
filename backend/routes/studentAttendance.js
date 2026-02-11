const express = require('express');
const router = express.Router();
const {markSelfAttendance,markAttendance,markBatchAttendance,getAllAttendance,getStudentAttendance,getAttendanceByDate,updateAttendance,deleteAttendance,getAttendanceStats,getBatchAttendance} = require('../controllers/studentAttendanceController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats/overview', protect, authorize('admin', 'staff'), getAttendanceStats);
router.post('/mark-self', protect, authorize('student'), markSelfAttendance);
router.post('/mark', protect, authorize('admin', 'staff'), markAttendance);
router.post('/mark-batch', protect, authorize('admin', 'staff'), markBatchAttendance);
router.get('/', protect, authorize('admin', 'staff'), getAllAttendance);
router.get('/student/:studentId', protect, getStudentAttendance);
router.get('/date/:date', protect, authorize('admin', 'staff'), getAttendanceByDate);
router.get('/batch/:batchId', protect, authorize('admin', 'staff'), getBatchAttendance);
router.put('/:id', protect, authorize('admin', 'staff'), updateAttendance);
router.delete('/:id', protect, authorize('admin'), deleteAttendance);

module.exports = router;
