import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import * as http from 'http';
import cron from 'node-cron';
import * as dotenv from 'dotenv';
import algosdk from 'algosdk';
import axios from 'axios';
import * as crypto from 'crypto';
import { CreateIntentDto, Intent, PriceData } from './lib/types';

dotenv.config();

// ----------- ENV VALIDATION -----------
const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

if (!process.env.DATABASE_URL) {
console.error('❌ DATABASE_URL is not set');
process.exit(1);
}

// ----------- APP INIT -----------
const app = express();
const prisma = new PrismaClient({
log: ['error', 'warn'],
});
const server = http.createServer(app);

// ----------- CORS CONFIG -----------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
.split(',')
.map(o => o.trim())
.filter(Boolean);

app.use(cors({
origin: allowedOrigins.length > 0 ? allowedOrigins : '*'
}));

app.use(express.json());

// ----------- SOCKET.IO -----------
const io = new Server(server, {
cors: {
origin: allowedOrigins.length > 0 ? allowedOrigins : '*'
}
});

// ----------- CONSTANTS -----------
const MAX_CONFIRMATION_POLLS = 8;

// ----------- ALGOD CLIENT -----------
const algodClient = new algosdk.Algodv2(
'',
'https://testnet-api.algonode.cloud',
''
);

// ----------- UTILITIES -----------

const delay = (ms: number) =>
new Promise(resolve => setTimeout(resolve, ms));

function validateAlgoAddress(address: string): boolean {
return algosdk.isValidAddress(address.trim());
}

function normalizeAddress(address: string): string {
return address.trim();
}

// ----------- SAFE TX CONFIRMATION -----------

async function fetchConfirmedTransaction(txnId: string): Promise<boolean> {
try {
for (let attempt = 0; attempt < MAX_CONFIRMATION_POLLS; attempt++) {
const pendingInfo = await algodClient
.pendingTransactionInformation(txnId)
.do();

```
  const confirmedRound = Number(
    (pendingInfo as any)['confirmed-round'] ??
    (pendingInfo as any).confirmedRound ??
    0
  );

  if (confirmedRound > 0) return true;

  const poolError = String(
    (pendingInfo as any)['pool-error'] ?? ''
  ).trim();

  if (poolError) {
    throw new Error(poolError);
  }

  await delay(500);
}

return false;
```

} catch (error) {
console.error('❌ Transaction confirmation failed:', error);
return false;
}
}

// ----------- ROUTES -----------

app.get('/', (_req, res) => {
res.json({
status: 'ok',
service: 'Pitcrew backend'
});
});

app.get('/health', async (_req, res) => {
try {
await prisma.$queryRaw`SELECT 1`;
res.json({ ok: true });
} catch (error) {
console.error('❌ DB health check failed:', error);
res.status(500).json({ ok: false });
}
});

// ----------- SOCKET -----------

io.on('connection', (socket) => {
console.log(`🔌 Socket connected: ${socket.id}`);

socket.on('join_user', (userAddress: string) => {
if (validateAlgoAddress(userAddress)) {
socket.join(normalizeAddress(userAddress));
} else {
console.warn('⚠️ Invalid address join attempt:', userAddress);
}
});

socket.on('disconnect', () => {
console.log(`❌ Socket disconnected: ${socket.id}`);
});
});

// ----------- SERVER START -----------

if (!IS_VERCEL) {
const PORT = Number(process.env.PORT) || 3001;

server.listen(PORT, () => {
console.log(`🚀 Backend running on port ${PORT}`);
console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});
}

// ----------- GRACEFUL SHUTDOWN -----------

async function shutdown() {
console.log('🛑 Shutting down...');

try {
await prisma.$disconnect();
console.log('✅ Prisma disconnected');
} catch (error) {
console.error('❌ Prisma disconnect error:', error);
}

process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ----------- GLOBAL ERROR HANDLERS -----------

process.on('uncaughtException', (err) => {
console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
console.error('❌ Unhandled Rejection:', reason);
});

export default app;
