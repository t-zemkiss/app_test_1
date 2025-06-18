const express = require('express');
const router = express.Router();

// @route   GET /api
// @desc    Test route
// @access  Public
router.get('/', (req, res) => res.send('API Base Route Running'));

// Auth routes
router.use('/auth', require('./authRoutes'));
router.use('/hg', require('./hgRoutes'));

module.exports = router;
