const express = require('express');
const router = express.Router();
const {
  createLiveClass,
  getAllLiveClasses,
  getStudentLiveClasses,
  getLiveClassById,
  updateLiveClass,
  deleteLiveClass,
  joinLiveClass,
  getLiveClassStats
} = require('../controllers/liveClassController');
const { protect, authorize } = require('../middleware/auth');

// Admin/Staff routes
router.post('/', protect, authorize('admin', 'staff'), createLiveClass);
router.get('/admin', protect, authorize('admin', 'staff'), getAllLiveClasses);
router.get('/stats', protect, authorize('admin', 'staff'), getLiveClassStats);

// Student routes
router.get('/student', protect, authorize('student'), getStudentLiveClasses);
router.post('/:id/join', protect, authorize('student'), joinLiveClass);

// Common routes
router.get('/:id', protect, getLiveClassById);
router.put('/:id', protect, authorize('admin', 'staff'), updateLiveClass);
router.delete('/:id', protect, authorize('admin', 'staff'), deleteLiveClass);

module.exports = router;
