const express = require('express');
const router = express.Router();
const {
  checkCertificateEligibility,
  downloadCertificate,
  getAllCertificates
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

// Student routes
router.get('/eligibility', protect, authorize('student'), checkCertificateEligibility);
router.get('/download', protect, authorize('student'), downloadCertificate);

// Admin routes
router.get('/', protect, authorize('admin'), getAllCertificates);

module.exports = router;
