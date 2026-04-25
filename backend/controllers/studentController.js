const Student = require('../models/Student');
const Lead = require('../models/Lead');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Single consistent multer config — removed studentProfileUpload import conflict
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'profiles');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'student-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only image files are allowed!'));
  }
});

// ✅ Helper: get user ID safely from req.user (handles both .id and .userId)
const getUserId = (req) => req.user.userId || req.user.id || req.user._id;

// @desc    Get current student's profile
// @route   GET /api/students/my-profile
// @access  Private (Student only)
const getMyProfile = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can access this endpoint' });
    }

    const userId = getUserId(req);
    const student = await Student.findOne({ userId })
      .populate('assignedCounselor', 'firstName lastName email phone')
      .populate('convertedFromLead')
      .populate('notes.addedBy', 'firstName lastName');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found. Please contact administration.'
      });
    }

    res.json({ success: true, student });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update student profile (editable fields only)
// @route   PUT /api/students/update-profile
// @access  Private (Student only)
const updateMyProfile = async (req, res) => {
  try {
    const { fullName, mobile, email, age, city, education, occupation, gender, dob, fatherName } = req.body

    const userId = getUserId(req) 

    const student = await Student.findOneAndUpdate(
      { userId },              
      {
        $set: {
          ...(fullName    && { fullName }),
          ...(mobile      && { mobile }),
          ...(email       && { email }),
          ...(age         && { age }),
          ...(city        && { city }),
          ...(education   && { education }),
          ...(occupation  && { occupation }),
          ...(gender      && { gender }),
          ...(dob         && { dob }),
          ...(fatherName  && { fatherName }), 
        }
      },
      { new: true, runValidators: false }
    )

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' })
    }

    res.json({ success: true, student })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Upload profile photo
// @route   POST /api/students/upload-photo
// @access  Private (Student only)
const uploadProfilePhoto = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can access this endpoint' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = getUserId(req); // ✅ Fixed
    const student = await Student.findOne({ userId });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // ✅ Delete old photo file if it exists
    if (student.profilePhoto) {
      const oldPath = path.join(__dirname, '..', student.profilePhoto);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

   const newPhotoUrl = `/uploads/profiles/${req.file.filename}`;
await Student.findByIdAndUpdate(student._id, { profilePhoto: newPhotoUrl });
res.json({ success: true, message: 'Profile photo uploaded successfully', photoUrl: newPhotoUrl });

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      photoUrl: student.profilePhoto
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload photo', error: error.message });
  }
};

// @desc    Remove profile photo
// @route   DELETE /api/students/remove-photo
// @access  Private (Student only)
const removeProfilePhoto = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can access this endpoint' });
    }

    const userId = getUserId(req);
    const student = await Student.findOne({ userId });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // ✅ Delete file from disk
    if (student.profilePhoto) {
      const filePath = path.join(__dirname, '..', student.profilePhoto);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Student.findByIdAndUpdate(student._id, { profilePhoto: null });

    res.json({ success: true, message: 'Profile photo removed successfully' });
  } catch (error) {
    console.error('Remove photo error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove photo', error: error.message });
  }
};

// @desc    Get student statistics
// @route   GET /api/students/stats/overview
// @access  Private
const getStudentStats = async (req, res) => {
  try {
    let matchQuery = {};

    if (req.user.role === 'staff' && req.user.staffRole === 'counselor') {
      matchQuery.assignedCounselor = getUserId(req);
    }

    const totalStudents = await Student.countDocuments(matchQuery);

    if (totalStudents === 0) {
      return res.json({
        success: true,
        data: {
          totalStudents: 0,
          byStatus: {},
          byBatchType: {},
          byCourse: {},
          totalPending: 0,
          totalCollected: 0,
          averageAttendance: 0
        }
      });
    }

    const stats = await Student.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byBatchType: [{ $group: { _id: '$batchType', count: { $sum: 1 } } }],
          byCourse: [{ $group: { _id: '$courseCategory', count: { $sum: 1 } } }],
          totalPending: [{ $group: { _id: null, total: { $sum: '$pendingFees' } } }],
          totalCollected: [{ $group: { _id: null, total: { $sum: '$paidFees' } } }],
          averageAttendance: [{ $group: { _id: null, avg: { $avg: '$attendancePercentage' } } }]
        }
      }
    ]);

    const toObject = (arr) => arr.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {});

    res.json({
      success: true,
      data: {
        totalStudents,
        byStatus: toObject(stats[0].byStatus),
        byBatchType: toObject(stats[0].byBatchType),
        byCourse: toObject(stats[0].byCourse),
        totalPending: stats[0].totalPending[0]?.total || 0,
        totalCollected: stats[0].totalCollected[0]?.total || 0,
        averageAttendance: stats[0].averageAttendance[0]?.avg || 0
      }
    });
  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Convert lead to student
