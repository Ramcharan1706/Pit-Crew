# Pitcrew Backend

Algorand-powered DeFi intent automation backend. Express + TypeScript + PostgreSQL + Socket.IO.

**Status**: ✅ Production Ready (Render)

---

## Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with local PostgreSQL credentials

# 3. Setup database
npx prisma migrate dev

# 4. Start development server
npm run dev
```

Server runs on `http://localhost:3001` with hot-reload via `tsx`.

### Production (Render)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete 30-minute deployment guide.

Quick version:
1. Create PostgreSQL database on Render
2. Create Web Service linked to GitHub
3. Set environment variables in Render dashboard
4. Push to main branch → Auto-deploys

Production URL: `https://pitcrew-api.onrender.com` (or your Render domain)

---

## API Documentation

### Core Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/intents` | Yes | Create new intent |
| GET | `/intents/:userAddress` | Yes | List user's intents |
| GET | `/intents/:userAddress/search` | Yes | Search intents |
| GET | `/intent/:id` | Yes | Get intent details |
| PATCH | `/intents/:id/status` | Yes | Update intent status |
| POST | `/intents/:id/cancel` | Yes | Cancel intent |
| POST | `/intents/:id/confirm-execution` | Yes | Confirm transaction |
| GET | `/health` | No | Health check |

### Authentication (Optional)

```
POST /auth/challenge         → Get challenge message
POST /auth/verify            → Verify signature, get token
GET  /auth/session           → Check active session
```

### Real-Time (Socket.IO)

```javascript
socket.emit('join_user', address)       // Join user updates
socket.emit('leave_user', address)      // Leave user room
socket.on('intent_created', intent)     // New intent created
socket.on('intent_triggered', intent)   // Intent triggered
socket.on('intent_executed', intent)    // Intent executed
socket.on('intent_cancelled', intent)   // Intent cancelled
socket.on('price_update', {usd, observedAt})  // Price updated (every 2 min)
```

---

## Environment Variables

See **[ENV_VARS.md](./ENV_VARS.md)** for complete reference.

**Required for production:**
- `DATABASE_URL` - PostgreSQL connection
- `NODE_ENV` - Set to `production`
- `ALLOWED_ORIGINS` - Frontend domain(s)
- `PORT` - Usually 3001

**Optional:**
- `AUTH_REQUIRED` - Enforce wallet authentication (default: false)
- `ALGOD_SERVER` - Algorand node endpoint
- `INDEXER_SERVER` - Algorand indexer endpoint

---

## Architecture

### Stack
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Realtime**: Socket.IO
- **Blockchain**: Algorand (algosdk)
- **Deployment**: Render (Linux)

### Project Structure
```
src/
├── server.ts          # Main Express app, routes, WebSocket
├── lib/
    └── types.ts       # TypeScript interfaces

prisma/
├── schema.prisma      # Database schema (PostgreSQL)
└── migrations/        # Database migrations

render.yaml           # Render deployment config
package.json          # Dependencies & scripts
tsconfig.json         # TypeScript configuration
```

### Database Schema
- **intents**: User-defined conditional transactions
- **profile_settings**: User preferences

---

## Scripts

```bash
# Development
npm run dev                    # Watch mode with tsx

# Production
npm run build                  # Compile TypeScript
npm run start                  # Run compiled app

# Database
npx prisma generate          # Generate Prisma client
npx prisma migrate dev        # Create migration (local)
npx prisma migrate deploy     # Apply migrations (production)
npx prisma studio            # GUI database browser
```

---

## Deployment

### Local Testing
```bash
npm run build
npm run start
```

