const dns = require('dns')
dns.setServers(['8.8.8.8', '1.1.1.1'])

const mongoose = require('mongoose')

let isConnectedFlag = false

const connect = async () => {
  if (isConnectedFlag) return // reuse existing connection
  
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    isConnectedFlag = true
    console.log('MongoDB Connected ')
  } catch (err) {
    isConnectedFlag = false
    console.error('MongoDB Connection Failed:', err.message)
    throw err // rethrow so caller knows it failed
  }
}

const isConnected = () => {
  return mongoose.connection.readyState === 1
}

module.exports = { connect, isConnected }