// @route   POST /api/students/convert-from-lead/:leadId
// @access  Private
const convertFromLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const existingStudent = await Student.findOne({ convertedFromLead: lead._id });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Lead already converted to student', student: existingStudent });
    }

    const year = new Date().getFullYear();
    const count = await Student.countDocuments();
    const admissionNumber = `FV${year}${String(count + 1).padStart(4, '0')}`;

    const Course = require('../models/Course');
    let courseId = req.body.courseId;

    if (!courseId) {
      const courseCategory = req.body.courseCategory || lead.courseCategory || 'Basic';
      let course = await Course.findOne({ courseCategory, isActive: true });

      if (!course) {
        const defaultFees = { 'Basic': 15000, 'Advanced': 25000, 'Basic + Advanced': 35000, 'Advisory': 10000 };
        course = await Course.create({
          courseCategory,
          fee: defaultFees[courseCategory] || 15000,
          duration: 3,
          description: `${courseCategory} Trading Course`,
          isActive: true
        });
      }
      courseId = course._id;
    }

    let userAccount = null;
    if (lead.email) userAccount = await User.findOne({ email: lead.email });

    if (!userAccount && lead.email) {
      const namePart = lead.fullName.replace(/\s+/g, '').substring(0, 4).toLowerCase();
      const mobilePart = lead.mobile.slice(-4);
      const tempPassword = `${namePart}${mobilePart}`;
      const nameParts = lead.fullName.trim().split(' ');

      userAccount = await User.create({
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || nameParts[0],
        email: lead.email,
        password: tempPassword,
        role: 'student',
        phone: lead.mobile,
        isActive: true
      });
    }

    const student = await Student.create({
      admissionNumber,
      fullName: lead.fullName,
      mobile: lead.mobile,
      email: lead.email,
      age: lead.age,
      education: lead.education,
      city: lead.city,
      occupation: lead.occupation,
      batchSection: lead.batchSection,
      batchType: lead.batchType,
      courseCategory: lead.courseCategory,
      courseId,
      leadSource: lead.leadSource,
      convertedFromLead: lead._id,
      conversionDate: new Date(),
      assignedCounselor: lead.assignedCounselor,
      branch: lead.branch || 'Main',
      createdBy: getUserId(req),
      userId: userAccount?._id || null,
      ...req.body
    });

    lead.stage = 'Admission';
    lead.status = 'Converted';
    lead.admissionDate = new Date();
    await lead.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('assignedCounselor', 'firstName lastName email')
      .populate('userId', 'firstName lastName email')
      .populate('courseId', 'courseCategory fee duration');

    const response = { success: true, message: 'Lead converted to student successfully', student: populatedStudent };

    if (userAccount) {
      const namePart = lead.fullName.replace(/\s+/g, '').substring(0, 4).toLowerCase();
      const mobilePart = lead.mobile.slice(-4);
      response.userAccount = {
        email: userAccount.email,
        tempPassword: `${namePart}${mobilePart}`,
        message: 'User account created. Please share these credentials with the student.'
      };
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Convert lead error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private
const getAllStudents = async (req, res) => {
  try {
    const { status, batchType, courseCategory, search, branch } = req.query;
    let query = {};

    if (req.user.role === 'staff' && req.user.staffRole === 'counselor') {
      query.assignedCounselor = getUserId(req);
    }

    if (status) query.status = status;
    if (batchType) query.batchType = batchType;
    if (courseCategory) query.courseCategory = courseCategory;
    if (branch) query.branch = branch;

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { admissionNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .populate('assignedCounselor', 'firstName lastName email')
      .populate('userId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, students, count: students.length });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('assignedCounselor', 'firstName lastName email phone')
      .populate('userId', 'firstName lastName email')
      .populate('convertedFromLead')
      .populate('notes.addedBy', 'firstName lastName');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, student });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: 'Student updated successfully', student });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Convert Free to Paid batch
// @route   PUT /api/students/:id/convert-to-paid
// @access  Private
const convertToPaid = async (req, res) => {
  try {
    const { totalFees } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (student.batchType === 'Paid') return res.status(400).json({ success: false, message: 'Student is already in paid batch' });

    await Student.findByIdAndUpdate(student._id, {
      batchType: 'Paid',
      totalFees,
      pendingFees: totalFees - (student.paidFees || 0)
    });

    res.json({ success: true, message: 'Student converted to paid batch successfully', student });
  } catch (error) {
    console.error('Convert to paid error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Add note to student
// @route   POST /api/students/:id/notes
// @access  Private
const addNote = async (req, res) => {
  try {
    const { note } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    await Student.findByIdAndUpdate(student._id, {
      $push: { notes: { note, addedBy: getUserId(req), addedAt: new Date() } }
    });

    const populated = await Student.findById(student._id).populate('notes.addedBy', 'firstName lastName');
    res.json({ success: true, message: 'Note added successfully', student: populated });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update student status
// @route   PUT /api/students/:id/status
// @access  Private
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

   await Student.findByIdAndUpdate(student._id, { status });
    res.json({ success: true, message: 'Student status updated', student });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete student (soft delete)
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    student.status = 'Inactive';
    await student.save();
    res.json({ success: true, message: 'Student deactivated successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  upload,
  getStudentStats,
  convertFromLead,
  getAllStudents,
  getStudentById,
  updateStudent,
  convertToPaid,
  addNote,
  updateStatus,
  deleteStudent
};