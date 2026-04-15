# Pit-Crew Deployment Guide

## Architecture
- **Frontend**: Vercel (React + Vite)
- **Backend**: Render/Railway (Node.js + Express)
- **Contracts**: Local only (Python - don't deploy)
- **Database**: PostgreSQL (managed by Render/Railway)

## Frontend Deployment (Vercel)

### Setup
1. Push to GitHub
2. Connect repo to Vercel: https://vercel.com/new
3. Set root dir: `projects/Pitcrew-frontend`
4. Add env var in Vercel dashboard:
   ```
   VITE_BACKEND_URL=https://your-backend-url.com
   ```

### Deploy
```bash
# Automatic: Vercel deploys on push to main
# Or manual:
npm i -g vercel
vercel deploy --prod
```

---

## Backend Deployment (Render)

### Setup
1. Push to GitHub
2. Create service on Render: https://render.com/new/web-service
3. Set:
   - Build command: `npm run build`
   - Start command: `npm start`
   - Root dir: `projects/Pitcrew-backend`
4. Create PostgreSQL database (Render dashboard)
5. Set env vars in Render dashboard:
   ```
   NODE_ENV=production
   DATABASE_URL=<from database connection>
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ALGOD_SERVER=https://testnet-api.algonode.cloud
   INDEXER_SERVER=https://testnet-idx.algonode.cloud
   AUTH_REQUIRED=false
   ```

### Post-Deploy
1. Copy backend URL from Render
2. Update `VITE_BACKEND_URL` in Vercel settings
3. Run migrations: SSH into Render and run `npx prisma migrate deploy`

---

## Local Development

### Frontend
```bash
cd projects/Pitcrew-frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

### Backend
```bash
cd projects/Pitcrew-backend
npm install
npx prisma migrate dev  # First time only
npm run dev
# Runs at http://localhost:3001
```

### Contracts (Dev only, don't deploy)
```bash
cd projects/Pitcrew-contracts
poetry install
# Use locally for testing only
```

---

## Environment Variables Summary

**Frontend** (`VITE_` = public):
- `VITE_BACKEND_URL` = your backend service URL
- `VITE_ALGOD_SERVER` = https://testnet-api.algonode.cloud
- `VITE_INDEXER_SERVER` = https://testnet-idx.algonode.cloud

**Backend** (private):
- `DATABASE_URL` = PostgreSQL connection (set by platform)
- `ALLOWED_ORIGINS` = frontend Vercel URL (CORS)
- `ALGOD_SERVER`, `INDEXER_SERVER` = same as frontend
- `AUTH_SESSION_TTL_MS` = 3600000

---

## Troubleshooting

**Frontend 404 on route refresh?**
- vercel.json rewrites are set ✓

**API calls failing?**
- Check `ALLOWED_ORIGINS` matches frontend URL exactly
- Check `VITE_BACKEND_URL` in Vercel settings

**Backend won't start?**
- Ensure PostgreSQL DATABASE_URL is set
- Run: `npx prisma migrate deploy`

**Python dependencies block build?**
- Contracts aren't deployed (removed from .vercelignore) ✓
