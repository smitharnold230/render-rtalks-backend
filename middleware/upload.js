const multer = require('multer');
const path = require('path');
const fs = require('fs');
const storage = require('../utils/storage');

// Configure multer storage with enhanced security
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = storage.getUploadPath();
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    try {
      // Generate unique filename with timestamp and random suffix
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).toLowerCase();
      // Only allow certain extensions
      if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        throw new Error('Invalid file type. Only .jpg, .png, and .gif files are allowed.');
      }
      const filename = file.fieldname + '-' + uniqueSuffix + ext;
      cb(null, filename);
    } catch (err) {
      cb(err);
    }
  }
});

// File filter with strict validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  // Validate mime type
  if (!allowedTypes.includes(file.mimetype)) {
    cb(new Error('Invalid file type. Only JPEG, PNG and GIF images are allowed.'), false);
    return;
  }
  
  cb(null, true);
};

// Create multer instance
const multerUpload = multer({
  storage: multerStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB size limit
    files: 1 // Only allow 1 file per request
  }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File size too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      error: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      error: err.message
    });
  }
  
  next();
};

// Export the multer middleware directly
module.exports = multerUpload;