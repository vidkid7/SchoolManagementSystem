# Railway Deployment Setup Guide

## Current Status

✅ Backend is running successfully
✅ Database columns fixed automatically
✅ Admin user created with credentials: `admin` / `Admin@123`
⚠️ Frontend needs environment variable configuration

## Frontend Configuration Required

The frontend needs to know the backend URL. Railway should have this environment variable set:

### In Railway Dashboard:

1. Go to your **Frontend service** (zucchini-passion-production)
2. Click on **Variables** tab
3. Add or verify this variable:
   - **Variable Name**: `VITE_API_URL`
   - **Variable Value**: `https://schoolmanagementsystem-production-4bb7.up.railway.app/api/v1`

4. After adding/updating the variable, Railway will automatically redeploy the frontend
5. The `inject-env.sh` script will run automatically and update `config.js` with the correct backend URL

### Alternative: Use VITE_API_BASE_URL

If you prefer, you can use `VITE_API_BASE_URL` instead (the script supports both):
- **Variable Name**: `VITE_API_BASE_URL`
- **Variable Value**: `https://schoolmanagementsystem-production-4bb7.up.railway.app/api/v1`

## How It Works

1. During build, the frontend is compiled with a placeholder config
2. When the container starts, nginx runs `/docker-entrypoint.d/40-inject-env.sh`
3. This script reads `VITE_API_URL` or `VITE_API_BASE_URL` from environment
4. It generates `/usr/share/nginx/html/config.js` with the actual backend URL
5. The frontend loads this config at runtime via `<script src="/config.js"></script>`

## Verification

After Railway redeploys the frontend:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Visit: `https://zucchini-passion-production.up.railway.app/config.js`
4. You should see:
   ```javascript
   window.ENV = {
     API_BASE_URL: "https://schoolmanagementsystem-production-4bb7.up.railway.app/api/v1"
   };
   ```

## Login Credentials

Once the frontend is configured correctly, you can log in with:

- **Username**: `admin`
- **Password**: `Admin@123`

## Current Issues to Fix

1. **Frontend Environment Variable** (CRITICAL)
   - Set `VITE_API_URL` in Railway frontend service
   - This will fix the "Invalid credentials" error (frontend is calling wrong URL)

2. **Dashboard 500 Error** (After login works)
   - Backend needs seed data (academic years, classes, students)
   - Run seeding scripts in Railway Shell

3. **Backup Directory Permissions** (Optional)
   - Non-critical warning about `/app/backups` directory
   - Can be ignored or fixed by adjusting Railway volume permissions

## Next Steps

1. Set the `VITE_API_URL` environment variable in Railway
2. Wait for automatic redeployment
3. Try logging in again
4. If login works but dashboard is empty, we'll seed the database next
