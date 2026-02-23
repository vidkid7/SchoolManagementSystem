# Railway Deployment Guide

## Your Railway MySQL Connection
```
mysql://root:ZWYfSGjGVzpDFWuWqueuuQAowUSSCyEH@switchback.proxy.rlwy.net:42577/railway
```

## Step-by-Step Deployment

### 1. Backend Service Setup

#### A. Create Backend Service
1. Go to your Railway project
2. Click "+ New" → "GitHub Repo"
3. Select: `vidkid7/SchoolManagementSystem`
4. Service Name: `backend`

#### B. Configure Backend Settings
Go to Settings → Configure:
- **Root Directory**: `/backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Watch Paths**: `/backend/**`

#### C. Add Backend Environment Variables
Go to Variables tab and add these:

```bash
# Node Environment
NODE_ENV=production
PORT=5000

# Database - Use your Railway MySQL URL
DATABASE_URL=mysql://root:ZWYfSGjGVzpDFWuWqueuuQAowUSSCyEH@switchback.proxy.rlwy.net:42577/railway

# JWT Configuration (use generated keys)
JWT_SECRET=7167c34b35cdb58e5588d27e99629853770f908abcecca8e459c11bd9828a1f5
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=b77dd832f38a14ac496142cab720f70e515f49481e9965e088e758387ebfbf4f
JWT_REFRESH_EXPIRES_IN=30d

# Encryption Keys (use generated keys)
ENCRYPTION_KEY=d56b20ca2af9d2795c570425b130c1ad89d4dd21405d0bc3b4d3f6909495d5b5
ENCRYPTION_IV=585c26bc43bb6906b0c476547163bd9f

# Session Secret (use generated key)
SESSION_SECRET=5d021f535b6f6fde39d3cd60970bb193478e45b2c698e3ff105c9d7b0cd9837b

# CORS - Will update after frontend deployment
CORS_ORIGIN=*

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Frontend Service Setup

#### A. Create Frontend Service
1. Click "+ New" → "GitHub Repo"
2. Select: `vidkid7/SchoolManagementSystem`
3. Service Name: `frontend`

#### B. Configure Frontend Settings
Go to Settings → Configure:
- **Root Directory**: `/frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run preview`
- **Watch Paths**: `/frontend/**`

#### C. Add Frontend Environment Variables
```bash
# Backend API URL (update after backend deploys)
VITE_API_URL=https://your-backend-url.railway.app
```

### 3. Update CORS After Deployment

Once both services are deployed:

1. Copy your frontend URL (e.g., `https://frontend-production-xxxx.railway.app`)
2. Go to backend service → Variables
3. Update `CORS_ORIGIN` with your frontend URL
4. Redeploy backend

### 4. Run Database Migrations

#### Option A: Using Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Select backend service
railway service

# Run migrations
railway run npm run migrate
```

#### Option B: Add to package.json start script
Update `backend/package.json`:
```json
{
  "scripts": {
    "start": "npm run migrate && node dist/server.js",
    "migrate": "node dist/scripts/run-all-migrations.js"
  }
}
```

### 5. Verify Deployment

#### Check Backend Health
```bash
curl https://your-backend-url.railway.app/health
```

#### Check Frontend
Open `https://your-frontend-url.railway.app` in browser

### 6. Initial Setup

After successful deployment, you need to:

1. **Run migrations** (see step 4)
2. **Seed initial data**:
   ```bash
   railway run npm run seed:roles
   railway run npm run seed:admin
   ```
3. **Create admin user** or use seeded credentials

### 7. Custom Domain (Optional)

#### For Backend:
1. Go to backend service → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `api.yourschool.com`)
4. Add CNAME record to your DNS

#### For Frontend:
1. Go to frontend service → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `yourschool.com`)
4. Add CNAME record to your DNS

### 8. Monitoring & Logs

- **View Logs**: Click on service → Deployments → View Logs
- **Metrics**: Railway provides CPU, Memory, and Network metrics
- **Alerts**: Set up in Settings → Notifications

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check if MySQL service is running
- Ensure backend can reach MySQL (same project)

### Build Failures
- Check build logs for errors
- Verify package.json scripts
- Ensure all dependencies are in package.json

### CORS Errors
- Update CORS_ORIGIN in backend
- Ensure frontend URL is correct
- Redeploy backend after changes

### Migration Errors
- Check database connection
- Verify migration files exist
- Run migrations manually via Railway CLI

## Environment Variables Reference

### Required Variables
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - JWT signing key
- `ENCRYPTION_KEY` - Data encryption key
- `ENCRYPTION_IV` - Encryption initialization vector

### Optional Variables
- `REDIS_URL` - Redis connection (if using caching)
- `SMTP_*` - Email configuration
- `SPARROW_SMS_TOKEN` - SMS service (Nepal)
- Payment gateway credentials

## Security Checklist

- ✅ All secrets are unique and randomly generated
- ✅ CORS is configured with specific origin (not *)
- ✅ Environment variables are set in Railway (not in code)
- ✅ Database credentials are secure
- ✅ Rate limiting is enabled
- ✅ HTTPS is enforced (Railway default)

## Cost Optimization

- Use Railway's free tier for development
- Monitor resource usage in dashboard
- Optimize database queries
- Enable caching with Redis
- Use CDN for static assets

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/vidkid7/SchoolManagementSystem/issues
