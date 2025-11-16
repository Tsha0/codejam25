# Railway Deployment Guide

## Prerequisites

✅ Your Dockerfile is ready for Railway deployment!

## What's Configured

1. **Python 3.10** - Base image
2. **Gunicorn** - Production WSGI server
3. **Eventlet workers** - Required for Flask-SocketIO
4. **PORT handling** - Automatically uses Railway's PORT environment variable
5. **Logging** - Logs to stdout/stderr (Railway captures these)

## Deployment Steps

### Step 1: Create Railway Account & Project

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project"
3. Select "Deploy from GitHub repo" (recommended) or "Empty Project"

### Step 2: Add MongoDB Service

1. In your Railway project, click **"New"** → **"Database"** → **"MongoDB"**
2. Railway will provision a MongoDB instance
3. Note the connection details (you'll need the connection string)

### Step 3: Deploy Backend

**Option A: GitHub Integration (Recommended)**

1. Connect your GitHub repository
2. Railway will auto-detect your Dockerfile
3. Set the **Root Directory** to `backend` (if your repo has frontend/backend structure)
4. Railway will automatically build and deploy

**Option B: Railway CLI**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Step 4: Configure Environment Variables

In Railway dashboard, go to your backend service → **Variables** tab, and set:

**Required:**
- `MONGODB_URI` - Your MongoDB connection string from Railway MongoDB service
  - Format: `mongodb://mongo:password@host:port/`
  - Railway MongoDB service provides this automatically as `MONGO_URL` or similar
- `MONGODB_DATABASE` - Database name (e.g., `codejam25`)

**Optional but Recommended:**
- `GEMINI_API_KEY` or `GOOGLE_API_KEY` - For AI features
- `FLASK_ENV=production`
- `FLASK_DEBUG=0`
- `ALLOWED_ORIGINS` - Your frontend URL(s), comma-separated (e.g., `https://yourdomain.com,https://www.yourdomain.com`)

**Note:** Railway automatically sets `PORT` - you don't need to set it manually!

### Step 5: Connect MongoDB to Backend

1. In Railway dashboard, go to your **MongoDB service**
2. Find the connection string or connection variables
3. Copy the connection string
4. In your **Backend service** → Variables, set `MONGODB_URI` to this connection string

**Pro tip:** Railway services on the same project can reference each other. The MongoDB service might expose variables like `MONGO_URL` that you can reference.

### Step 6: Verify Deployment

1. Check **Deployments** tab - should show "Active"
2. Check **Logs** tab - should show:
   ```
   ✅ Connected to MongoDB: codejam25
   Starting Flask application on port XXXX...
   ```
3. Your backend should be accessible at the Railway-provided URL

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGODB_URI` | ✅ Yes | MongoDB connection string | `mongodb://user:pass@host:port/` |
| `MONGODB_DATABASE` | ✅ Yes | Database name | `codejam25` |
| `PORT` | ❌ No | Set automatically by Railway | `8000` |
| `GEMINI_API_KEY` | ⚠️ If using AI | Google Gemini API key | `your-key` |
| `FLASK_ENV` | ❌ No | Environment mode | `production` |
| `FLASK_DEBUG` | ❌ No | Debug mode | `0` |
| `ALLOWED_ORIGINS` | ❌ No | CORS allowed origins | `https://yourdomain.com` |

## Troubleshooting

### Build Fails

**Check:**
- Dockerfile is in the `backend/` directory
- Root directory is set correctly in Railway
- Build logs for specific errors

### App Won't Start

**Check logs for:**
- MongoDB connection errors → Verify `MONGODB_URI`
- Port binding errors → Railway handles this automatically
- Missing dependencies → Check `requirements.txt`

### MongoDB Connection Issues

**Solutions:**
1. Verify `MONGODB_URI` is set correctly
2. Check MongoDB service is running
3. Ensure MongoDB and Backend are in the same Railway project
4. Check network connectivity (Railway services in same project can communicate)

### SocketIO Not Working

**Verify:**
- Eventlet is installed (it's in requirements.txt)
- Gunicorn is using eventlet worker (configured in start.sh)
- Check logs for worker-related errors

## Production Best Practices

1. ✅ **Set `FLASK_ENV=production`** - Disables debug mode
2. ✅ **Set `FLASK_DEBUG=0`** - Explicitly disable debugging
3. ✅ **Configure `ALLOWED_ORIGINS`** - Restrict CORS to your frontend domain
4. ✅ **Use Railway's MongoDB** - Managed database with backups
5. ✅ **Monitor logs** - Use Railway's logs dashboard
6. ✅ **Set up custom domain** - In Railway service settings

## Local Testing Before Deployment

Test your Docker setup locally:

```bash
# Build the image
docker build -t codejam25-backend .

# Run with environment variables
docker run -p 8000:8000 \
  -e MONGODB_URI="mongodb://localhost:27017/" \
  -e MONGODB_DATABASE="codejam25" \
  -e PORT=8000 \
  codejam25-backend
```

## Next Steps

1. ✅ Deploy to Railway
2. ✅ Configure environment variables
3. ✅ Test your API endpoints
4. ✅ Connect your frontend to the Railway backend URL
5. ✅ Set up custom domain (optional)
6. ✅ Configure CI/CD for automatic deployments

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

