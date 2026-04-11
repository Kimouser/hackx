const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async (retries = 5) => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/guardian';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        dbName: 'guardian',
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      logger.error(`Connection attempt ${attempt}/${retries} failed: ${error.message}`);

      if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
        logger.error('Possible fixes:');
        logger.error('  1. Go to MongoDB Atlas → Network Access → Add your current IP (or 0.0.0.0/0 for dev)');
        logger.error('  2. Check if your Atlas cluster is active (not paused)');
        logger.error('  3. Verify your connection string in .env');
        logger.error('  4. Check your internet/DNS — try: nslookup cluster0.d5fokii.mongodb.net');
      }

      if (attempt < retries) {
        const delay = attempt * 2000;
        logger.info(`Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        logger.error('All connection attempts failed. Exiting.');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
