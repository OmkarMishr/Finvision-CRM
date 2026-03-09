require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const fs = require('fs-extra');
const path = require('path');
const connectDB = require('./config/db')
const studentAttendanceRoutes = require('./routes/studentAttendance');
const staffAttendanceRoutes = require('./routes/staffAttendance');
const batchRoutes = require('./routes/batches');
const adminRoutes = require('./routes/admin');
const certificate = require('./routes/certificates');
const feesRoutes = require('./routes/feesRoutes');
const couponRoutes = require('./routes/couponRoutes');
const liveClassRoutes = require('./routes/liveClassRoutes');
const staffRoutes = require('./routes/staff');
const adminSettingRoutes = require('./routes/adminSettingRoutes');
const leaveRoutes = require('./routes/leaveRoutes');

const app = express()
const PORT = process.env.PORT || 5000

// MULTER DIRECTORY INITIALIZER
const initializeUploadDirs = async () => {
  const dirs = [
    'uploads',
    'uploads/profiles',
    'uploads/staff-profiles',
    'uploads/certificates'
  ];
  for (const dir of dirs) {
    try {
      await fs.ensureDir(path.join(__dirname, dir));
    } catch (error) {
      console.error(`Failed to create ${dir}:`, error.message);
    }
  }
};

//  Middleware registered immediately
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// Health Check Route
app.get('/', (req, res) => {
  res.json({
    message: 'FINVISION CRM API',
    version: '1.0.0',
    database: connectDB.isConnected() ? 'Connected ' : 'Disconnected ',
    timestamp: new Date().toISOString()
  })
})

app.get('/api', (req, res) => {
  res.json({
    message: 'API is working!',
    database: connectDB.isConnected() ? 'Connected ' : 'Disconnected ',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/dashboard/stats'
    ]
  })
})

// API Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/leads', require('./routes/leads'))
app.use('/api/students', require('./routes/students'));
app.use('/api/fees', feesRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/student-attendance', studentAttendanceRoutes);
app.use('/api/staff-attendance', staffAttendanceRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/certificates', certificate);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/live-classes', liveClassRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin-settings', adminSettingRoutes);
app.use('/api/leave', leaveRoutes);

app.use(async (req, res, next) => {
  try {
    await connectDB.connect()
    next()
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: err.message
    })
  }
})

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

// Connect to DB and initialize dirs 
connectDB.connect().then(async () => {
  await initializeUploadDirs();
  console.log('DB connected and upload dirs initialized')
})


if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}


module.exports = app
