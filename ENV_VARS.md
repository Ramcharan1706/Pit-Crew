# Environment Variables Reference

This document describes all environment variables used in Pitcrew.

---

## Backend Environment Variables (.env / Render)

### Database Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `DATABASE_URL` | string | ✅ Yes | none | PostgreSQL connection string. Set automatically by Render if using Render's database service. Format: `postgresql://user:password@host:port/database` |

### Server Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NODE_ENV` | string | ✅ Yes | development | Sets application environment. Use `production` for Render. |
| `PORT` | number | ❌ No | 3001 | Port for API server. Render typically uses 3001. |

### CORS Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `ALLOWED_ORIGINS` | string | ❌ No | (all) | Comma-separated list of allowed origins for CORS. **Production:** `https://pit-crew-silk.vercel.app` |

**Example:**
```
ALLOWED_ORIGINS=https://pit-crew.vercel.app,https://example.com
```

### Algorand Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `ALGOD_SERVER` | string | ❌ No | https://testnet-api.algonode.cloud | Algorand node server URL for reading blockchain state. |
| `ALGOD_PORT` | string | ❌ No | (empty) | Port for Algorand node (usually empty for public nodes). |
| `ALGOD_TOKEN` | string | ❌ No | (empty) | Authentication token for Algorand node (usually empty for public nodes). |
| `INDEXER_SERVER` | string | ❌ No | https://testnet-idx.algonode.cloud | Algorand Indexer server URL for querying blockchain data. |
| `INDEXER_PORT` | string | ❌ No | (empty) | Port for Algorand Indexer (usually empty for public nodes). |

**Algorand Network Options:**
- **Testnet (Development):** `https://testnet-api.algonode.cloud`
- **Mainnet (Production):** `https://mainnet-api.algonode.cloud`

### Authentication Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `AUTH_REQUIRED` | boolean | ❌ No | false | Require authentication for all endpoints. Set to `true` in production. |
| `AUTH_SESSION_TTL_MS` | number | ❌ No | 3600000 | Session timeout in milliseconds (1 hour = 3600000). |

