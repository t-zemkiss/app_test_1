const express = require('express');
const router = express.Router();
const hgController = require('../controllers/hgController');
const { protect, checkCredits } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure Multer for temporary storage
// Multer will save files to a temp directory. Our controller will move it.
const UPLOADS_DIR = path.join(__dirname, '../uploads'); // Temp dir for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR); // Save to a general 'uploads' temp directory
  },
  filename: function (req, file, cb) {
    // Use a unique name for the temporary file to avoid collisions
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image file.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 } // 10MB limit
});

// POST /api/hg/make-it-now
// Chain of middlewares: protect -> checkCredits -> multer upload -> controller
router.post(
  '/make-it-now',
  protect,
  checkCredits,
  upload.single('image'), // 'image' is the field name in the form-data
  hgController.makeItNow
);

module.exports = router;
