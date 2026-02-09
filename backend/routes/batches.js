const express = require('express');
const router = express.Router();
const {createBatch,getAllBatches,getBatchById,enrollStudent,removeStudent,updateBatch,deleteBatch,getBatchStats} = require('../controllers/batchController');
const { protect, authorize } = require('../middleware/auth');


router.get('/stats/overview', protect, authorize('admin', 'staff'), getBatchStats);
router.post('/', protect, authorize('admin'), createBatch);
router.get('/', protect, authorize('admin', 'staff'), getAllBatches);
router.get('/:id', protect, authorize('admin', 'staff'), getBatchById);
router.put('/:id/enroll', protect, authorize('admin', 'staff'), enrollStudent);
router.put('/:id/remove-student', protect, authorize('admin'), removeStudent);
router.put('/:id', protect, authorize('admin'), updateBatch);
router.delete('/:id', protect, authorize('admin'), deleteBatch);

module.exports = router;
