const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  // Common fields for all users
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Don't return in queries
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  profilePhoto: {
    type: String, // URL to uploaded photo
    default: null
  },
  
  // Role-based fields
  role: {
    type: String,
    enum: ['admin', 'staff', 'student'],
    required: true,
    default: 'student'
  },
  // Staff Sub-Role
  staffRole: {
    type: String,
    enum: ['telecaller', 'counselor', 'Teacher'],
    default: 'Teacher'
  },

  // Admin-specific fields
  adminInfo: {
    instituteName: String,
    position: String, // Principal, Vice-Principal, etc.
    department: String
  },

  // Staff-specific fields  
  staffInfo: {
    employeeId: String,
    department: {
      type: String,
      enum: ['Math', 'Science', 'English', 'Computer', 'Physics', 'Chemistry', 'Biology', 'History']
    },
    subject: String,
    joiningDate: {
      type: Date,
      default: Date.now
    },
    salary: Number
  },

  // Student-specific fields
  studentInfo: {
    studentId: String,
    rollNumber: String,
    admissionDate: {
      type: Date,
      default: Date.now
    },
    course: {
      type: String,
      enum: ['B.Tech', 'B.Sc', 'B.Com', 'BA', 'MA', 'M.Sc', 'Diploma']
    },
    year: {
      type: Number,
      enum: [1, 2, 3, 4]
    },
    semester: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6, 7, 8]
    },
    parentPhone: String,
    address: String,
    dateOfBirth: Date,
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    }
  },

  // Common fields
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
})

// Virtual field for full name
userSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`
})

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true })
userSchema.set('toObject', { virtuals: true })

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return
    
    try {
      const salt = await bcrypt.genSalt(12)
      this.password = await bcrypt.hash(this.password, salt)
    } catch (error) {
      console.error('Password hash error:', error)
      throw error
    }
  })

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  delete user.__v
  return user
}

module.exports = mongoose.model('User', userSchema)
