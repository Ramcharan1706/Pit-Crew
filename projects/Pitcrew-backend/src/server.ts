import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import * as http from 'http';
import * as dotenv from 'dotenv';
import algosdk from 'algosdk';

dotenv.config();

// ----------- ENV -----------
const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

if (!process.env.DATABASE_URL) {
console.error('DATABASE_URL missing');
process.exit(1);
}

// ----------- INIT -----------
const app = express();
const prisma = new PrismaClient();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// ----------- SOCKET -----------
const io = new Server(server, {
cors: { origin: '*' }
});

// ----------- ALGOD -----------
const algodClient = new algosdk.Algodv2(
'',
'https://testnet-api.algonode.cloud',
''
);

// ----------- HELPERS -----------
const delay = (ms: number) =>
new Promise(resolve => setTimeout(resolve, ms));

// ----------- TRANSACTION CHECK -----------
async function fetchConfirmedTransaction(txnId: string): Promise<boolean> {
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

  if (confirmedRound > 0) {
    return true;
  }

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
console.error('Transaction error:', error);
return false;
}
}

// ----------- ROUTES -----------
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

// ----------- SOCKET -----------
io.on('connection', (socket) => {
console.log('Socket connected:', socket.id);

socket.on('disconnect', () => {
console.log('Socket disconnected:', socket.id);
});
});

// ----------- START SERVER -----------
if (!IS_VERCEL) {
const PORT = Number(process.env.PORT) || 3001;

server.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});
}

// ----------- SHUTDOWN -----------
process.on('SIGINT', async () => {
console.log('Shutting down...');
await prisma.$disconnect();
process.exit(0);
});

export default app;
