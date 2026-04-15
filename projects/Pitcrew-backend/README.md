# Pitcrew Backend

## Local Setup

1. Copy env file: `cp .env.example .env`
2. Generate Prisma client: `npx prisma generate`
3. Run migrations: `npx prisma migrate dev`
4. Start backend: `npm run dev`

Default local port: `3001`.

## Vercel Baseline

This project now includes a Vercel serverless entrypoint:

- `api/index.ts`
- `vercel.json`

### Deploy Steps

1. Create a Vercel project with root directory set to `projects/Pitcrew-backend`.
2. Set required environment variables:
	 - `DATABASE_URL`
	 - `ALLOWED_ORIGINS`
	 - `AUTH_REQUIRED`
	 - `AUTH_SESSION_TTL_MS`
	 - Algorand/indexer variables from `.env.example`
3. Deploy with Vercel CLI or Git integration.

### Important Runtime Notes

- Local-only behaviors are disabled automatically on Vercel (`VERCEL` env):
	- server listen loop
	- in-process cron scheduler
- Socket.IO and in-memory session maps are still present and are not production-safe on serverless.
- For full production parity on Vercel, migrate session storage to persistent storage and move realtime/cron work to external services or scheduled endpoints.
