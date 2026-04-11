const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const connectDB = require('./config/db');
const errorHandler = require('./utils/errorHandler');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/authRoutes');
const mapRoutes = require('./routes/mapRoutes');
const civicRoutes = require('./routes/civicRoutes');
const hardwareRoutes = require('./routes/hardwareRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Project Guardian API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      map: '/api/map',
      civic: '/api/civic',
      hardware: '/api/hardware',
    },
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/civic', civicRoutes);
app.use('/api/hardware', hardwareRoutes);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT}`);
    logger.info(`API available at http://localhost:${config.PORT}`);
  });
};

startServer();

module.exports = app;
