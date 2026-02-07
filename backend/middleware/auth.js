const jwt = require('jsonwebtoken')
const User = require('../models/User')

exports.protect = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized, no token provided' 
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Extract user ID (handle both 'id' and 'userId' from token)
    const userId = decoded.userId || decoded.id || decoded._id
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token payload' 
      })
    }

    // Find user by ID
    const user = await User.findById(userId).select('-password')
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Account is deactivated' 
      })
    }

    // Attach user info to request
    req.user = {
      userId: user._id.toString(),
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      staffRole: user.staffRole,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired' 
      })
    }

    return res.status(401).json({ 
      success: false,
      message: 'Not authorized, token failed' 
    })
  }
}

// Role-based authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`
      })
    }

    next()
  }
}

// Staff role authorization (for telecaller/counselor specific routes)
exports.authorizeStaffRole = (...staffRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      })
    }

    if (req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Only staff members can access this route'
      })
    }

    if (!staffRoles.includes(req.user.staffRole)) {
      return res.status(403).json({
        success: false,
        message: `Staff role '${req.user.staffRole}' is not authorized to access this route`
      })
    }

    next()
  }
}
