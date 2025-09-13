const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Load environment variables first
dotenv.config();

// Create test server
const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false // Disable for testing
}));

// Middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve test HTML file at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-upload-with-image.html'));
});

// Configure upload handling
const storage = require('./utils/storage');
const uploadPath = storage.initializeUploadDirectory();

// Serve uploaded files
app.use('/uploads', express.static(uploadPath, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
}));

// Mount the API routes
app.use('/api', require('./routes/admin'));
app.use('/api', require('./routes/public'));

// Start server
const PORT = process.env.TEST_PORT || 3001;
app.listen(PORT, () => {
    console.log(`
🧪 Test server running on http://localhost:${PORT}

📝 Testing Instructions:
1. Login with your admin credentials
2. Try creating a speaker with an image
3. Verify the image appears in the list
4. Test updating the speaker's details
5. Test deleting the speaker
6. Check all responses in the interface

💾 Database Operations:
- CREATE: Adding new speaker with image
- READ: Listing speakers and individual details
- UPDATE: Modifying speaker information
- DELETE: Removing a speaker

📁 File Operations:
- Image upload
- Image update
- Image deletion
- File permissions
- URL generation

🔒 Security Features:
- JWT Authentication
- File type validation
- File size limits
- CORS configuration

Press Ctrl+C to stop the server
`);

    // Open the test page in the default browser
    exec(`start http://localhost:${PORT}`, (error) => {
        if (error) {
            console.error('Failed to open browser:', error);
        }
    });
});