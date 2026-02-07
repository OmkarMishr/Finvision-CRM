require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const connectDB = require('./config/db')
const studentAttendanceRoutes = require('./routes/studentAttendance');
const batchRoutes = require('./routes/batches');

const app = express()
const PORT = process.env.PORT || 5000

// Connecting to DB
connectDB.connect().then(() => {
  // Middleware 
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
      message: 'FINVISION CRM API ',
      version: '1.0.0',
      database: connectDB.isConnected() ? 'Connected ' : 'Disconnected ',
      timestamp: new Date().toISOString()
    })
  })

  // API Routes
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

  // Auth Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/leads', require('./routes/leads'))
app.use('/api/students',require('./routes/students'))
app.use('/api/student-attendance', studentAttendanceRoutes);
app.use('/api/batches', batchRoutes);

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

  // Start Server AFTER DB Connection
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  })
})
