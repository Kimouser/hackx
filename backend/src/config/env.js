const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/guardian',
  LEAFLET_API_KEY: process.env.LEAFLET_API_KEY || '',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  JWT_SECRET: process.env.JWT_SECRET || 'guardian-secret-key-dev',
};
