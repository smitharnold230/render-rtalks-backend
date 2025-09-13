const multer = require('multer');
const path = require('path');
const fs = require('fs');
const storage = require('../utils/storage');

// Configure multer storage with enhanced security
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, storage.getUploadPath());
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
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  // Validate mime type
  if (!allowedTypes.includes(file.mimetype)) {
    cb(new Error('Invalid file type. Only JPEG, PNG and GIF images are allowed.'));
    return;
  }
  
  // Create a write stream to check file size
  const tempPath = path.join(storage.getUploadPath(), '.size-check');
  const writeStream = fs.createWriteStream(tempPath);
  let fileSize = 0;
  
  file.stream.on('data', (chunk) => {
    fileSize += chunk.length;
    if (fileSize > maxSize) {
      writeStream.destroy();
      fs.unlink(tempPath, () => {});
      cb(new Error('File size too large. Maximum size is 5MB.'));
      return;
    }
    writeStream.write(chunk);
  });
  
  file.stream.on('end', () => {
    writeStream.end();
    fs.unlink(tempPath, () => {});
    cb(null, true);
  });
  
  file.stream.on('error', (err) => {
    writeStream.destroy();
    fs.unlink(tempPath, () => {});
    cb(err);
  });
};

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err.message.includes('file type') || err.message.includes('file size')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

// Create upload middleware with enhanced error handling
const upload = multer({
  storage: multerStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only allow 1 file per request
    fieldSize: 10 * 1024 * 1024 // 10MB limit for the entire request
  }
});

// Export middleware functions
module.exports = {
  // Middleware for single image upload with automatic URL generation
  single: (fieldName) => {
    return [
      upload.single(fieldName),
      (req, res, next) => {
        if (!req.file) {
          return next();
        }
        
        // Add public URL to the file object
        req.file.url = storage.getFileUrl(req.file.filename, req);
        next();
      }
    ];
  },
  
  handleError: handleUploadError,
  
  // Utility to delete uploaded file
  deleteFile: storage.deleteFile
};