const express = require('express');
const router = express.Router();
const {
  getAllLeads,
  getLeadsFromSheet,
  createLead,
  updateLeadStage,
  addRemark,
  assignCounselor,
  getLeadStats,
  getLeadById,
  deleteLead,
  importSheetLeadsToMongo,
  assignTelecaller,
  sendBulkWhatsapp,
} = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats/overview', protect, getLeadStats);
router.get('/from-sheet', protect, getLeadsFromSheet);
router.get('/', protect, getAllLeads);
router.post('/import-sheet', protect, importSheetLeadsToMongo);
router.post('/', protect, createLead);

// Bulk WhatsApp — admin and staff both allowed; controller scopes by role.
router.post('/bulk-whatsapp', protect, authorize('admin', 'staff'), sendBulkWhatsapp);

router.get('/:id', protect, getLeadById);
router.put('/:id/stage', protect, updateLeadStage);
router.post('/:id/remarks', protect, addRemark);
router.put('/:id/assign-telecaller', protect, assignTelecaller);
router.put('/:id/assign-counselor', protect, assignCounselor);
router.delete('/:id', protect, deleteLead);

module.exports = router;
