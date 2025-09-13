# R-Talks Backend

A robust Node.js/Express backend for the R-Talks platform with image upload capabilities and comprehensive security features.

## Features

- 🔐 Secure authentication with JWT
- 📤 Image upload with validation and security checks
- 🛡️ Rate limiting and DOS protection
- 📊 Health monitoring and metrics
- 🗄️ PostgreSQL database integration
- 🚀 Ready for Render.com deployment

## Production Security Features

1. **Enhanced Authentication**
   - JWT-based with configurable expiration
   - Username/email login support
   - Rate-limited login attempts
   - Secure password hashing

2. **Robust File Upload Security**
   - File type validation
   - Size limits
   - Secure filename generation
   - Content type verification
   - Path traversal protection

3. **Comprehensive API Security**
   - Endpoint-specific rate limiting
   - Configured CORS protection
   - Helmet security headers
   - SQL injection protection
   - XSS prevention

4. **Advanced Monitoring**
   - Detailed health checks
   - System metrics tracking
   - Error categorization
   - Resource monitoring
   - Database connection monitoring

## Setup
1. Install dependencies
```bash
npm install
```

2. Set up environment variables
- Copy `.env.example` to `.env`
- Update the variables with your values

3. Start the server
```bash
npm start
```

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT tokens
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins
- `NODE_ENV`: production/development
- `PORT`: Server port (default: 3000)

## API Routes
- `/api/admin/login`: Admin authentication
- `/api/admin/speakers`: Speaker management
- `/api/speakers`: Public speaker endpoints
- `/health`: Server health check

## Deployment
This application is configured for deployment on Render.com