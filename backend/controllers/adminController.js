const Lead = require('../models/Lead');
const Student = require('../models/Student');
const User = require('../models/User');
const StudentAttendance = require('../models/StudentAttendance');
const Batch = require('../models/Batch');

// @desc    Create and download database backup
// @route   GET /api/admin/backup
// @access  Private (Admin only)
const createBackup = async (req, res) => {
  try {
    console.log('📦 Creating backup by admin:', req.user.userId);

    // Fetch all data from all collections
    const [leads, students, users, attendance, batches] = await Promise.all([
      Lead.find().lean(),
      Student.find().lean(),
      User.find().select('-password').lean(), // Exclude passwords
      StudentAttendance.find().lean(),
      Batch.find().lean()
    ]);

    // Create backup object
    const backup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      createdBy: req.user.userId,
      data: {
        leads,
        students,
        users,
        attendance,
        batches
      },
      metadata: {
        totalLeads: leads.length,
        totalStudents: students.length,
        totalUsers: users.length,
        totalAttendance: attendance.length,
        totalBatches: batches.length
      }
    };

    console.log('✅ Backup created successfully:', {
      leads: leads.length,
      students: students.length,
      users: users.length,
      attendance: attendance.length,
      batches: batches.length
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=finvision_backup_${Date.now()}.json`);
    
    // Send backup as JSON
    res.json(backup);

  } catch (error) {
    console.error('❌ Backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
};

// @desc    Restore database from backup file
// @route   POST /api/admin/restore
// @access  Private (Admin only)
const restoreBackup = async (req, res) => {
  try {
    console.log('🔄 Restore initiated by admin:', req.user.userId);
    
    const backup = req.body;

    // Validate backup structure
    if (!backup.data || !backup.version) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup file format'
      });
    }

    // Validate backup version
    if (backup.version !== '1.0.0') {
      return res.status(400).json({
        success: false,
        message: `Unsupported backup version: ${backup.version}`
      });
    }

    const { leads, students, users, attendance, batches } = backup.data;

    console.log('📊 Backup data to restore:', {
      leads: leads?.length || 0,
      students: students?.length || 0,
      users: users?.length || 0,
      attendance: attendance?.length || 0,
      batches: batches?.length || 0
    });

    // Clear existing data (DANGEROUS - use with caution)
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Lead.deleteMany({}),
      Student.deleteMany({}),
      StudentAttendance.deleteMany({}),
      Batch.deleteMany({})
      // Note: We're NOT deleting users to prevent admin lockout
    ]);

    // Restore data
    console.log('💾 Restoring data...');
    const results = await Promise.all([
      leads && leads.length > 0 ? Lead.insertMany(leads) : Promise.resolve([]),
      students && students.length > 0 ? Student.insertMany(students) : Promise.resolve([]),
      attendance && attendance.length > 0 ? StudentAttendance.insertMany(attendance) : Promise.resolve([]),
      batches && batches.length > 0 ? Batch.insertMany(batches) : Promise.resolve([])
    ]);

    const restored = {
      leads: results[0].length,
      students: results[1].length,
      attendance: results[2].length,
      batches: results[3].length
    };

    console.log('✅ Restore completed successfully:', restored);

    res.json({
      success: true,
      message: 'Database restored successfully',
      restored,
      restoredFrom: backup.timestamp,
      restoredBy: req.user.userId
    });

  } catch (error) {
    console.error('❌ Restore error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error.message
    });
  }
};

// @desc    Get comprehensive dashboard statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats for admin:', req.user.userId);
    
    const { branch, startDate, endDate } = req.query;

    // Build query filters
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Branch filter
    const branchFilter = branch && branch !== 'all' ? { branch } : {};

    // Fetch all statistics in parallel
    const [
      totalLeads,
      totalStudents,
      totalUsers,
      totalAttendance,
      totalBatches,
      leadsByStage,
      studentsByStatus,
      studentsByBatchType,
      revenueData,
      attendanceToday
    ] = await Promise.all([
      Lead.countDocuments({ ...dateFilter, ...branchFilter }),
      Student.countDocuments({ ...dateFilter, ...branchFilter }),
      User.countDocuments({ role: { $ne: 'admin' } }),
      StudentAttendance.countDocuments(dateFilter),
      Batch.countDocuments(),
      
      // Lead stages aggregation
      Lead.aggregate([
        { $match: { ...dateFilter, ...branchFilter } },
        { $group: { _id: '$stage', count: { $sum: 1 } } }
      ]),
      
      // Student status aggregation
      Student.aggregate([
        { $match: { ...dateFilter, ...branchFilter } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Student batch type aggregation
      Student.aggregate([
        { $match: { ...dateFilter, ...branchFilter } },
        { $group: { _id: '$batchType', count: { $sum: 1 } } }
      ]),
      
      // Revenue aggregation
      Student.aggregate([
        { $match: { ...dateFilter, ...branchFilter } },
        {
          $group: {
            _id: null,
            totalFees: { $sum: '$totalFees' },
            paidFees: { $sum: '$paidFees' },
            pendingFees: { $sum: '$pendingFees' }
          }
        }
      ]),
      
      // Today's attendance
      StudentAttendance.aggregate([
        { 
          $match: { 
            date: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
          } 
        },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // Format lead stages
    const stages = {};
    leadsByStage.forEach(stage => {
      stages[stage._id] = stage.count;
    });

    // Format student status
    const status = {};
    studentsByStatus.forEach(s => {
      status[s._id] = s.count;
    });

    // Format student batch types
    const batchTypes = {};
    studentsByBatchType.forEach(bt => {
      batchTypes[bt._id] = bt.count;
    });

    // Format revenue
    const revenue = revenueData[0] || {
      totalFees: 0,
      paidFees: 0,
      pendingFees: 0
    };

    // Format today's attendance
    const todayAttendance = {};
    let totalPresent = 0;
    let totalAbsent = 0;
    
    attendanceToday.forEach(att => {
      todayAttendance[att._id] = att.count;
      if (att._id === 'Present' || att._id === 'Late') {
        totalPresent += att.count;
      } else if (att._id === 'Absent') {
        totalAbsent += att.count;
      }
    });

    const totalTodayRecords = totalPresent + totalAbsent;
    const attendancePercentage = totalTodayRecords > 0 
      ? ((totalPresent / totalTodayRecords) * 100).toFixed(2) 
      : 0;

    const stats = {
      leads: {
        total: totalLeads,
        byStage: {
          Enquiry: stages.Enquiry || 0,
          Counselling: stages.Counselling || 0,
          'Free Batch': stages['Free Batch'] || 0,
          'Paid Batch': stages['Paid Batch'] || 0,
          Admission: stages.Admission || 0
        },
        converted: stages.Admission || 0,
        conversionRate: totalLeads > 0 
          ? ((stages.Admission || 0) / totalLeads * 100).toFixed(2) 
          : 0
      },
      students: {
        total: totalStudents,
        byStatus: status,
        byBatchType: batchTypes,
        active: status.Active || 0,
        inactive: status.Inactive || 0,
        free: batchTypes.Free || 0,
        paid: batchTypes.Paid || 0
      },
      users: {
        total: totalUsers
      },
      attendance: {
        total: totalAttendance,
        today: {
          total: totalTodayRecords,
          present: totalPresent,
          absent: totalAbsent,
          percentage: attendancePercentage,
          byStatus: todayAttendance
        }
      },
      batches: {
        total: totalBatches
      },
      revenue: {
        total: revenue.totalFees,
        collected: revenue.paidFees,
        pending: revenue.pendingFees,
        collectionRate: revenue.totalFees > 0 
          ? ((revenue.paidFees / revenue.totalFees) * 100).toFixed(2) 
          : 0
      },
      filters: {
        branch: branch || 'all',
        startDate: startDate || null,
        endDate: endDate || null
      }
    };

    console.log('✅ Dashboard stats fetched successfully');

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// @desc    Get system health and info
// @route   GET /api/admin/system-info
// @access  Private (Admin only)
const getSystemInfo = async (req, res) => {
  try {
    console.log('🖥️  Fetching system info for admin:', req.user.userId);

    const [
      totalLeads,
      totalStudents,
      totalUsers,
      totalAttendance,
      totalBatches
    ] = await Promise.all([
      Lead.countDocuments(),
      Student.countDocuments(),
      User.countDocuments(),
      StudentAttendance.countDocuments(),
      Batch.countDocuments()
    ]);

    const systemInfo = {
      database: {
        status: 'connected',
        collections: {
          leads: totalLeads,
          students: totalStudents,
          users: totalUsers,
          attendance: totalAttendance,
          batches: totalBatches
        }
      },
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: {
          total: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB',
          used: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB'
        }
      },
      application: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    res.json({
      success: true,
      data: systemInfo
    });

  } catch (error) {
    console.error('❌ System info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system information',
      error: error.message
    });
  }
};

module.exports = {
  createBackup,
  restoreBackup,
  getDashboardStats,
  getSystemInfo
};
