# Deploying to Render.com

This guide explains how to deploy the R-Talks Backend to Render.com with proper file storage and database configuration.

## Prerequisites

1. A Render.com account
2. Your codebase pushed to a Git repository (GitHub, GitLab, etc.)
3. Understanding of environment variables in `.env.example`

## Deployment Steps

### 1. Create a New Web Service

1. Go to Render.com dashboard
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name**: `rtalks-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Starter (or higher based on needs)

### 2. Configure Environment Variables

The following environment variables are automatically set by Render:
- `DATABASE_URL`
- `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGPORT`
- `RENDER_EXTERNAL_HOSTNAME`

You need to manually set these critical variables:
1. `JWT_SECRET`: Generate a secure random string
2. `ADMIN_USERNAME` and `ADMIN_PASSWORD`: Set secure credentials
3. `ALLOWED_ORIGINS`: Set to your frontend domain(s)

### 3. Set Up Persistent Disk

The `render.yaml` configuration includes a 1GB persistent disk mounted at `/opt/render/project/uploads`. This ensures uploaded files persist across deployments and restarts.

Key storage configurations:
- Mount path: `/opt/render/project/uploads`
- Size: 1GB (adjust `sizeGB` in `render.yaml` if needed)
- Automatic mounting and permission handling

### 4. Database Configuration

The PostgreSQL database is automatically configured through `render.yaml`:
- Plan: Starter (adjust as needed)
- Internal connections only (IP allowlist empty)
- Connection string available as `DATABASE_URL`

### 5. Post-Deployment Steps

After successful deployment:

1. **Update Admin Password**: Use the provided `/api/admin/password` endpoint to change the default admin password

2. **Verify File Uploads**: Test the image upload functionality:
   - Ensure files are being stored in the persistent disk
   - Verify file URLs are accessible
   - Check file permissions

3. **Monitor Logs**: Check Render.com logs for:
   - Database connection success
   - File system access
   - Any permission issues

### 6. Important Notes

1. **SSL/HTTPS**: Render.com automatically handles SSL certificates

2. **File Storage**:
   - Files are stored in `/opt/render/project/uploads`
   - URLs are generated using the service's hostname
   - 1GB storage included (can be increased)

3. **Database Backups**:
   - Render.com provides automatic daily backups
   - Manual backups available through dashboard

4. **Rate Limiting**:
   - Login attempts: 5 per 15 minutes
   - Upload attempts: 10 per 15 minutes
   - API requests: 100 per 15 minutes

### 7. Troubleshooting

1. **File Upload Issues**:
   - Check disk mount status in Render dashboard
   - Verify permissions on upload directory
   - Check file size limits

2. **Database Connection Issues**:
   - Verify DATABASE_URL in environment variables
   - Check database status in Render dashboard
   - Review server logs for connection errors

3. **CORS Issues**:
   - Verify ALLOWED_ORIGINS includes your frontend domain
   - Check for proper protocol (https://)
   - Review CORS errors in browser console

## Support

If you encounter issues:

1. Check Render.com status page
2. Review application logs in Render dashboard
3. Consult Render.com documentation
4. Contact Render support for persistent disk or database issues

## Updating the Deployment

To update your deployment:

1. Push changes to your Git repository
2. Render automatically deploys updates
3. Monitor deployment progress in dashboard
4. Check logs for any issues

Remember: Uploaded files persist in the disk mount between deployments.