import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import * as http from 'http';
import * as dotenv from 'dotenv';
import algosdk from 'algosdk';

dotenv.config();

// ----------- ENV -----------
if (!process.env.DATABASE_URL) {
console.error('DATABASE_URL missing');
process.exit(1);
}

const PORT = Number(process.env.PORT) || 3001;
const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

// ----------- INIT -----------
const app = express();
const prisma = new PrismaClient({ log: ['error', 'warn'] });
const server = http.createServer(app);

// ----------- MIDDLEWARE -----------
app.use(cors({ origin: '*' }));
app.use(express.json());

// ----------- SOCKET.IO -----------
const io = new Server(server, {
cors: { origin: '*' }
});

io.on('connection', (socket) => {
console.log(`🔌 Socket connected: ${socket.id}`);

socket.on('join', (room: string) => {
if (room) socket.join(room);
});

socket.on('disconnect', () => {
console.log(`❌ Socket disconnected: ${socket.id}`);
});
});

// ----------- ALGOD CLIENT -----------
const algodClient = new algosdk.Algodv2(
'',
'https://testnet-api.algonode.cloud',
''
);

// ----------- UTIL -----------
const delay = (ms: number) =>
new Promise(resolve => setTimeout(resolve, ms));

// ----------- ALGOTXN CHECK -----------
async function fetchConfirmedTransaction(txnId: string): Promise<boolean> {
if (!txnId) return false;

try {
for (let i = 0; i < 8; i++) {
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
    console.error('Algorand pool error:', poolError);
    return false;
  }

  await delay(500);
}

return false;
```

} catch (error) {
console.error('TX check failed:', error);
return false;
}
}

// ----------- ROUTES -----------

// health
app.get('/', (_req, res) => {
res.json({ status: 'ok', service: 'Pitcrew backend' });
});

app.get('/health', async (_req, res) => {
try {
await prisma.$queryRaw`SELECT 1`;
res.json({ ok: true });
} catch (error) {
console.error('DB health error:', error);
res.status(500).json({ ok: false });
}
});

// tx check
app.get('/tx/:id', async (req, res) => {
try {
const txnId = req.params.id;

```
if (!txnId) {
  return res.status(400).json({ error: 'Missing txnId' });
}

const confirmed = await fetchConfirmedTransaction(txnId);

// optional: notify sockets
if (confirmed) {
  io.emit('tx_confirmed', { txnId });
}

res.json({ confirmed });
```

} catch (error) {
console.error('Route error:', error);
res.status(500).json({ error: 'Internal error' });
}
});

// ----------- SERVER START -----------
if (!IS_VERCEL) {
server.listen(PORT, () => {
console.log(`🚀 Server running on ${PORT}`);
});
}

// ----------- SHUTDOWN -----------
async function shutdown() {
console.log('Shutting down...');
await prisma.$disconnect();
process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ----------- GLOBAL ERRORS -----------
process.on('uncaughtException', (err) => {
console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
console.error('Unhandled Rejection:', reason);
});

export default app;
