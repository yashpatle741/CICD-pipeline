const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
// const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Validate Cloudinary configuration at startup (secure)
try {
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (cloudinaryUrl) {
    console.log('✓ Cloudinary configuration loaded (using CLOUDINARY_URL)');
  } else if (cloudName && apiKey && apiSecret) {
    console.log('✓ Cloudinary configuration loaded (using individual credentials)');
  } else {
    console.warn('⚠️  Cloudinary configuration missing or incomplete');
    console.warn('   Image uploads may fail without proper credentials');
  }
} catch (error) {
  console.error('❌ Cloudinary configuration check failed:', error.message);
}


const app = express();
const server = http.createServer(app);
// Socket.IO removed

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve locally stored uploads (fallback when Cloudinary isn't available)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/bikes', require('./routes/bikes'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/agreements', require('./routes/agreements'));
app.use('/api/admin', require('./routes/admin'));
// app.use('/api/damage-proof', require('./routes/damageProof')); // Disabled for current version
app.use('/api/notifications', require('./routes/notifications'));

// Error handling middleware for multer and other errors
app.use((error, req, res, next) => {
  // Multer errors
  if (error instanceof require('multer').MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 50MB.',
        error: error.message
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files uploaded.',
        error: error.message
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected file field.',
        error: error.message
      });
    }
    return res.status(400).json({
      message: 'File upload error',
      error: error.message
    });
  }

  // Other errors (including multer fileFilter errors)
  if (error) {
    console.error('Server error:', error);
    return res.status(error.status || 500).json({
      message: error.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }

  next();
});

// Socket.IO removed as per request for clean college-level version
// const activeTrackings = new Map();
// io.on('connection', ...) removed

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'RYDZO API is running' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API Health Check: http://localhost:${PORT}/api/health`);
});

module.exports = { app };

