import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import http from 'http';
import cron from 'node-cron';
import dotenv from 'dotenv';
import algosdk from 'algosdk';
import axios from 'axios';
import { CreateIntentDto, Intent, PriceData } from './lib/types';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const server = http.createServer(app);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  }
});

app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : true }));
app.use(express.json());

const VALID_STATUSES = new Set<Intent['status']>(['active', 'triggered', 'executed', 'cancelled']);
const VALID_CONDITIONS = new Set<CreateIntentDto['condition']>(['price_drop_pct', 'price_breakout_pct']);
const MIN_EXPIRATION_MINUTES = 5;
const MAX_EXPIRATION_MINUTES = 60 * 24 * 7;
const MAX_CONFIRMATION_POLLS = 8;

type StoredIntent = Intent & {
  expirationAt?: Date | null;
  cancelledAt?: Date | null;
  cancelReason?: string | null;
  triggerPrice?: number | null;
  executionTxId?: string | null;
  triggeredAt?: Date | null;
  executedAt?: Date | null;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

app.get('/', (_req, res) => {
  res.json({
    service: 'Pitcrew backend',
    status: 'ok',
    endpoints: ['/intents', '/intents/:userAddress', '/intents/:id/status', '/intents/:id/confirm-execution', '/health'],
  });
});

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: 'up', price: currentAlgoPrice.usd, observedAt: currentPriceObservedAt });
  } catch {
    res.status(500).json({ ok: false, db: 'down' });
  }
});

// Algod client for TestNet
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
const indexerClient = process.env.INDEXER_SERVER
  ? new algosdk.Indexer(
      '',
      process.env.INDEXER_SERVER,
      process.env.INDEXER_PORT ? parseInt(process.env.INDEXER_PORT, 10) : undefined,
    )
  : null;

// CoinGecko price fetching
let currentAlgoPrice: PriceData = { usd: 0 };
let currentPriceObservedAt = new Date().toISOString();
let monitoringInProgress = false;

async function fetchAlgoPrice(): Promise<PriceData> {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd');
    const data = response.data as { algorand: { usd: number } };
    currentPriceObservedAt = new Date().toISOString();
    return { usd: data.algorand.usd };
  } catch (error) {
    console.error('Price fetch error:', error);
    return currentAlgoPrice;
  }
}

function validateAlgoAddress(address: string): boolean {
  return algosdk.isValidAddress(address.trim());
}

function normalizeAddress(address: string): string {
  return address.trim();
}

function buildExpirationDate(expirationMinutes?: number): Date | null {
  if (!expirationMinutes) {
    return null;
  }

  const safeMinutes = Math.min(Math.max(Math.round(expirationMinutes), MIN_EXPIRATION_MINUTES), MAX_EXPIRATION_MINUTES);
  return new Date(Date.now() + safeMinutes * 60_000);
}

function getTriggerPrice(intent: Pick<Intent, 'condition' | 'initialPrice' | 'targetValue'>): number {
  const multiplier = intent.targetValue / 100;
  if (intent.condition === 'price_breakout_pct') {
    return intent.initialPrice * (1 + multiplier);
  }

  return intent.initialPrice * (1 - multiplier);
}

function isIntentTriggered(intent: Pick<Intent, 'condition' | 'initialPrice' | 'targetValue'>, currentPrice: number): boolean {
  const triggerPrice = getTriggerPrice(intent);
  if (intent.condition === 'price_breakout_pct') {
    return currentPrice >= triggerPrice;
  }

  return currentPrice <= triggerPrice;
}

async function fetchConfirmedTransaction(txnId: string): Promise<boolean> {
  for (let attempt = 0; attempt < MAX_CONFIRMATION_POLLS; attempt += 1) {
    const pendingInfo = await algodClient.pendingTransactionInformation(txnId).do();
    const confirmedRound = Number((pendingInfo as { 'confirmed-round'?: number; confirmedRound?: number })['confirmed-round'] ?? (pendingInfo as { confirmedRound?: number }).confirmedRound ?? 0);
    if (confirmedRound > 0) {
      return true;
    }

    const poolError = String((pendingInfo as { 'pool-error'?: string })['pool-error'] ?? '').trim();
    if (poolError) {
      throw new Error(poolError);
    }

    if (attempt < MAX_CONFIRMATION_POLLS - 1) {
      await delay(500);
    }
  }

  if (indexerClient) {
    const searchResult = await indexerClient.searchForTransactions().txid(txnId).limit(1).do();
    if (searchResult.transactions.length > 0) {
      return true;
    }
  }

  return false;
}