### Render Deployment
1. **Prerequisites**: GitHub account, Render account, PostgreSQL
2. **Setup**: Follow [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
3. **Monitor**: View logs in Render dashboard
4. **Support**: Read [DEPLOYMENT.md](./DEPLOYMENT.md) for troubleshooting

### Database Migration
- Local: `npx prisma migrate dev`
- Production: Automatic via build command (`npx prisma migrate deploy`)

### Build Command
```
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

### Start Command
```
npm run start
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Complete deployment + troubleshooting guide |
| **[ENV_VARS.md](./ENV_VARS.md)** | Environment variables reference |
| **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** | 11-phase deployment checklist |
| **[PRODUCTION_READY.md](./PRODUCTION_READY.md)** | What was fixed + status report |

---

## Features

✅ **Intent Management**
- Create, read, update, cancel intents
- Conditional price triggers
- Automatic execution on conditions

✅ **Real-Time Updates**
- WebSocket connections via Socket.IO
- Price updates every 2 minutes
- Intent state changes broadcast live

✅ **Algorand Integration**
- Transaction confirmation tracking
- Wallet authentication
- Network-agnostic (testnet/mainnet)

✅ **Production Ready**
- PostgreSQL with Prisma
- Graceful shutdown handling
- Global error handlers
- Comprehensive logging
- CORS security
- Input validation

✅ **Render Optimized**
- Auto-deployed from GitHub
- Database auto-provisioning
- Environment variable management
- Health checks
- Log streaming

---

## Monitoring

### Health Check
```bash
curl https://your-api.onrender.com/health
```

Response includes DB status, current ALGO price, and environment.

### Logs
- **Local**: Check terminal output
- **Render**: Dashboard → Service → Logs tab

### Error Tracking
- All errors logged with timestamps
- Stack traces in development
- Generic messages in production (security)

---

## Troubleshooting

### Database Connection Failed
1. Check `DATABASE_URL` is set
2. Verify PostgreSQL is running
3. Test locally: `psql -c "SELECT 1"`
4. On Render: Database service must be running

### Build Fails
1. `npm install` succeeds locally?
2. TypeScript compilation: `npm run build`
3. Prisma generate: `npx prisma generate`
4. Check Node version: `node --version` (need 20+)

### CORS Errors
1. Get exact frontend URL
2. Add to `ALLOWED_ORIGINS` in Render
3. Include protocol (`https://`)
4. Restart backend service

### Socket.IO Not Connecting
1. Check browser console for errors
2. Verify CORS origins include frontend
3. Check Render logs for connection errors
4. Ensure Socket.IO port same as API port (3001)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for more troubleshooting.

---

## API Examples

### Create Intent
```bash
curl -X POST http://localhost:3001/intents \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "XXXXXXXX...",
    "recipient": "YYYYYYYY...",
    "condition": "price_drop_pct",
    "targetValue": 10,
    "amountAlgo": 100,
    "expirationMinutes": 1440
  }'
```

### Get Health
```bash
curl http://localhost:3001/health
```

### List Intents
```bash
curl http://localhost:3001/intents/XXXXXXXX...
```

---

## Performance Considerations

- **Price Fetch**: Every 2 minutes (cron, production only)
- **Price Cache**: 10 seconds minimum between API calls
- **DB Indexes**: Optimized on `userAddress`, `status`, `expirationAt`, `createdAt`
- **Socket.IO Ping**: 25 seconds (configurable)
- **Connection Timeout**: 60 seconds
- **Prisma Pool**: Auto-managed (default 10 connections)

---

## Security

✅ **Input Validation**
- Algorand address validation
- Amount/percentage constraints
- Condition type whitelist

✅ **Authentication (Optional)**
- Wallet signature verification
- Session tokens with TTL
- Auth can be enforced via `AUTH_REQUIRED`

✅ **CORS**
- Configurable allowed origins
- Not open to all (`*`) in production
- Credentials supported

✅ **Error Handling**
- No sensitive data leaked in errors (production)
- Stack traces hidden in production
- All errors logged internally

---

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test: `npm run dev`
3. Build: `npm run build` (must succeed)
4. Commit: `git commit -am "feat: description"`
5. Push: `git push origin feature/my-feature`
6. Create Pull Request on GitHub

---

## License

[Add license here]

---

## Support

- **Issues**: GitHub Issues
- **Questions**: Read [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Deployment Help**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Env Variables**: [ENV_VARS.md](./ENV_VARS.md)

---

**Backend Version**: 0.1.0
**Last Updated**: April 15, 2026
**Status**: Production Ready ✅
