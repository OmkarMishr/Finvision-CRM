const mongoose = require('mongoose')

class db {
  constructor() {
    this.connected = false
  }

  async connect() {
    try {
      const dbUri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI
      
      if (!dbUri) {
        throw new Error('MONGODB_URI or MONGODB_ATLAS_URI not found in .env')
      }

      console.log('Connecting to MongoDB...')
      
      const conn = await mongoose.connect(dbUri)
      
      this.connected = true
      console.log('MongoDB Connected Successfully')
      console.log('Database:', conn.connection.name)
      console.log('Host:', conn.connection.host)
      
      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close()
        console.log('MongoDB Disconnected (SIGINT)')
        process.exit(0)
      })
      
      return conn
      
    } catch (error) {
      console.error('MongoDB Connection Failed:', error.message)
      process.exit(1)
    }
  }

  isConnected() {
    return this.connected
  }
}

module.exports = new db()
