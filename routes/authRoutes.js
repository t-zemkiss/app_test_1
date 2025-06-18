const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport'); // Required for initializing passport

// Initialize passport - typically done in app.js, but can be here for module-specific setup
// For this subtask, ensuring it's initialized somewhere is key.
// It's better in app.js for global passport initialization.
// router.use(passport.initialize()); // Let's assume this is in app.js

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/google - Initiates Google OAuth flow
router.get('/google', authController.googleAuth); // Corrected to actual function later

// GET /api/auth/google/callback - Callback from Google
router.get('/google/callback', authController.googleAuthCallback); // Corrected to actual function later
router.get('/google/failure', authController.googleAuthFailure);

module.exports = router;
