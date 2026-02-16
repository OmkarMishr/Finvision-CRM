const LiveClass = require('../models/LiveClass');
const Student = require('../models/Student');
const mongoose = require('mongoose');

// @desc    Create new live class
// @route   POST /api/live-classes
// @access  Admin/Staff
exports.createLiveClass = async (req, res) => {
  try {
    const {
      title,
      description,
      courseCategory,
      batchType,
      platform,
      meetingLink,
      meetingId,
      password,
      scheduledDate,
      startTime,
      endTime,
      duration,
      maxParticipants
    } = req.body;

    // Validation
    if (!title || !platform || !meetingLink || !scheduledDate || !startTime || !endTime || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
     // Converting string ID to ObjectId
     const instructorId = new mongoose.Types.ObjectId(req.user.id);

    const liveClass = await LiveClass.create({
      title,
      description,
      courseCategory: courseCategory || 'All',
      batchType: batchType || 'All',
      platform,
      meetingLink,
      meetingId,
      password,
      scheduledDate,
      startTime,
      endTime,
      duration,
      instructor: instructorId,           
      instructorName: req.user.name,     
      maxParticipants: maxParticipants || 100,
      createdBy: instructorId
    });

    res.status(201).json({
      success: true,
      message: 'Live class created successfully',
      liveClass
    });
  } catch (error) {
    console.error('Create live class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating live class',
      error: error.message
    });
  }
};

// @desc    Get all live classes (Admin/Staff)
// @route   GET /api/live-classes/admin
// @access  Admin/Staff
exports.getAllLiveClasses = async (req, res) => {
  try {
    const { status, courseCategory, batchType, date } = req.query;

    console.log('📥 Fetching live classes with filters:', { status, courseCategory, batchType, date });

    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (courseCategory && courseCategory !== 'All') {
      query.courseCategory = courseCategory;
    }

    if (batchType && batchType !== 'All') {
      query.batchType = batchType;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // ✅ FIX: Don't populate 'name' - populate firstName and lastName instead
    const liveClasses = await LiveClass.find(query)
      .populate('instructor', 'firstName lastName email')  // ✅ Changed from 'name email'
      .populate('createdBy', 'firstName lastName')         // ✅ Changed from 'name'
      .sort({ scheduledDate: -1, startTime: 1 })
      .lean(); // ✅ Added lean() for better performance

    // ✅ Manually add the name field after population
    const classesWithNames = liveClasses.map(cls => ({
      ...cls,
      instructor: cls.instructor ? {
        ...cls.instructor,
        name: `${cls.instructor.firstName} ${cls.instructor.lastName}`
      } : null,
      createdBy: cls.createdBy ? {
        ...cls.createdBy,
        name: `${cls.createdBy.firstName} ${cls.createdBy.lastName}`
      } : null
    }));

    console.log(`✅ Found ${classesWithNames.length} live classes`);

    res.status(200).json({
      success: true,
      count: classesWithNames.length,
      liveClasses: classesWithNames
    });
  } catch (error) {
    console.error('❌ Get live classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live classes',
      error: error.message
    });
  }
};


// @desc    Get upcoming live classes for students
// @route   GET /api/live-classes/student
// @access  Student
exports.getStudentLiveClasses = async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const now = new Date();

    // ✅ FIX: Proper query with $and for multiple $or conditions
    const query = {
      isActive: true,
      status: { $in: ['Scheduled', 'Live'] },
      $and: [
        {
          $or: [
            { courseCategory: student.courseCategory },
            { courseCategory: 'All' }
          ]
        },
        {
          $or: [
            { batchType: student.batchType },
            { batchType: 'All' }
          ]
        }
      ]
    };

    const liveClasses = await LiveClass.find(query)
      .populate('instructor', 'firstName lastName email')  // ✅ Changed from 'name email'
      .sort({ scheduledDate: 1, startTime: 1 })
      .lean();

    // ✅ Add name field manually
    const classesWithNames = liveClasses.map(cls => ({
      ...cls,
      instructor: cls.instructor ? {
        ...cls.instructor,
        name: `${cls.instructor.firstName} ${cls.instructor.lastName}`
      } : null
    }));

    // Separate upcoming and past classes
    const upcomingClasses = classesWithNames.filter(cls => new Date(cls.scheduledDate) >= now);
    const pastClasses = classesWithNames.filter(cls => new Date(cls.scheduledDate) < now);

    res.status(200).json({
      success: true,
      upcomingClasses,
      pastClasses,
      totalCount: classesWithNames.length
    });
  } catch (error) {
    console.error('Get student live classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live classes',
      error: error.message
    });
  }
};


// @desc    Get single live class
// @route   GET /api/live-classes/:id
// @access  Private
exports.getLiveClassById = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id)
      .populate('instructor', 'firstName lastName email')  
      .populate('attendees.studentId', 'fullName admissionNumber')
      .lean();

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    if (liveClass.instructor) {
      liveClass.instructor.name = `${liveClass.instructor.firstName} ${liveClass.instructor.lastName}`;
    }

    res.status(200).json({
      success: true,
      liveClass
    });
  } catch (error) {
    console.error('Get live class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live class',
      error: error.message
    });
  }
};

// @desc    Update live class
// @route   PUT /api/live-classes/:id
// @access  Admin/Staff
exports.updateLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    const updatedClass = await LiveClass.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Live class updated successfully',
      liveClass: updatedClass
    });
  } catch (error) {
    console.error('Update live class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating live class',
      error: error.message
    });
  }
};

// @desc    Delete live class
// @route   DELETE /api/live-classes/:id
// @access  Admin/Staff
exports.deleteLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    await LiveClass.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Live class deleted successfully'
    });
  } catch (error) {
    console.error('Delete live class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting live class',
      error: error.message
    });
  }
};

// @desc    Record student joining class
// @route   POST /api/live-classes/:id/join
// @access  Student
exports.joinLiveClass = async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    // Check if student already joined
    const alreadyJoined = liveClass.attendees.find(
      att => att.studentId.toString() === student._id.toString()
    );

    if (!alreadyJoined) {
      liveClass.attendees.push({
        studentId: student._id,
        joinedAt: new Date()
      });

      await liveClass.save();
    }

    res.status(200).json({
      success: true,
      message: 'Joined live class successfully',
      meetingLink: liveClass.meetingLink
    });
  } catch (error) {
    console.error('Join live class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining live class',
      error: error.message
    });
  }
};

// @desc    Get live class statistics
// @route   GET /api/live-classes/stats
// @access  Admin/Staff
exports.getLiveClassStats = async (req, res) => {
  try {
    const totalClasses = await LiveClass.countDocuments();
    const scheduledClasses = await LiveClass.countDocuments({ status: 'Scheduled' });
    const liveClasses = await LiveClass.countDocuments({ status: 'Live' });
    const completedClasses = await LiveClass.countDocuments({ status: 'Completed' });

    res.status(200).json({
      success: true,
      stats: {
        total: totalClasses,
        scheduled: scheduledClasses,
        live: liveClasses,
        completed: completedClasses
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};
