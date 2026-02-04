const { body, validationResult } = require('express-validator')

// Register validation
const validateRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().trim().withMessage('First name required'),
  body('lastName').notEmpty().trim().withMessage('Last name required'),
  body('role').isIn(['admin', 'staff', 'student']).withMessage('Invalid role')
]

// Login validation
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
]

const handleValidation = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    })
  }
  next()
}

module.exports = {
  validateRegister,
  validateLogin,
  handleValidation
}
