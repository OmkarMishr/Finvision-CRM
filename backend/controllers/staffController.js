const User   = require('../models/User')  
const bcrypt = require('bcryptjs')

// ─── GET /api/staff ───────────────────────────────────────────────────────────
const getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' })
      .select('-password')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count:   staff.length,
      data:    staff
    })
  } catch (error) {
    console.error('getAllStaff error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff',
      error:   error.message
    })
  }
}

// ─── POST /api/staff ──────────────────────────────────────────────────────────
const createStaff = async (req, res) => {
  try {
    const {
      firstName, lastName, email, password,
      phone, staffRole, department, subject,
      salary, branch
    } = req.body

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email and password are required'
      })
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      })
    }

    // Create staff as a User with role: 'staff'
    const staff = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role:      'staff',                    
      staffRole: staffRole || 'Teacher',     // telecaller | counselor | Teacher
      isActive:  true,
      staffInfo: {
        department: department || undefined,
        subject:    subject    || undefined,
        salary:     salary     || undefined,
        joiningDate: new Date()
      }
    })

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully. They can now log in.',
      data:    staff   // password auto-excluded by toJSON method
    })
  } catch (error) {
    console.error('createStaff error:', error)

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create staff member',
      error:   error.message
    })
  }
}

// ─── GET /api/staff/stats/overview ───────────────────────────────────────────
const getStaffStats = async (req, res) => {
  try {
    const [total, active, inactive, byRole] = await Promise.all([
      User.countDocuments({ role: 'staff' }),
      User.countDocuments({ role: 'staff', isActive: true }),
      User.countDocuments({ role: 'staff', isActive: false }),
      User.aggregate([
        { $match: { role: 'staff' } },
        { $group: { _id: '$staffRole', count: { $sum: 1 } } },
        { $sort:  { count: -1 } }
      ])
    ])

    const roleBreakdown = byRole.reduce((acc, r) => {
      acc[r._id || 'unassigned'] = r.count
      return acc
    }, {})

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        inactive,
        roles: Object.keys(roleBreakdown).length,
        roleBreakdown
      }
    })
  } catch (error) {
    console.error('getStaffStats error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff stats',
      error:   error.message
    })
  }
}

// ─── GET /api/staff/:id ───────────────────────────────────────────────────────
const getStaffById = async (req, res) => {
  try {
    const staff = await User.findOne({
      _id:  req.params.id,
      role: 'staff'           
    }).select('-password')

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      })
    }

    res.status(200).json({ success: true, data: staff })
  } catch (error) {
    console.error('getStaffById error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff member',
      error:   error.message
    })
  }
}

// ─── PUT /api/staff/:id ───────────────────────────────────────────────────────
const updateStaff = async (req, res) => {
  try {
    // Prevent password + role change via this route
    const { password, role, ...updateData } = req.body

    const staff = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'staff' },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password')

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      data:    staff
    })
  } catch (error) {
    console.error('updateStaff error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update staff member',
      error:   error.message
    })
  }
}

// ─── DELETE /api/staff/:id ────────────────────────────────────────────────────
const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOneAndDelete({
      _id:  req.params.id,
      role: 'staff'
    })

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      })
    }

    res.status(200).json({
      success: true,
      message: `${staff.firstName} ${staff.lastName} has been deleted successfully`
    })
  } catch (error) {
    console.error('deleteStaff error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete staff member',
      error:   error.message
    })
  }
}

// ─── PATCH /api/staff/:id/status ─────────────────────────────────────────────
const updateStaffStatus = async (req, res) => {
  try {
    const { isActive } = req.body

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be true or false'
      })
    }

    const staff = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'staff' },
      { $set: { isActive } },
      { new: true }
    ).select('-password')

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      })
    }

    res.status(200).json({
      success: true,
      message: `Staff member ${isActive ? 'activated' : 'deactivated'} successfully`,
      data:    staff
    })
  } catch (error) {
    console.error('updateStaffStatus error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update staff status',
      error:   error.message
    })
  }
}

// ─── PATCH /api/staff/:id/reset-password ─────────────────────────────────────
const resetStaffPassword = async (req, res) => {
  try {
    const { newPassword } = req.body

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      })
    }

    // Find staff first
    const staff = await User.findOne({
      _id:  req.params.id,
      role: 'staff'
    }).select('+password')

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      })
    }

    // Update password via .save() so pre-save hook hashes it
    staff.password = newPassword
    await staff.save()

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Staff can now log in with new password.'
    })
  } catch (error) {
    console.error('resetStaffPassword error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error:   error.message
    })
  }
}

module.exports = {
  getAllStaff,
  createStaff,
  getStaffStats,
  getStaffById,
  updateStaff,
  deleteStaff,
  updateStaffStatus,
  resetStaffPassword
}