async function cancelExpiredIntent(intent: StoredIntent, reason: string) {
  const cancelledAt = new Date();
  const updated = await prisma.intent.updateMany({
    where: { id: intent.id, status: 'active' },
    data: {
      status: 'cancelled',
      cancelledAt,
      cancelReason: reason,
    } as any,
  });

  if (updated.count > 0) {
    const cancelledIntent = await prisma.intent.findUnique({ where: { id: intent.id } });
    if (cancelledIntent) {
      io.to(intent.userAddress).emit('intent_cancelled', cancelledIntent);
    }
  }
}

// Monitor intents cron (every 30s)
cron.schedule('*/30 * * * * *', async () => {
  if (monitoringInProgress) {
    return;
  }

  monitoringInProgress = true;
  try {
    currentAlgoPrice = await fetchAlgoPrice();
    io.emit('price_update', { ...currentAlgoPrice, observedAt: currentPriceObservedAt });
    console.log('Current ALGO price:', currentAlgoPrice.usd);

    const activeIntents = await prisma.intent.findMany({
      where: { status: 'active' },
    }) as StoredIntent[];

    for (const intent of activeIntents) {
      const now = new Date();
      if (intent.expirationAt && intent.expirationAt <= now) {
        await cancelExpiredIntent(intent, 'expired');
        continue;
      }

      if (currentAlgoPrice.usd <= 0) {
        continue;
      }

      if (isIntentTriggered(intent, currentAlgoPrice.usd)) {
        const triggeredAt = new Date();
        const updatedCount = await prisma.intent.updateMany({
          where: { id: intent.id, status: 'active' },
          data: {
            status: 'triggered',
            triggeredAt,
            triggerPrice: currentAlgoPrice.usd,
          } as any,
        });

        if (updatedCount.count > 0) {
          const updatedIntent = await prisma.intent.findUnique({ where: { id: intent.id } });
          if (updatedIntent) {
            io.to(intent.userAddress).emit('intent_triggered', updatedIntent);
            console.log(`Intent ${intent.id} triggered for ${intent.userAddress} at ${currentAlgoPrice.usd}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Intent monitor error:', error);
  } finally {
    monitoringInProgress = false;
  }
});

// APIs
app.post('/intents', async (req, res) => {
  try {
    const data: CreateIntentDto = req.body;

    // Validate inputs
    if (!data.userAddress || !validateAlgoAddress(data.userAddress)) {
      return res.status(400).json({ error: 'Invalid user address' });
    }
    if (!data.recipient || !validateAlgoAddress(data.recipient)) {
      return res.status(400).json({ error: 'Invalid recipient address' });
    }
    if (normalizeAddress(data.userAddress) === normalizeAddress(data.recipient)) {
      return res.status(400).json({ error: 'Recipient must differ from the connected wallet' });
    }
    if (data.amountAlgo <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    if (data.targetValue <= 0 || data.targetValue > 100) {
      return res.status(400).json({ error: 'Target value must be between 0 and 100' });
    }
    if (!VALID_CONDITIONS.has(data.condition)) {
      return res.status(400).json({ error: 'Unsupported condition type' });
    }
    if (data.expirationMinutes !== undefined && (data.expirationMinutes < MIN_EXPIRATION_MINUTES || data.expirationMinutes > MAX_EXPIRATION_MINUTES)) {
      return res.status(400).json({ error: 'Expiration must be between 5 minutes and 7 days' });
    }

    // Fetch initial price from CoinGecko
    const initialPrice = await fetchAlgoPrice();
    if (initialPrice.usd === 0) {
      return res.status(500).json({ error: 'Failed to fetch ALGO price' });
    }

    const intent = await prisma.intent.create({
      data: {
        ...data,
        userAddress: normalizeAddress(data.userAddress),
        recipient: normalizeAddress(data.recipient),
        initialPrice: initialPrice.usd,
        status: 'active',
        expirationAt: buildExpirationDate(data.expirationMinutes),
      } as any,
    }) as StoredIntent;
    io.to(data.userAddress).emit('intent_created', intent);
    res.json(intent);
  } catch (error) {
    console.error('Intent creation error:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get('/intents/:userAddress', async (req, res) => {
  const { userAddress } = req.params;
  const intents = await prisma.intent.findMany({
    where: { userAddress: normalizeAddress(userAddress) },
    orderBy: { createdAt: 'desc' },
  }) as StoredIntent[];
  res.json(intents);
});

app.get('/intent/:id', async (req, res) => {
  const { id } = req.params;
  const intent = await prisma.intent.findUnique({ where: { id } });

  if (!intent) {
    return res.status(404).json({ error: 'Intent not found' });
  }

  res.json(intent);
});

app.patch('/intents/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Unsupported intent status' });
    }
    const intent = await prisma.intent.update({
      where: { id },
      data: { status } as any,
    }) as StoredIntent;
    res.json(intent);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

app.post('/intents/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { userAddress, reason } = req.body as { userAddress?: string; reason?: string };

    if (!userAddress || !validateAlgoAddress(userAddress)) {
      return res.status(400).json({ error: 'Valid wallet address is required to cancel an intent' });
    }

    const intent = await prisma.intent.findUnique({ where: { id } });
    if (!intent) {
      return res.status(404).json({ error: 'Intent not found' });
    }

    if (normalizeAddress(intent.userAddress) !== normalizeAddress(userAddress)) {
      return res.status(403).json({ error: 'Wallet does not own this intent' });
    }

    if (intent.status === 'executed') {
      return res.status(409).json({ error: 'Executed intents cannot be cancelled' });
    }

    const cancelledIntent = await prisma.intent.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: reason || 'Cancelled by user',
      } as any,
    }) as StoredIntent;

    io.to(cancelledIntent.userAddress).emit('intent_cancelled', cancelledIntent);
    res.json(cancelledIntent);
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Confirm transaction execution
app.post('/intents/:id/confirm-execution', async (req, res) => {
  try {
    const { id } = req.params;
    const { txnId, userAddress } = req.body as { txnId?: string; userAddress?: string };

    if (!txnId) {
      return res.status(400).json({ error: 'Transaction ID required' });
    }

    const intent = await prisma.intent.findUnique({ where: { id } }) as StoredIntent | null;
    if (!intent) {
      return res.status(404).json({ error: 'Intent not found' });
    }

    if (userAddress && normalizeAddress(userAddress) !== normalizeAddress(intent.userAddress)) {
      return res.status(403).json({ error: 'Transaction does not belong to this wallet' });
    }

    if (intent.status === 'executed') {
      if (intent.executionTxId === txnId) {
        return res.json(intent);
      }

      return res.status(409).json({ error: 'Intent already executed with a different transaction' });
    }

    if (intent.status !== 'triggered') {
      return res.status(409).json({ error: 'Intent must be triggered before execution confirmation' });
    }

    try {
      const confirmed = await fetchConfirmedTransaction(txnId);
      if (!confirmed) {
        return res.status(202).json({ status: 'pending', message: 'Transaction still being confirmed' });
      }

      const updatedIntent = await prisma.intent.updateMany({
        where: { id, status: 'triggered' },
        data: {
          status: 'executed',
          executedAt: new Date(),
          executionTxId: txnId,
        } as any,
      });

      if (updatedIntent.count === 0) {
        const currentIntent = await prisma.intent.findUnique({ where: { id } }) as StoredIntent | null;
        if (currentIntent?.status === 'executed') {
          return res.json(currentIntent);
        }

        return res.status(409).json({ error: 'Intent status changed before confirmation could be recorded' });
      }

      const finalIntent = await prisma.intent.findUnique({ where: { id } }) as StoredIntent | null;
      if (!finalIntent) {
        return res.status(404).json({ error: 'Intent not found after update' });
      }

      io.to(finalIntent.userAddress).emit('intent_executed', finalIntent);
      res.json(finalIntent);
    } catch (algodError) {
      console.error('Confirmation check failed:', algodError);
      return res.status(202).json({ status: 'pending', message: 'Transaction still being confirmed' });
    }
  } catch (error) {
    console.error('Confirmation error:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Socket connection
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_user', (userAddress: string) => {
    if (validateAlgoAddress(userAddress)) {
      socket.join(normalizeAddress(userAddress));
      console.log(`User ${userAddress} joined`);
    } else {
      console.warn(`Invalid address attempted to join: ${userAddress}`);
    }
  });

  socket.on('leave_user', (userAddress: string) => {
    if (validateAlgoAddress(userAddress)) {
      socket.leave(normalizeAddress(userAddress));
      console.log(`User ${userAddress} left`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Init price
void fetchAlgoPrice().then((price) => {
  currentAlgoPrice = price;
  io.emit('price_update', { ...currentAlgoPrice, observedAt: currentPriceObservedAt });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Connected to database: ${process.env.DATABASE_URL}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
