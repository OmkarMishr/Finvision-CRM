const express = require('express');
const {createBackup,restoreBackup,getDashboardStats,getSystemInfo} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and admin-only
router.use(protect);
router.use(authorize('admin'));

// Backup & Restore routes
router.get('/backup', createBackup);
router.post('/restore', restoreBackup);

// Dashboard statistics
router.get('/dashboard-stats', getDashboardStats);

// System information
router.get('/system-info', getSystemInfo);

module.exports = router;
