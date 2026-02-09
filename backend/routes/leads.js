const express = require('express');
const router = express.Router();
const {getAllLeads,createLead,updateLeadStage,addRemark,assignCounselor,getLeadStats} = require('../controllers/leadController');
const { protect } = require('../middleware/auth');

router.get('/stats/overview', protect, getLeadStats);
router.get('/', protect, getAllLeads);
router.post('/', protect, createLead);
router.put('/:id/stage', protect, updateLeadStage);
router.post('/:id/remarks', protect, addRemark);
router.put('/:id/assign-counselor', protect, assignCounselor);

module.exports = router;