### API Keys & Third-Party Services

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `COINGECKO_API_KEY` | string | ❌ No | (empty) | CoinGecko API key for price data (free tier doesn't require key). |

---

## Frontend Environment Variables (.env.production / Vercel)

**Note:** All frontend variables must be prefixed with `VITE_` to be exposed in the browser bundle.

### Backend API Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `VITE_BACKEND_URL` | string | ✅ Yes | http://localhost:3001 | Backend API base URL. **Production:** `https://pitcrew-api.onrender.com` |

**Examples:**
```
Development:  http://localhost:3001
Production:   https://pitcrew-api.onrender.com
Custom:       https://api.mycompany.com
```

### Environment Type

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `VITE_ENVIRONMENT` | string | ❌ No | development | Application environment name for logging/tracking. |

### Algorand Network Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `VITE_ALGOD_SERVER` | string | ✅ Yes | https://testnet-api.algonode.cloud | Algorand node server for blockchain interactions. |
| `VITE_ALGOD_PORT` | string | ❌ No | (empty) | Port for Algorand node (usually empty for public nodes). |
| `VITE_ALGOD_TOKEN` | string | ❌ No | (empty) | Authentication token for Algorand node (usually empty for public nodes). |
| `VITE_ALGOD_NETWORK` | string | ❌ No | testnet | Network identifier: `testnet` or `mainnet`. |
| `VITE_INDEXER_SERVER` | string | ✅ Yes | https://testnet-idx.algonode.cloud | Algorand Indexer server for data queries. |
| `VITE_INDEXER_PORT` | string | ❌ No | (empty) | Port for Algorand Indexer (usually empty for public nodes). |
| `VITE_INDEXER_TOKEN` | string | ❌ No | (empty) | Authentication token for Algorand Indexer (usually empty for public nodes). |

**Network Options:**
```
Testnet (Development):
  VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
  VITE_ALGOD_NETWORK=testnet
  VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud

Mainnet (Production):
  VITE_ALGOD_SERVER=https://mainnet-api.algonode.cloud
  VITE_ALGOD_NETWORK=mainnet
  VITE_INDEXER_SERVER=https://mainnet-idx.algonode.cloud
```

---

## Development vs. Production

### Development Setup

**Backend (.env):**
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost/pitcrew_dev
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
ALGOD_SERVER=https://testnet-api.algonode.cloud
INDEXER_SERVER=https://testnet-idx.algonode.cloud
AUTH_REQUIRED=false
```

**Frontend (.env or .env.development):**
```
VITE_BACKEND_URL=http://localhost:3001
VITE_ENVIRONMENT=development
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_ALGOD_NETWORK=testnet
VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud
```

### Production Setup

**Backend (Render environment variables):**
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://[set by Render]
ALLOWED_ORIGINS=https://pit-crew.vercel.app
ALGOD_SERVER=https://testnet-api.algonode.cloud
INDEXER_SERVER=https://testnet-idx.algonode.cloud
AUTH_REQUIRED=false
AUTH_SESSION_TTL_MS=3600000
```

**Frontend (Vercel environment variables):**
```
VITE_BACKEND_URL=https://pitcrew-api.onrender.com
VITE_ENVIRONMENT=production
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_ALGOD_NETWORK=testnet
VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud
```

---

## Configuration by Platform

### Render Backend

Set environment variables in Render dashboard:

1. Go to service → Environment
2. Add each variable
3. Click Save (triggers redeploy)

**Important:** `DATABASE_URL` is set automatically by Render database service.

### Vercel Frontend

Set environment variables in Vercel dashboard:

1. Go to project → Settings → Environment Variables
2. Add variable name and value
3. Select environment (Production, Preview, Development)
4. Save (redeploy necessary for Production)

---

## Common Issues & Solutions

### Backend Can't Connect to Database

**Problem:** `DATABASE_URL` is not set or invalid

**Solution:**
1. Verify database exists on Render
2. Check connection string format
3. Ensure password doesn't contain special characters (URL encode if needed)

### Frontend Can't Reach Backend

**Problem:** CORS error or network error

**Solution:**
1. Verify `VITE_BACKEND_URL` is correct
2. Check `ALLOWED_ORIGINS` includes frontend URL
3. Restart backend service to apply CORS changes

### Wrong Network Being Used

**Problem:** Frontend connects to testnet but should be mainnet

**Solution:**
1. Update `VITE_ALGOD_NETWORK` to `mainnet`
2. Update `VITE_ALGOD_SERVER` to mainnet endpoint
3. Update `VITE_INDEXER_SERVER` to mainnet endpoint
4. Redeploy frontend

### Sensitive Data Accidentally Committed

**Problem:** API key or password was pushed to GitHub

**Solution:**
1. Immediately rotate compromised credentials
2. Use GitHub's history rewriting to remove (advanced)
3. Review `.gitignore` to prevent future leaks
4. Never commit `.env` files

---

## Security Best Practices

1. **Never hardcode secrets** - Always use environment variables
2. **Don't commit .env files** - Verify `.gitignore` includes them
3. **Use strong passwords** - PostgreSQL password should be complex
4. **Rotate keys regularly** - Change API keys and passwords periodically
5. **Use HTTPS only** - Production endpoints should always use HTTPS
6. **Validate all inputs** - Server should validate data from frontend
7. **Rate limit API** - Prevent abuse with rate limiting
8. **Log securely** - Don't log sensitive data

---

## Monitoring & Updates

### Check Current Configuration

**Backend:**
```bash
# Don't do this in production! Only on local machine:
cat /path/to/.env
```

**Frontend (Browser Console):**
```javascript
// Check which backend URL is loaded
console.log(import.meta.env.VITE_BACKEND_URL)
```

### Update After Deployment

All environment variable changes require:

**Render:**
- Update in dashboard
- Automatic or manual redeploy
- Service restarts with new variables

**Vercel:**
- Update in dashboard  
- Automatic redeploy on Production
- Manual redeploy if needed immediately

---

## Reference URLs

- **Algorand Testnet:** https://testnet.algoexplorer.io
- **Algorand Mainnet:** https://algoexplorer.io
- **AlgoNode Public Nodes:** https://www.algonode.cloud
- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs

---

**Last Updated:** [Current Date]
**Version:** 1.0
