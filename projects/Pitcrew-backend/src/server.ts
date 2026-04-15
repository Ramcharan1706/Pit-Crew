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

const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

if (!process.env.DATABASE_URL) {
console.error('ERROR: DATABASE_URL environment variable is not set');
process.exit(1);
}

const app = express();
const prisma = new PrismaClient({ log: ['error', 'warn'] });
const server = http.createServer(app);

const io = new Server(server, {
cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// ----------- CONSTANTS -----------
const MAX_CONFIRMATION_POLLS = 8;

// ----------- ALGOD -----------
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');

// ----------- HELPERS -----------
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function validateAlgoAddress(address: string): boolean {
return algosdk.isValidAddress(address.trim());
}

function normalizeAddress(address: string): string {
return address.trim();
}

// ----------- FIXED BIGINT FUNCTION -----------
async function fetchConfirmedTransaction(txnId: string): Promise<boolean> {
for (let attempt = 0; attempt < MAX_CONFIRMATION_POLLS; attempt++) {
const pendingInfo = await algodClient.pendingTransactionInformation(txnId).do();

```
const confirmedRound = Number(
  (pendingInfo as any)['confirmed-round'] ??
  (pendingInfo as any).confirmedRound ??
  0
);

if (confirmedRound > 0) return true;

const poolError = String((pendingInfo as any)['pool-error'] ?? '').trim();
if (poolError) throw new Error(poolError);

await delay(500);
```

}

return false;
}

// ----------- ROUTES -----------

app.get('/', (_req, res) => {
res.json({ status: 'ok', service: 'Pitcrew backend' });
});

app.get('/health', async (_req, res) => {
try {
await prisma.$queryRaw`SELECT 1`;
res.json({ ok: true });
} catch {
res.status(500).json({ ok: false });
}
});

// ----------- SOCKET -----------

io.on('connection', (socket) => {
console.log(`Socket connected: ${socket.id}`);

socket.on('join_user', (userAddress: string) => {
if (validateAlgoAddress(userAddress)) {
socket.join(normalizeAddress(userAddress));
}
});

socket.on('disconnect', () => {
console.log(`Socket disconnected: ${socket.id}`);
});
});

// ----------- SERVER START -----------

if (!IS_VERCEL) {
const PORT = Number(process.env.PORT) || 3001;

server.listen(PORT, () => {
console.log(`Backend running on port ${PORT}`);
});
}

// ----------- SHUTDOWN -----------

process.on('SIGINT', async () => {
await prisma.$disconnect();
process.exit(0);
});

export default app;
