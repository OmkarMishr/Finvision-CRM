const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { validationResult } = require('express-validator')

// Generate JWT Token
const generateToken = (userId, role, staffRole = null) => {
  return jwt.sign(
    { 
      userId: userId.toString(),
      id: userId.toString(),
      role,
      staffRole
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  )
}

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    console.log('📝 Register attempt:', req.body.email)

    // Validation
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { email, password, firstName, lastName, role, staffRole, phone, branch } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      })
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = new User({
      email: email.toLowerCase().trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: role || 'student',
      staffRole: role === 'staff' ? (staffRole || 'telecaller') : null,
      phone: phone || null,
      branch: branch || 'Main'
    })

    // Save user (triggers pre-save hook for password hashing)
    await user.save()
    
    console.log('✅ User registered:', user.email, 'Role:', user.role, 'StaffRole:', user.staffRole)

    // Generate JWT token with userId
    const token = generateToken(user._id, user.role, user.staffRole)

    // Return user data WITHOUT password
    const safeUser = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      staffRole: user.staffRole,
      phone: user.phone,
      branch: user.branch,
      isActive: user.isActive,
      avatar: user.avatar
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: safeUser
    })

  } catch (error) {
    console.error('❌ Register Error:', error.message)
    
    // MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    console.log('🔐 Login attempt:', email)

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      })
    }

    // Find user by email (include password field)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')
    
    if (!user) {
      console.log('❌ User not found:', email)
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      })
    }

    // Check if password exists
    if (!user.password) {
      console.error('⚠️  User has no password:', email)
      return res.status(500).json({ 
        success: false,
        message: 'Account configuration error. Please contact administrator.' 
      })
    }

    // Verify password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password)
    
    if (!isMatch) {
      console.log('❌ Invalid password for:', email)
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      })
    }

    // Check if user is active
    if (user.isActive === false) {
      console.log('⚠️  Account deactivated:', email)
      return res.status(403).json({ 
        success: false,
        message: 'Account has been deactivated. Please contact administrator.' 
      })
    }

    // Generate JWT token with userId
    const token = generateToken(user._id, user.role, user.staffRole)

    // Prepare safe user data (without password)
    const safeUser = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      staffRole: user.staffRole,
      phone: user.phone,
      branch: user.branch,
      avatar: user.avatar
    }

    // Send response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser
    })

    console.log('✅ Login successful:', email, `(${user.role}${user.staffRole ? ' - ' + user.staffRole : ''})`)

  } catch (error) {
    console.error('❌ Login Error:', error.message)
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    })
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/profile  
// @access  Private
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id

    console.log('👤 Profile request for user:', userId)

    const user = await User.findById(userId).select('-password')
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Format user data
    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      staffRole: user.staffRole,
      phone: user.phone,
      branch: user.branch,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }

    res.json({
      success: true,
      user: userData
    })

  } catch (error) {
    console.error('❌ Profile Error:', error.message)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// @desc    Dashboard stats (role-based)
// @route   GET /api/auth/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const { role, staffRole } = req.user

    console.log('📊 Dashboard stats for:', role, staffRole || '')

    let stats = {}

    if (role === 'admin') {
      // Admin dashboard statistics
      const totalUsers = await User.countDocuments()
      const totalStaff = await User.countDocuments({ role: 'staff', isActive: true })
      const totalStudents = await User.countDocuments({ role: 'student', isActive: true })
      const activeUsers = await User.countDocuments({ isActive: true })
      const inactiveUsers = await User.countDocuments({ isActive: false })

      // Get Lead stats if Lead model exists
      try {
        const Lead = require('../models/Lead')
        const totalLeads = await Lead.countDocuments()
        const enquiryLeads = await Lead.countDocuments({ stage: 'Enquiry' })
        const counsellingLeads = await Lead.countDocuments({ stage: 'Counselling' })
        const freeLeads = await Lead.countDocuments({ batchType: 'Free' })
        const paidLeads = await Lead.countDocuments({ batchType: 'Paid' })
        const convertedLeads = await Lead.countDocuments({ convertedToPaid: true })
        
        // Calculate total revenue
        const revenueResult = await Lead.aggregate([
          { $group: { _id: null, totalRevenue: { $sum: '$actualRevenue' } } }
        ])
        const totalRevenue = revenueResult[0]?.totalRevenue || 0

        stats = {
          users: {
            totalUsers,
            totalStaff,
            totalStudents,
            activeUsers,
            inactiveUsers
          },
          leads: {
            totalLeads,
            enquiryLeads,
            counsellingLeads,
            freeLeads,
            paidLeads,
            convertedLeads,
            conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0
          },
          revenue: {
            totalRevenue,
            formattedRevenue: `₹${totalRevenue.toLocaleString('en-IN')}`
          },
          role: 'admin'
        }
      } catch (leadError) {
        // If Lead model doesn't exist yet
        stats = {
          users: {
            totalUsers,
            totalStaff,
            totalStudents,
            activeUsers,
            inactiveUsers
          },
          role: 'admin',
          message: 'Lead statistics not available yet'
        }
      }

    } else if (role === 'staff') {
      // Staff dashboard statistics
      try {
        const Lead = require('../models/Lead')
        
        let leadQuery = {}
        if (staffRole === 'telecaller') {
          leadQuery.assignedTelecaller = userId
        } else if (staffRole === 'counselor') {
          leadQuery.assignedCounselor = userId
        }

        const totalLeads = await Lead.countDocuments(leadQuery)
        const freeLeads = await Lead.countDocuments({ ...leadQuery, batchType: 'Free' })
        const paidLeads = await Lead.countDocuments({ ...leadQuery, batchType: 'Paid' })
        const conversions = await Lead.countDocuments({ ...leadQuery, convertedToPaid: true })
        const enquiryLeads = await Lead.countDocuments({ ...leadQuery, stage: 'Enquiry' })
        const counsellingLeads = await Lead.countDocuments({ ...leadQuery, stage: 'Counselling' })

        // Calculate revenue contribution
        const revenueResult = await Lead.aggregate([
          { $match: leadQuery },
          { $group: { _id: null, totalRevenue: { $sum: '$actualRevenue' } } }
        ])
        const totalRevenue = revenueResult[0]?.totalRevenue || 0

        stats = {
          totalLeads,
          freeLeads,
          paidLeads,
          conversions,
          enquiryLeads,
          counsellingLeads,
          conversionRate: totalLeads > 0 ? Math.round((conversions / totalLeads) * 100) : 0,
          totalRevenue,
          formattedRevenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
          role: 'staff',
          staffRole
        }
      } catch (leadError) {
        stats = {
          totalLeads: 0,
          freeLeads: 0,
          paidLeads: 0,
          conversions: 0,
          role: 'staff',
          staffRole,
          message: 'Lead statistics not available yet'
        }
      }

    } else if (role === 'student') {
      // Student dashboard statistics
      const user = await User.findById(userId).select('-password')
      
      stats = {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        branch: user.branch,
        role: 'student',
        // Additional student stats can be added here
        myAttendance: '0%',
        pendingFees: '₹0',
        nextClass: 'Not scheduled'
      }
    }

    res.json({
      success: true,
      stats,
      role,
      staffRole: staffRole || null,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} dashboard data loaded`
    })

  } catch (error) {
    console.error('❌ Dashboard Error:', error.message)
    res.status(500).json({
      success: false,
      message: 'Server error loading dashboard'
    })
  }
}

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  getDashboardStats
}
