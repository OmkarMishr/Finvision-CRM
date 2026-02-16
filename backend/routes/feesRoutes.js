const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPendingFees,
  getPaymentHistory,
  validateCoupon,
  collectPayment,
  generateReceipt,
  getFeeStatistics,
  getAllPayments
} = require('../controllers/feesController');

// Student routes
router.get('/pending/:studentId', protect, getPendingFees);
router.get('/history/:studentId', protect, getPaymentHistory);
router.get('/receipt/:paymentId', protect, generateReceipt);

// Coupon validation (student + admin)
router.post('/coupons/validate', protect, validateCoupon);

// Payment collection (admin, staff)
router.post('/collect', protect, collectPayment);

// Admin routes
router.get('/statistics', protect, authorize('admin'), getFeeStatistics);
router.get('/', protect, authorize('admin', 'staff'), getAllPayments);

module.exports = router;
