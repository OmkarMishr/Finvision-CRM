const express = require('express');
const router = express.Router();
const {getMyProfile,getStudentStats,convertFromLead,getAllStudents,getStudentById,updateStudent,convertToPaid,addNote,updateStatus,deleteStudent} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');


router.get('/my-profile', protect, getMyProfile);
router.get('/stats/overview', protect, getStudentStats);
router.post('/convert-from-lead/:leadId', protect, convertFromLead);
router.get('/', protect, getAllStudents);
router.get('/:id', protect, getStudentById);
router.put('/:id', protect, updateStudent);
router.put('/:id/convert-to-paid', protect, convertToPaid);
router.post('/:id/notes', protect, addNote);
router.put('/:id/status', protect, updateStatus);
router.delete('/:id', protect, authorize('admin'), deleteStudent);

module.exports = router;
