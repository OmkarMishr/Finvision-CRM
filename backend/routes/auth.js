const express = require('express')
const {
  registerUser,
  loginUser, 
  getDashboardStats,
  getProfile
} = require('../controllers/authController')
const { validateRegister, validateLogin, handleValidation } = require('../middleware/validation')
const { protect } = require('../middleware/auth')
const router = express.Router()

// Public routes
router.post('/register', validateRegister, handleValidation, registerUser)
router.post('/login', validateLogin, handleValidation, loginUser) 

// Protected routes
router.get('/profile', protect, getProfile)
router.get('/dashboard', protect, getDashboardStats)

module.exports = router
