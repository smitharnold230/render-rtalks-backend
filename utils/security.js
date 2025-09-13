const crypto = require('crypto');
const path = require('path');

// Sanitize file names to prevent path traversal
const sanitizeFilename = (filename) => {
  return path.basename(filename).replace(/[^a-zA-Z0-9\-_\.]/g, '');
};

// Generate secure random filename
const generateSecureFilename = (originalname) => {
  const ext = path.extname(originalname);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}${ext}`;
};

// Validate file type by checking magic numbers
const validateFileType = (file) => {
  const allowedTypes = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46, 0x38]
  };

  const buffer = file.buffer;
  const type = file.mimetype;
  const magicNumbers = allowedTypes[type];

  if (!magicNumbers) return false;

  return magicNumbers.every((byte, i) => buffer[i] === byte);
};

module.exports = {
  sanitizeFilename,
  generateSecureFilename,
  validateFileType
};