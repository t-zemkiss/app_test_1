const express = require('express');
const router = express.Router();

// @route   GET /api
// @desc    Test route
// @access  Public
router.get('/', (req, res) => res.status(200).json({ success: true, message: 'API Base Route Running' }));

// Auth routes - mounted under /api/auth
router.use('/auth', require('./authRoutes'));

// Image Generation routes - mounted under /api/generation
router.use('/generation', require('./hgRoutes')); // Renamed from /hg for clarity

module.exports = router;
