const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/batches
// @desc    Create new batch
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const batch = await Batch.create(req.body);

    res.status(201).json({
      success: true,
      data: batch
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/batches
// @desc    Get all batches with filters
// @access  Private (Admin, Staff)
router.get('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { batchType, course, branch, status } = req.query;

    let query = {};
    if (batchType) query.batchType = batchType;
    if (course) query.course = course;
    if (branch) query.branch = branch;
    if (status) query.status = status;

    const batches = await Batch.find(query)
      .populate('enrolledStudents', 'fullName admissionNumber email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: batches.length,
      data: batches
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/batches/:id
// @desc    Get single batch
// @access  Private (Admin, Staff)
router.get('/:id', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('enrolledStudents', 'fullName admissionNumber email mobile course');

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/batches/:id/enroll
// @desc    Enroll student in batch
// @access  Private (Admin, Staff)
router.put('/:id/enroll', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { studentId } = req.body;

    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Check if already enrolled
    if (batch.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ message: 'Student already enrolled in this batch' });
    }

    // Check max capacity
    if (batch.enrolledStudents.length >= batch.maxStudents) {
      return res.status(400).json({ message: 'Batch is full' });
    }

    batch.enrolledStudents.push(studentId);
    await batch.save();

    await batch.populate('enrolledStudents', 'fullName admissionNumber');

    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/batches/:id/remove-student
// @desc    Remove student from batch
// @access  Private (Admin only)
router.put('/:id/remove-student', protect, authorize('admin'), async (req, res) => {
  try {
    const { studentId } = req.body;

    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    batch.enrolledStudents = batch.enrolledStudents.filter(
      id => id.toString() !== studentId
    );
    
    await batch.save();

    await batch.populate('enrolledStudents', 'fullName admissionNumber');

    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/batches/:id
// @desc    Update batch
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/batches/:id
// @desc    Delete batch
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    await batch.deleteOne();

    res.json({
      success: true,
      message: 'Batch deleted'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/batches/stats/overview
// @desc    Get batch statistics
// @access  Private (Admin, Staff)
router.get('/stats/overview', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const totalBatches = await Batch.countDocuments();
    const activeBatches = await Batch.countDocuments({ status: 'Active' });
    const freeBatches = await Batch.countDocuments({ batchType: 'Free' });
    const paidBatches = await Batch.countDocuments({ batchType: 'Paid' });

    const batches = await Batch.find();
    const totalStudentsEnrolled = batches.reduce((sum, batch) => sum + batch.enrolledStudents.length, 0);

    res.json({
      success: true,
      data: {
        totalBatches,
        activeBatches,
        freeBatches,
        paidBatches,
        totalStudentsEnrolled
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
