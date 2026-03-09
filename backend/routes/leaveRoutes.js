const express     = require('express')
const router      = express.Router()
const leaveCtrl   = require('../controllers/leaveController')
const { protect, authorize } = require('../middleware/auth')

// ══════════════════════════════════════════════════════════════════════════════
//  STAFF ROUTES
// ══════════════════════════════════════════════════════════════════════════════
router.post  ('/apply',      protect, authorize('staff'),         leaveCtrl.applyLeave)
router.get   ('/my-history', protect, authorize('staff'),         leaveCtrl.getMyHistory)
router.get   ('/balance',    protect, authorize('staff'),         leaveCtrl.getMyBalance)
router.patch ('/cancel/:id', protect, authorize('staff'),         leaveCtrl.cancelLeave)

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ══════════════════════════════════════════════════════════════════════════════
router.get   ('/admin/all',        protect, authorize('admin'),   leaveCtrl.getAllLeaves)
router.get   ('/admin/pending',    protect, authorize('admin'),   leaveCtrl.getPendingLeaves)
router.get   ('/admin/stats',      protect, authorize('admin'),   leaveCtrl.getLeaveStats)
router.patch ('/admin/:id/review', protect, authorize('admin'),   leaveCtrl.reviewLeave)
router.delete('/admin/:id',        protect, authorize('admin'),   leaveCtrl.deleteLeave)

module.exports = router
