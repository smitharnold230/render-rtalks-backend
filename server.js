const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Initialize environment variables
const PORT = process.env.PORT || 3000;
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, 'uploads');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const MAX_FILE_SIZE = process.env.UPLOAD_MAX_SIZE || '5mb';

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", process.env.UPLOAD_URL || "'self'"],
      upgradeInsecureRequests: null
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Middleware
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with limit
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true, mode: 0o755 });
}

// Validate uploads directory is writable
try {
  fs.accessSync(UPLOAD_PATH, fs.constants.W_OK);
  console.log(`✅ Uploads directory is writable: ${UPLOAD_PATH}`);
} catch (err) {
  console.error(`❌ Error: Uploads directory is not writable: ${UPLOAD_PATH}`);
  console.error('Please check directory permissions');
  if (IS_PRODUCTION) {
    process.exit(1);
  }
}

// Serve uploaded files with proper headers
app.use('/uploads', express.static(UPLOAD_PATH, {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (IS_PRODUCTION) {
      res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
}));

// Serve static files in development only
if (!IS_PRODUCTION) {
  app.use(express.static(path.join(__dirname)));
}

// CORS configuration with proper origin handling
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || !IS_PRODUCTION || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // Cache preflight for 24 hours
}));

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting
app.use('/api/admin/login', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 login attempts per 15 minutes
}));
app.use('/api/admin', limiter);
app.use('/api/public', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Configure uploads directory
const uploadsDir = process.env.UPLOAD_PATH || path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
}

// Validate uploads directory is writable
try {
  fs.accessSync(uploadsDir, fs.constants.W_OK);
  console.log(`✅ Uploads directory is writable: ${uploadsDir}`);
} catch (err) {
  console.error(`❌ Error: Uploads directory is not writable: ${uploadsDir}`);
  console.error('Please check directory permissions');
  process.exit(1);
}

// Routes
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// Enhanced health check endpoint for Render.com
app.get('/health', async (req, res) => {
  try {
    // Check upload directory
    const uploadsAccessible = fs.existsSync(UPLOAD_PATH) && fs.accessSync(UPLOAD_PATH, fs.constants.W_OK);
    
    // Check database if configured
    let dbStatus = 'not_configured';
    if (process.env.DATABASE_URL) {
      try {
        const db = require('./utils/db');
        await db.query('SELECT 1');
        dbStatus = 'connected';
      } catch (err) {
        dbStatus = `error: ${err.message}`;
      }
    }
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: require('./package.json').version,
      database: dbStatus,
      uploadsDir: {
        path: IS_PRODUCTION ? '/opt/render/project/uploads' : UPLOAD_PATH,
        accessible: uploadsAccessible,
        url: process.env.UPLOAD_URL || '/uploads'
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = IS_PRODUCTION ? 
    (status === 500 ? 'Internal Server Error' : err.message) : 
    err.message;

  // Log error
  console.error(`[${new Date().toISOString()}] ${status} ${message}`);
  if (err.stack && !IS_PRODUCTION) {
    console.error(err.stack);
  }

  // Send error response
  res.status(status).json({
    error: message,
    status,
    ...(IS_PRODUCTION ? {} : { stack: err.stack })
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🚀 Server is running on port ${PORT}
📁 Upload directory: ${UPLOAD_PATH}
🔒 Mode: ${IS_PRODUCTION ? 'Production' : 'Development'}
🌐 CORS: ${allowedOrigins.join(', ')}
🚦 Health check: ${IS_PRODUCTION ? process.env.UPLOAD_URL : `http://localhost:${PORT}`}/health

${!IS_PRODUCTION ? `
Test interface: http://localhost:${PORT}/test-image-upload.html
Press Ctrl+C to stop the server
` : ''}
`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});