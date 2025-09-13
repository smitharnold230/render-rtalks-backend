const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 1000, // More generous limit for development
  message: { error: 'Too many requests from this IP' }
}));

// Serve static files from the root directory with caching
app.use(express.static(__dirname, {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Serve uploaded files with proper headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

app.use('/api/admin', require('./routes/admin'));
app.use('/api/public', require('./routes/public'));

app.get('/health', async (req, res) => {
  try {
    const db = require('./utils/db');
    await db.query('SELECT 1');
    
    const uploadsPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: require('./package.json').version,
      environment: process.env.NODE_ENV,
      dbConnected: true,
      uploadsDir: fs.existsSync(uploadsPath),
      uptime: process.uptime()
    });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({
      status: 'unhealthy',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV === 'production' ? {} : { stack: err.stack })
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server started successfully on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
