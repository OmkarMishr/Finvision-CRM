const User = require('../models/User')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  })
}

// @desc    Register new user (FIXED: Uses .save() for password hashing)
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

    const { email, password, firstName, lastName, role, ...roleSpecificData } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      })
    }

    // ✅ FIXED: Use new User() + save() to trigger pre-save hook
    const user = new User({
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save hook
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      [`${role}Info`]: roleSpecificData
    })

    // This triggers the pre('save') password hashing hook
    await user.save()
    
    console.log('✅ User registered:', user.email, 'Role:', user.role)

    // Generate JWT token
    const token = generateToken(user._id, user.role)

    // Return user WITHOUT password
    const safeUser = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      phone: user.phone,
      profilePhoto: user.profilePhoto
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
    console.log('🔐 Login attempt:', req.body.email)

    // Validation
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { email, password } = req.body

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    
    console.log('👤 User found:', !!user)
    
    if (!user || !(await user.comparePassword(password))) {
      console.log('❌ Invalid credentials')
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact administrator.'
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT token
    const token = generateToken(user._id, user.role)

    // Safe user object
    const safeUser = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      phone: user.phone,
      profilePhoto: user.profilePhoto
    }

    console.log('✅ Login successful:', user.email)

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser
    })

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
    console.log('👤 Profile request for user:', req.user.id)

    const user = await User.findById(req.user.id).select('-password')
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      user
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
    console.log('📊 Dashboard stats for:', req.user.role)

    const { role } = req.user

    let stats = {}

    if (role === 'admin') {
      stats = {
        totalStudents: await User.countDocuments({ role: 'student', isActive: true }),
        totalStaff: await User.countDocuments({ role: 'staff', isActive: true }),
        totalUsers: await User.countDocuments({ isActive: true }),
        recentLogins: 42,
        pendingFees: '₹2,45,000',
        todayAttendance: '94%'
      }
    } else if (role === 'staff') {
      stats = {
        myStudents: 45,
        todayClasses: 6,
        pendingMarks: 12,
        attendanceTaken: 'Yes'
      }
    } else if (role === 'student') {
      stats = {
        myAttendance: '95%',
        pendingFees: '₹15,000',
        grades: 'A',
        nextClass: 'Maths - 2:00 PM'
      }
    }

    res.json({
      success: true,
      stats,
      role,
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
