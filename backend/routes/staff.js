const express = require('express')
const router  = express.Router()
const {
  getAllStaff,
  createStaff,
  getStaffStats,
  getStaffById,
  updateStaff,
  deleteStaff,
  updateStaffStatus,
  resetStaffPassword
} = require('../controllers/staffController')

const { protect, authorize } = require('../middleware/auth')

router.get('/stats/overview', protect, authorize('admin'), getStaffStats)
router.get('/',  protect, authorize('admin'),          getAllStaff)
router.post('/', protect, authorize('admin'),          createStaff)

router.get('/:id',    protect, authorize('admin'),     getStaffById)
router.put('/:id',    protect, authorize('admin'),     updateStaff)
router.delete('/:id', protect, authorize('admin'),     deleteStaff)

router.patch('/:id/status',         protect, authorize('admin'), updateStaffStatus)
router.patch('/:id/reset-password', protect, authorize('admin'), resetStaffPassword)

module.exports = router
