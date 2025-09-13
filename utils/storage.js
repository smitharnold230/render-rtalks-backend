const path = require('path');
const fs = require('fs');

// Get the appropriate upload directory based on environment
const getUploadPath = () => {
  if (process.env.NODE_ENV === 'production') {
    // Use Render.com's persistent storage path
    return process.env.UPLOAD_PATH || '/opt/render/project/uploads';
  }
  // Use local path for development
  return path.join(process.cwd(), 'uploads');
};

// Ensure the upload directory exists and is writable
const initializeUploadDirectory = () => {
  const uploadPath = getUploadPath();
  
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true, mode: 0o755 });
    }
    
    // Test if directory is writable
    const testFile = path.join(uploadPath, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
    console.log(`✅ Upload directory initialized: ${uploadPath}`);
    return uploadPath;
  } catch (error) {
    console.error(`❌ Failed to initialize upload directory: ${error.message}`);
    throw new Error(`Upload directory initialization failed: ${error.message}`);
  }
};

// Get the full path for a file
const getFilePath = (filename) => {
  return path.join(getUploadPath(), filename);
};

// Get the public URL for a file
const getFileUrl = (filename, req) => {
  if (process.env.NODE_ENV === 'production') {
    // Use UPLOAD_URL from environment or construct from request
    return process.env.UPLOAD_URL 
      ? `${process.env.UPLOAD_URL}/${filename}`
      : `${req.protocol}://${req.get('host')}/uploads/${filename}`;
  }
  return `/uploads/${filename}`;
};

// Delete a file
const deleteFile = async (filename) => {
  const filepath = getFilePath(filename);
  try {
    await fs.promises.unlink(filepath);
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') { // Ignore if file doesn't exist
      throw error;
    }
    return false;
  }
};

module.exports = {
  getUploadPath,
  initializeUploadDirectory,
  getFilePath,
  getFileUrl,
  deleteFile
};