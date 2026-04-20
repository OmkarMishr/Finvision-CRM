require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const fs = require('fs-extra')
const path = require('path')
const connectDB = require('./config/db')
const studentAttendanceRoutes = require('./routes/studentAttendance')
const staffAttendanceRoutes = require('./routes/staffAttendance')
const batchRoutes = require('./routes/batches')
const adminRoutes = require('./routes/admin')
const certificate = require('./routes/certificates')
const feesRoutes = require('./routes/feesRoutes')
const couponRoutes = require('./routes/couponRoutes')
const liveClassRoutes = require('./routes/liveClassRoutes')
const staffRoutes = require('./routes/staff')
const adminSettingRoutes = require('./routes/adminSettingRoutes')
const leaveRoutes = require('./routes/leaveRoutes')

const app = express()
const PORT = process.env.PORT || 5000

// ── Multer directory initializer ─────────────────────────────────────────────
const initializeUploadDirs = async () => {
  const dirs = [
    'uploads',
    'uploads/profiles',
    'uploads/staff-profiles',
    'uploads/certificates',
  ]
  for (const dir of dirs) {
    try {
      await fs.ensureDir(path.join(__dirname, dir))
    } catch (error) {
      console.error(`Failed to create ${dir}:`, error.message)
    }
  }
}

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL  || 'http://localhost:5173',
    process.env.WEBSITE_URL   || 'http://localhost:3000',
    process.env.WEBSITE_URL_2,
  ].filter(Boolean),
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// ── DB connection guard (before all routes) ──────────────────────────────────
app.use(async (req, res, next) => {
  try {
    await connectDB.connect()
    next()
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: err.message,
    })
  }
})

// ── Health check routes ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message:   'FINVISION CRM API',
    version:   '1.0.0',
    database:  connectDB.isConnected() ? 'Connected ' : 'Disconnected ',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api', (req, res) => {
  res.json({
    message:  'API is working!',
    database: connectDB.isConnected() ? 'Connected ' : 'Disconnected ',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/dashboard/stats',
    ],
  })
})

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',               require('./routes/auth'))
app.use('/api/leads',              require('./routes/leads'))
app.use('/api/students',           require('./routes/students'))
app.use('/api/fees',               feesRoutes)
app.use('/api/coupons',            couponRoutes)
app.use('/api/student-attendance', studentAttendanceRoutes)
app.use('/api/staff-attendance',   staffAttendanceRoutes)
app.use('/api/batches',            batchRoutes)
app.use('/api/admin',              adminRoutes)
app.use('/api/certificates',       certificate)
app.use('/api/live-classes',       liveClassRoutes)
app.use('/api/staff',              staffRoutes)
app.use('/api/admin-settings',     adminSettingRoutes)
app.use('/api/leave',              leaveRoutes)
app.use('/api/webhooks',           require('./routes/webhooks'))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  })
})

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  })
})

// ── Start server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB.connect()
    await initializeUploadDirs()
    console.log('DB connected and upload dirs initialized')

    if (require.main === module) {
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`)
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
      })
    }
  } catch (err) {
    console.error('Failed to start server:', err.message)
    process.exit(1)
  }
}

startServer()

module.exports = app