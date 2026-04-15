# Production Deployment Guide - Pitcrew

This guide covers deploying Pitcrew to production using **Render** (backend) and **Vercel** (frontend).

---

## Prerequisites

- GitHub account with repository access
- Render account (https://render.com)
- Vercel account (https://vercel.com)
- PostgreSQL database (Render provides this)
- Algorand testnet/mainnet credentials

---

## Architecture Overview

```
Frontend (Vercel)
    ↓ HTTPS API calls
Backend (Render)
    ↓ 
PostgreSQL Database (Render)
    ↓
Algorand Network (testnet/mainnet)
```

---

## Part 1: Backend Deployment (Render)

### Step 1: Create Render Account & Service

1. Go to https://render.com and log in
2. Click "New" → "Web Service"
3. Select "Deploy an existing GitHub repository"
4. Authorize GitHub and select `Pit-Crew` repository

### Step 2: Configure Web Service

**Display Name:** `pitcrew-api`

**Root Directory:** `projects/Pitcrew-backend`

**Runtime:** `Node`

**Build Command:** 
```
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

**Start Command:**
```
npm run start
```

**Plan:** Standard ($12/month) or higher

### Step 3: Add PostgreSQL Database

1. While creating the web service, scroll to "Database"
2. Click "Create Database"
3. **Database Name:** `pitcrew-db`
4. **PostgreSQL Version:** 15
5. **Plan:** Standard ($15/month)

### Step 4: Configure Environment Variables

Add these in Render dashboard under "Environment":

```
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://pit-crew-silk.vercel.app
ALGOD_SERVER=https://testnet-api.algonode.cloud
ALGOD_PORT=
ALGOD_TOKEN=
INDEXER_SERVER=https://testnet-idx.algonode.cloud
INDEXER_PORT=
AUTH_SESSION_TTL_MS=3600000
AUTH_REQUIRED=false
COINGECKO_API_KEY=
```

**Note:** `DATABASE_URL` is automatically set when you create the database.

### Step 5: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Build the project
   - Run Prisma migrations
   - Deploy the API
3. Monitor deployment in the "Logs" tab
4. Once deployed, copy the service URL (e.g., `https://pitcrew-api.onrender.com`)

### Step 6: Verify Backend Health

```bash
curl https://pitcrew-api.onrender.com/api/health
```

Should return a 200 status with health check data.

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Create Vercel Project

1. Go to https://vercel.com and log in
2. Click "Add New..." → "Project"
3. Select "Import Git Repository"
4. Select `Pit-Crew` repository

### Step 2: Configure Project Settings

**Project Name:** `pit-crew` (or your preference)

**Framework:** `Vite` (auto-detected)

**Root Directory:** `projects/Pitcrew-frontend`

### Step 3: Set Environment Variables

In Vercel dashboard, add these in "Settings" → "Environment Variables":

```
VITE_BACKEND_URL=https://pitcrew-api.onrender.com
VITE_ENVIRONMENT=production
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_ALGOD_PORT=
VITE_ALGOD_TOKEN=
VITE_ALGOD_NETWORK=testnet
VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud
VITE_INDEXER_PORT=
VITE_INDEXER_TOKEN=
```

**Important:** Set these for "Production" environment only.

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will automatically:
   - Install dependencies
   - Build TypeScript
   - Build Vite bundle
   - Deploy to CDN
3. Monitor deployment progress
4. Once deployed, you'll get a production URL (e.g., `https://pit-crew.vercel.app`)

### Step 5: Update Backend ALLOWED_ORIGINS

If your Vercel URL differs from the placeholder:

1. Go to Render dashboard
2. Select `pitcrew-api` service
3. Go to "Environment" tab
4. Update `ALLOWED_ORIGINS` to your actual Vercel URL
5. Click "Save" - this will trigger a redeploy

---

## Part 3: Verification Checklist

### Backend API
- [ ] Service is running on Render
- [ ] Database connection is active
- [ ] Health check endpoint responds
- [ ] Logs show no errors
- [ ] CORS is configured for frontend URL

### Frontend
- [ ] Application deploys on Vercel
- [ ] Build completes without errors
- [ ] Can load pages in browser
- [ ] API calls succeed (check Network tab)

### Integration
- [ ] Frontend connects to backend API
- [ ] WebSocket connections work (if applicable)
- [ ] User authentication works
- [ ] Intent creation and execution work

### Database
- [ ] PostgreSQL is provisioned
- [ ] Initial migrations have run
- [ ] Tables exist with correct schema
- [ ] Indexes are present for performance

---

## Part 4: Monitoring & Maintenance

### Render Monitoring

1. Go to Render dashboard
2. Select `pitcrew-api` service
3. Monitor:
   - **Logs:** Application output and errors
   - **Metrics:** CPU, memory, requests
   - **Events:** Deploy status and history

### Vercel Monitoring

1. Go to Vercel dashboard
2. Select `pit-crew` project
3. Monitor:
   - **Deployments:** Deploy history and status
   - **Analytics:** Performance metrics
   - **Functions:** API route performance (if applicable)

### Database Backups

Render automatically backs up PostgreSQL. To restore:

1. Go to database details on Render
2. Click "Restore"
3. Select backup point
4. Confirm restoration

### Environment Variable Updates

To update environment variables after deployment:

**Render (Backend):**
1. Go to service settings
2. Update environment variables
3. Click "Save" - this triggers automatic redeploy

**Vercel (Frontend):**
1. Go to project settings
2. Update environment variables
3. Redeploy manually or auto-redeploy on commit

---

## Part 5: Troubleshooting

### Backend Won't Start

**Symptoms:** Render shows deploy failed

**Solutions:**
1. Check build logs in Render dashboard
2. Verify `npm run build` works locally:
   ```bash
   cd projects/Pitcrew-backend
   npm install
   npm run build
   ```
3. Check environment variables are set correctly
4. Verify DATABASE_URL is valid

### Frontend Build Fails

**Symptoms:** Build fails with TypeScript or dependency errors

**Solutions:**
1. Check build logs in Vercel
2. Verify dependencies locally:
   ```bash
   cd projects/Pitcrew-frontend
   npm install
   npm run build
   ```
3. Check for circular dependencies or missing types
4. Clear Vercel cache and redeploy

### API Connection Issues

**Symptoms:** Frontend can't reach backend ("CORS error", "Network error")

**Solutions:**
1. Verify `ALLOWED_ORIGINS` in Render includes your Vercel URL
2. Check frontend `VITE_BACKEND_URL` is correct
3. Test API directly:
   ```bash
   curl https://pitcrew-api.onrender.com/api/health
   ```
4. Check Render service is running (not crashed/paused)

### Database Connection Errors

**Symptoms:** Backend errors with "database connection failed"

**Solutions:**
1. Verify `DATABASE_URL` environment variable is set
2. Check PostgreSQL is provisioned on Render
3. Test connection string locally (if possible)
4. Check Render service logs for connection errors

---

## Part 6: Post-Deployment Tasks

### Update DNS (Optional)

For custom domains:

1. **Render Backend:**
   - Go to service settings
   - Add custom domain
   - Update DNS records as instructed

2. **Vercel Frontend:**
   - Go to project settings → Domains
   - Add custom domain
   - Update DNS records as instructed

### Enable SSL/TLS

Both Render and Vercel provide free SSL certificates:
- Render: Automatic (HTTPS only)
- Vercel: Automatic (HTTPS only)

### Set Up Error Monitoring (Optional)

Consider adding error tracking:
- **Backend:** Integrate Sentry or similar
- **Frontend:** Integrate Sentry or LogRocket

### Configure Auto-Deploy

Both platforms support auto-deploy on Git push:

**Render:**
1. Service settings → Deploy settings
2. Check "Auto-deploy on push"

**Vercel:**
1. Project settings → Git
2. Enable production deployments on main branch

---

## Quick Reference

| Service | URL | Admin Panel |
|---------|-----|-------------|
| Backend API | https://pitcrew-api.onrender.com | https://dashboard.render.com |
| Frontend | https://pit-crew.vercel.app | https://vercel.com |
| Database | Render PostgreSQL | Render Dashboard |
| Repository | https://github.com/Ramcharan1706/Pit-Crew | GitHub |

---

## Support & Documentation

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Node.js:** https://nodejs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **Algorand DevDocs:** https://developer.algorand.org

---

**Last Updated:** [Current Date]
**Version:** 1.0
