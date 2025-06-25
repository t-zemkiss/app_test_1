const multer = require('multer');
const path = require('path');
const fs = require('fs'); // To ensure upload directory exists

// Define the storage configuration for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    // Ensure the upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename: fieldname-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Define file filter to accept only common image types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.'), false); // Reject file
  }
};

// Configure Multer with storage, file filter, and limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit per file
  }
});

// Middleware function to handle single file upload
// 'image' is the field name in the form-data
const uploadSingleImage = (fieldName = 'image') => (req, res, next) => {
  const multerUpload = upload.single(fieldName);

  multerUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred (e.g., file too large)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // An unknown error occurred or file type error
      return res.status(400).json({ message: err.message });
    }
    // Everything went fine, file is uploaded to req.file
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or field name is incorrect.' });
    }
    next();
  });
};


module.exports = {
  uploadSingleImage, // For routes that expect one image
  // You can add more configurations here, e.g., upload.array('images', 5)
};
