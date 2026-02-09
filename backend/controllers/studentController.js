const Student = require('../models/Student');
const Lead = require('../models/Lead');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get current student's profile (for logged-in students)
// @route   GET /api/students/my-profile
// @access  Private (Student only)
const getMyProfile = async (req, res) => {
  try {
    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ 
        success: false,
        message: 'Only students can access this endpoint' 
      });
    }

    // Find student by userId
    const student = await Student.findOne({ userId: req.user.userId })
      .populate('assignedCounselor', 'firstName lastName email phone')
      .populate('convertedFromLead')
      .populate('notes.addedBy', 'firstName lastName');

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student profile not found. Please contact administration.' 
      });
    }

    res.json({ 
      success: true,
      student 
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Get student statistics
// @route   GET /api/students/stats/overview
// @access  Private
const getStudentStats = async (req, res) => {
  try {
    let matchQuery = {};
    
    if (req.user.role === 'staff' && req.user.staffRole === 'counselor') {
      matchQuery.assignedCounselor = req.user.userId;
    }

    const stats = await Student.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byBatchType: [
            { $group: { _id: '$batchType', count: { $sum: 1 } } }
          ],
          byCourse: [
            { $group: { _id: '$courseCategory', count: { $sum: 1 } } }
          ],
          totalPending: [
            { $group: { _id: null, total: { $sum: '$pendingFees' } } }
          ],
          totalCollected: [
            { $group: { _id: null, total: { $sum: '$paidFees' } } }
          ],
          averageAttendance: [
            { $group: { _id: null, avg: { $avg: '$attendancePercentage' } } }
          ]
        }
      }
    ]);

    res.json({ 
      success: true,
      stats: stats[0] 
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Convert lead to student
// @route   POST /api/students/convert-from-lead/:leadId
// @access  Private
const convertFromLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.leadId);
    
    if (!lead) {
      return res.status(404).json({ 
        success: false,
        message: 'Lead not found' 
      });
    }

    // Check if already converted
    const existingStudent = await Student.findOne({ convertedFromLead: lead._id });
    if (existingStudent) {
      return res.status(400).json({ 
        success: false,
        message: 'Lead already converted to student',
        student: existingStudent
      });
    }

    // Generate admission number manually
    const year = new Date().getFullYear();
    const count = await Student.countDocuments();
    const admissionNumber = `FV${year}${String(count + 1).padStart(4, '0')}`;

    // Check if user account already exists with this email
    let userAccount = null;
    if (lead.email) {
      userAccount = await User.findOne({ email: lead.email });
    }

    // If no user account exists, create one
    if (!userAccount && lead.email) {
      // Generate a temporary password (first 4 letters of name + last 4 digits of mobile)
      const namePart = lead.fullName.replace(/\s+/g, '').substring(0, 4).toLowerCase();
      const mobilePart = lead.mobile.slice(-4);
      const tempPassword = `${namePart}${mobilePart}`;

      // Split full name into first and last name
      const nameParts = lead.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;

      // Create user account
      userAccount = await User.create({
        firstName,
        lastName,
        email: lead.email,
        password: tempPassword,
        role: 'student',
        phone: lead.mobile,
        isActive: true
      });

      console.log(`User account created for student. Email: ${lead.email}, Temp Password: ${tempPassword}`);
    }

    // Create student from lead data
    const studentData = {
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
      leadSource: lead.leadSource,
      convertedFromLead: lead._id,
      conversionDate: new Date(),
      assignedCounselor: lead.assignedCounselor,
      branch: lead.branch || 'Main',
      createdBy: req.user.userId,
      userId: userAccount ? userAccount._id : null, // Link to user account
      ...req.body
    };

    const student = await Student.create(studentData);

    // Update lead status
    lead.stage = 'Admission';
    lead.status = 'Converted';
    lead.admissionDate = new Date();
    await lead.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('assignedCounselor', 'firstName lastName email')
      .populate('userId', 'firstName lastName email');

    // Prepare response with login credentials if new user was created
    const response = {
      success: true,
      message: 'Lead converted to student successfully',
      student: populatedStudent
    };

    // If new user account was created, include login credentials
    if (userAccount && !existingStudent) {
      const namePart = lead.fullName.replace(/\s+/g, '').substring(0, 4).toLowerCase();
      const mobilePart = lead.mobile.slice(-4);
      const tempPassword = `${namePart}${mobilePart}`;
      
      response.userAccount = {
        email: userAccount.email,
        tempPassword: tempPassword,
        message: 'User account created. Please share these credentials with the student.'
      };
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Convert lead error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Get all students with filters
// @route   GET /api/students
// @access  Private
const getAllStudents = async (req, res) => {
  try {
    const { status, batchType, courseCategory, search, branch } = req.query;
    
    let query = {};

    // Role-based filtering
    if (req.user.role === 'staff' && req.user.staffRole === 'counselor') {
      query.assignedCounselor = req.user.userId;
    }

    // Apply filters
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

    res.json({ 
      success: true,
      students, 
      count: students.length 
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
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

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    res.json({ 
      success: true,
      student 
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    res.json({ 
      success: true,
      message: 'Student updated successfully', 
      student 
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Convert Free to Paid batch
// @route   PUT /api/students/:id/convert-to-paid
// @access  Private
const convertToPaid = async (req, res) => {
  try {
    const { totalFees } = req.body;
    
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    if (student.batchType === 'Paid') {
      return res.status(400).json({ 
        success: false,
        message: 'Student is already in paid batch' 
      });
    }

    student.batchType = 'Paid';
    student.totalFees = totalFees || 0;
    student.pendingFees = student.totalFees - student.paidFees;

    await student.save();

    res.json({ 
      success: true,
      message: 'Student converted to paid batch successfully', 
      student 
    });
  } catch (error) {
    console.error('Convert to paid error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Add note to student
// @route   POST /api/students/:id/notes
// @access  Private
const addNote = async (req, res) => {
  try {
    const { note } = req.body;
    
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    student.notes.push({
      note,
      addedBy: req.user.userId,
      addedAt: new Date()
    });

    await student.save();
    
    const populatedStudent = await Student.findById(student._id)
      .populate('notes.addedBy', 'firstName lastName');

    res.json({ 
      success: true,
      message: 'Note added successfully', 
      student: populatedStudent 
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Update student status
// @route   PUT /api/students/:id/status
// @access  Private
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    student.status = status;
    await student.save();

    res.json({ 
      success: true,
      message: 'Student status updated', 
      student 
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Delete student (soft delete - change status to Inactive)
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    student.status = 'Inactive';
    await student.save();

    res.json({ 
      success: true,
      message: 'Student deactivated successfully' 
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

module.exports = {
  getMyProfile,
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
