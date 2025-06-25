const express = require('express');
const path =require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs'); // Required for checking 'uploads' directory

// Load env vars
dotenv.config(); // Load environment variables from .env file

// Initialize Express app
const app = express();

// Database configuration and initialization
const db = require('./config/db');

// Middlewares
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Body parser for JSON payloads
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded payloads

// Passport initialization (if used for session-based auth or specific strategies)
const passport = require('passport');
// If you have a central passport config file (e.g., './config/passport.js'), require it here.
// For Google Strategy in authController, it's self-contained if passport object is passed or configured globally.
// We don't have a separate config/passport.js, authController configures its strategy.
app.use(passport.initialize());

// Create 'uploads' directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created directory: ${uploadsDir}`);
}

// Static folder for uploads
app.use('/uploads', express.static(uploadsDir));

// Mount main API router
app.use('/api', require('./routes')); // All API routes will be prefixed with /api

// Basic Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err.message || err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server Error',
    // Optionally, include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Not Found Handler (should be after all routes)
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

const PORT = process.env.PORT || 5000;

// Start server after ensuring DB tables are checked/created
db.createTables()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database or server:', err);
    process.exit(1); // Exit if DB initialization fails
  });

module.exports = app; // Export app for potential testing or other uses
