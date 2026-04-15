import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import http from 'http';
import cron from 'node-cron';
import dotenv from 'dotenv';
import algosdk from 'algosdk';
import axios from 'axios';
import crypto from 'crypto';
import { CreateIntentDto, Intent, PriceData } from './lib/types';

dotenv.config();

// Detect environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL);

// Logger utility
const logger = {
  info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args),
  debug: (msg: string, ...args: any[]) => IS_PRODUCTION ? null : console.log(`[DEBUG] ${msg}`, ...args),
};

// Validate critical environment variables at startup
if (!process.env.DATABASE_URL) {
  logger.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const app = express();
const prisma = new PrismaClient({
  log: IS_PRODUCTION ? ['error'] : ['error', 'warn'],
});
const server = http.createServer(app);
const normalizeOrigin = (origin: string) => origin.trim().replace(/^['\"]+|['\"]+$/g, '').replace(/\/+$/, '');
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);
const wildcardAllowedOrigins = allowedOrigins
  .filter((origin) => origin.includes('*'))
  .map((origin) => new RegExp(`^${origin
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')}$`, 'i'));
const exactAllowedOrigins = new Set(allowedOrigins.filter((origin) => !origin.includes('*')));

const isOriginAllowed = (origin: string): boolean => {
  const normalized = normalizeOrigin(origin);
  if (exactAllowedOrigins.has(normalized)) {
    return true;
  }

  return wildcardAllowedOrigins.some((pattern) => pattern.test(normalized));
};

logger.info(`Starting Pitcrew backend in ${NODE_ENV} mode`);
logger.info(`CORS origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'allow all (*)'}`);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }

      logger.warn(`Socket blocked by CORS origin policy: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }

      logger.warn(`HTTP blocked by CORS origin policy: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
if (!IS_PRODUCTION) {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

// Centralized error handler middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled request error:', err?.message || err);

  if (err instanceof Error && err.message.includes('prisma://')) {
    logger.error('Prisma datasource URL validation error. DATABASE_URL is not properly configured.');
    res.status(500).json({ error: 'Database configuration error' });
    return;
  }

  const statusCode = err?.statusCode || err?.status || 500;
  const message = err?.message || 'Internal server error';

  res.status(statusCode).json({
    error: IS_PRODUCTION ? 'Internal server error' : message
  });
});

const VALID_STATUSES = new Set<Intent['status']>(['active', 'triggered', 'executed', 'cancelled']);
const VALID_CONDITIONS = new Set<CreateIntentDto['condition']>(['price_drop_pct', 'price_breakout_pct']);
const MIN_EXPIRATION_MINUTES = 5;
const MAX_EXPIRATION_MINUTES = 60 * 24 * 7;
const MAX_CONFIRMATION_POLLS = 8;
const CHALLENGE_TTL_MS = 5 * 60_000;
const SESSION_TTL_MS = Number(process.env.AUTH_SESSION_TTL_MS || 60 * 60_000);
const AUTH_REQUIRED = process.env.AUTH_REQUIRED === 'true';

type StoredIntent = Intent & {
  expirationAt?: Date | null;
  cancelledAt?: Date | null;
  cancelReason?: string | null;
  triggerPrice?: number | null;
  executionTxId?: string | null;
  triggeredAt?: Date | null;
  executedAt?: Date | null;
};

type AuthChallenge = {
  message: string;
  expiresAt: number;
};

type AuthSession = {
  userAddress: string;
  expiresAt: number;
};

type AuthedRequest = express.Request & {
  authAddress?: string;
};

type ProfileSettingsPayload = {
  defaultExpiryMinutes?: number;
  notificationPreferences?: {
    inApp?: boolean;
    triggerAlerts?: boolean;
    executionAlerts?: boolean;
    priceAlerts?: boolean;
  };
};

const authChallenges = new Map<string, AuthChallenge>();
const authSessions = new Map<string, AuthSession>();

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
    // Quick DB health check
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      ok: true,
      db: 'up',
      price: currentAlgoPrice.usd,
      observedAt: currentPriceObservedAt,
      env: NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check failed:', error instanceof Error ? error.message : error);
    res.status(503).json({
      ok: false,
      db: 'down',
      error: IS_PRODUCTION ? 'Service unavailable' : (error instanceof Error ? error.message : 'Unknown error'),
    });
  }
});

app.post('/auth/challenge', (req, res) => {
  const { address } = req.body as { address?: string };
  if (!address || !validateAlgoAddress(address)) {
    return res.status(400).json({ error: 'Valid wallet address required' });
  }

  const normalizedAddress = normalizeAddress(address);
  const nonce = crypto.randomBytes(16).toString('hex');
  const issuedAt = new Date().toISOString();
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;
  const message = [
    'Pitcrew authentication challenge',
    `address:${normalizedAddress}`,
    `nonce:${nonce}`,
    `issued_at:${issuedAt}`,
    'purpose:sign in to Pitcrew backend',
  ].join('\n');

  authChallenges.set(normalizedAddress, { message, expiresAt });
  res.json({ address: normalizedAddress, message, expiresAt: new Date(expiresAt).toISOString() });
});

app.post('/auth/verify', (req, res) => {
  const { address, signature } = req.body as { address?: string; signature?: string };

  if (!address || !validateAlgoAddress(address)) {
    return res.status(400).json({ error: 'Valid wallet address required' });
  }

  if (!signature) {
    return res.status(400).json({ error: 'Signature required' });
  }

  const normalizedAddress = normalizeAddress(address);
  const challenge = authChallenges.get(normalizedAddress);
  if (!challenge || challenge.expiresAt <= Date.now()) {
    authChallenges.delete(normalizedAddress);
    return res.status(401).json({ error: 'Challenge missing or expired' });
  }

  let isValidSignature = false;
  try {
    const encodedMessage = new TextEncoder().encode(challenge.message);
    const encodedSignature = new Uint8Array(Buffer.from(signature, 'base64'));
    isValidSignature = algosdk.verifyBytes(encodedMessage, encodedSignature, normalizedAddress);
  } catch {
    return res.status(400).json({ error: 'Invalid signature encoding' });
  }

  if (!isValidSignature) {
    return res.status(401).json({ error: 'Signature verification failed' });
  }

  authChallenges.delete(normalizedAddress);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  authSessions.set(token, { userAddress: normalizedAddress, expiresAt });

  res.json({
    token,
    address: normalizedAddress,
    expiresAt: new Date(expiresAt).toISOString(),
  });
});

app.get('/auth/session', requireAuth, (req, res) => {
  const session = getSessionForRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'No active session' });
  }

  res.json({
    address: session.userAddress,
    expiresAt: new Date(session.expiresAt).toISOString(),
  });
});

const toProfileSettingsResponse = (settings: {
  walletAddress: string;
  defaultExpiryMinutes: number;
  notificationsInApp: boolean;
  notificationsTrigger: boolean;
  notificationsExecution: boolean;
  notificationsPrice: boolean;
  createdAt: Date;
  updatedAt: Date;
}) => {
  return {
    walletAddress: settings.walletAddress,
    defaultExpiryMinutes: settings.defaultExpiryMinutes,
    notificationPreferences: {
      inApp: settings.notificationsInApp,
      triggerAlerts: settings.notificationsTrigger,
      executionAlerts: settings.notificationsExecution,
      priceAlerts: settings.notificationsPrice,
    },
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
  };
};

app.get('/profile/settings/:walletAddress', requireAuth, async (req, res) => {
  try {
    const request = req as AuthedRequest;
    const walletAddress = normalizeAddress(req.params.walletAddress || '');

    if (!validateAlgoAddress(walletAddress)) {
      return res.status(400).json({ error: 'Valid wallet address required' });
    }

    if (request.authAddress && normalizeAddress(request.authAddress) !== walletAddress) {
      return res.status(403).json({ error: 'Wallet does not own these settings' });
    }

    const settings = await prisma.profileSettings.upsert({
      where: { walletAddress },
      create: {
        walletAddress,
        defaultExpiryMinutes: 60,
      },
      update: {},
    });

    return res.json(toProfileSettingsResponse(settings));
  } catch (error) {
    console.error('Profile settings read error:', error);
    return res.status(400).json({ error: (error as Error).message });
  }
});

app.put('/profile/settings/:walletAddress', requireAuth, async (req, res) => {
  try {
    const request = req as AuthedRequest;
    const walletAddress = normalizeAddress(req.params.walletAddress || '');
    const payload = req.body as ProfileSettingsPayload;

    if (!validateAlgoAddress(walletAddress)) {
      return res.status(400).json({ error: 'Valid wallet address required' });
    }

    if (request.authAddress && normalizeAddress(request.authAddress) !== walletAddress) {
      return res.status(403).json({ error: 'Wallet does not own these settings' });
    }

    const defaultExpiryMinutes = Number(payload.defaultExpiryMinutes);
    if (!Number.isFinite(defaultExpiryMinutes)
      || defaultExpiryMinutes < MIN_EXPIRATION_MINUTES
      || defaultExpiryMinutes > MAX_EXPIRATION_MINUTES) {
      return res.status(400).json({
        error: `defaultExpiryMinutes must be between ${MIN_EXPIRATION_MINUTES} and ${MAX_EXPIRATION_MINUTES}`,
      });
    }

    const preferences = payload.notificationPreferences || {};
    const updated = await prisma.profileSettings.upsert({
      where: { walletAddress },
      create: {
        walletAddress,
        defaultExpiryMinutes,
        notificationsInApp: Boolean(preferences.inApp ?? true),
        notificationsTrigger: Boolean(preferences.triggerAlerts ?? true),
        notificationsExecution: Boolean(preferences.executionAlerts ?? true),
        notificationsPrice: Boolean(preferences.priceAlerts ?? false),
      },
      update: {
        defaultExpiryMinutes,
        notificationsInApp: Boolean(preferences.inApp ?? true),
        notificationsTrigger: Boolean(preferences.triggerAlerts ?? true),
        notificationsExecution: Boolean(preferences.executionAlerts ?? true),
        notificationsPrice: Boolean(preferences.priceAlerts ?? false),
      },
    });

    return res.json(toProfileSettingsResponse(updated));
  } catch (error) {
    console.error('Profile settings update error:', error);
    return res.status(400).json({ error: (error as Error).message });
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

// CoinGecko price fetching with retry logic
const DEFAULT_ALGO_PRICE = { usd: 0.124 }; // Fallback price when API is unavailable
let currentAlgoPrice: PriceData = DEFAULT_ALGO_PRICE;
let currentPriceObservedAt = new Date().toISOString();
let monitoringInProgress = false;
let lastPriceFetchTime = 0;
const MIN_PRICE_FETCH_INTERVAL = 10000; // Minimum 10 seconds between price fetches

async function fetchAlgoPrice(): Promise<PriceData> {
  const now = Date.now();

  // Respect rate limiting: don't fetch more frequently than MIN_PRICE_FETCH_INTERVAL
  if (now - lastPriceFetchTime < MIN_PRICE_FETCH_INTERVAL) {
    return currentAlgoPrice;
  }

  let lastError: Error | null = null;

  // Retry logic with exponential backoff
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd',
        {
          timeout: 5000,
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      const data = response.data as { algorand?: { usd?: number } };
      const price = data.algorand?.usd;

      if (typeof price === 'number' && price > 0) {
        lastPriceFetchTime = now;
        currentPriceObservedAt = new Date().toISOString();
        currentAlgoPrice = { usd: price };
        logger.debug('✓ Successfully fetched ALGO price:', price);
        return { usd: price };
      }

      throw new Error('Invalid price data received');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < 2) {
        // Exponential backoff: 1s, 2s before next attempt
        const delayMs = (attempt + 1) * 1000;
        logger.warn(`Price fetch attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`);
        await delay(delayMs);
      }
    }
  }

  logger.warn('✗ Price fetch failed after 3 attempts:', lastError?.message);
  logger.info('Using cached price:', currentAlgoPrice.usd);

  // Return current cached price if available, otherwise use default
  return currentAlgoPrice.usd > 0 ? currentAlgoPrice : DEFAULT_ALGO_PRICE;
}

function validateAlgoAddress(address: string): boolean {
  return algosdk.isValidAddress(address.trim());
}

function normalizeAddress(address: string): string {
  return address.trim();
}

function extractBearerToken(req: express.Request): string | null {
  const value = req.headers.authorization;
  if (!value) {
    return null;
  }

  const [scheme, token] = value.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token.trim();
}

function getSessionForRequest(req: express.Request): AuthSession | null {
  const token = extractBearerToken(req);
  if (!token) {
    return null;
  }

  const session = authSessions.get(token);
  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    authSessions.delete(token);
    return null;
  }

  return session;
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const request = req as AuthedRequest;
  const session = getSessionForRequest(request);

  if (!session) {
    if (AUTH_REQUIRED) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    next();
    return;
  }

  request.authAddress = session.userAddress;
  next();
}

function resolveOwnerAddress(request: AuthedRequest, fallbackAddress?: string): string | null {
  if (request.authAddress) {
    if (fallbackAddress && normalizeAddress(request.authAddress) !== normalizeAddress(fallbackAddress)) {
      return null;
    }

    return normalizeAddress(request.authAddress);
  }

  if (!fallbackAddress) {
    return null;
  }

  return normalizeAddress(fallbackAddress);
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
    const pendingInfoRecord = pendingInfo as unknown as Record<string, unknown>;
    const confirmedRoundRaw = pendingInfoRecord['confirmed-round'] ?? pendingInfoRecord.confirmedRound ?? 0;
    const confirmedRound = Number(confirmedRoundRaw);
    if (confirmedRound > 0) {
      return true;
    }

    const poolError = String(pendingInfoRecord['pool-error'] ?? '').trim();
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

// Monitor intents cron (every 2 minutes to respect API rate limits)
let cronJob: any = null;
if (!IS_VERCEL) {
  cronJob = cron.schedule('0 */2 * * * *', async () => {
    if (monitoringInProgress) {
      return;
    }

    monitoringInProgress = true;
    try {
      currentAlgoPrice = await fetchAlgoPrice();
      io.emit('price_update', { ...currentAlgoPrice, observedAt: currentPriceObservedAt });
      logger.info('Current ALGO price:', currentAlgoPrice.usd);

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
              logger.info(`Intent ${intent.id} triggered for ${intent.userAddress} at ${currentAlgoPrice.usd}`);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Intent monitor error:', error instanceof Error ? error.message : error);
    } finally {
      monitoringInProgress = false;
    }
  });
}

// APIs
app.post('/intents', requireAuth, async (req, res) => {
  try {
    const request = req as AuthedRequest;
    const data: CreateIntentDto = req.body;
    const ownerAddress = resolveOwnerAddress(request, data.userAddress);

    if (!ownerAddress || !validateAlgoAddress(ownerAddress)) {
      return res.status(400).json({ error: 'Valid user address is required' });
    }

    // Validate inputs
    if (!data.recipient || !validateAlgoAddress(data.recipient)) {
      return res.status(400).json({ error: 'Invalid recipient address' });
    }
    if (normalizeAddress(ownerAddress) === normalizeAddress(data.recipient)) {
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
        userAddress: ownerAddress,
        recipient: normalizeAddress(data.recipient),
        condition: data.condition,
        targetValue: data.targetValue,
        amountAlgo: data.amountAlgo,
        initialPrice: initialPrice.usd,
        status: 'active',
        expirationAt: buildExpirationDate(data.expirationMinutes),
      } as any,
    }) as StoredIntent;
    io.to(ownerAddress).emit('intent_created', intent);
    logger.info(`Intent created: ${intent.id} for ${ownerAddress}`);
    res.status(201).json(intent);
  } catch (error) {
    logger.error('Intent creation error:', error instanceof Error ? error.message : error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create intent' });
  }
});

app.get('/intents/:userAddress', requireAuth, async (req, res) => {
  const request = req as AuthedRequest;
  const { userAddress } = req.params;

  if (request.authAddress && normalizeAddress(request.authAddress) !== normalizeAddress(userAddress)) {
    return res.status(403).json({ error: 'Wallet does not own this intent list' });
  }

  const intents = await prisma.intent.findMany({
    where: { userAddress: normalizeAddress(userAddress) },
    orderBy: { createdAt: 'desc' },
  }) as StoredIntent[];
  res.json(intents);
});

app.get('/intents/:userAddress/search', requireAuth, async (req, res) => {
  try {
    const request = req as AuthedRequest;
    const { userAddress } = req.params;

    if (request.authAddress && normalizeAddress(request.authAddress) !== normalizeAddress(userAddress)) {
      return res.status(403).json({ error: 'Wallet does not own this intent list' });
    }

    const {
      q,
      status,
      condition,
      amount_min,
      amount_max,
      limit = '25',
      offset = '0',
      sort_by = 'createdAt',
      sort_order = 'desc',
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 25, 100);
    const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

    const where: any = {
      userAddress: normalizeAddress(userAddress),
    };

    if (q) {
      const searchStr = (q as string).trim();
      where.OR = [
        { id: { contains: searchStr, mode: 'insensitive' } },
        { recipient: { contains: searchStr, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (condition && condition !== 'all') {
      where.condition = condition;
    }

    if (amount_min || amount_max) {
      where.amountAlgo = {};
      if (amount_min) {
        where.amountAlgo.gte = parseFloat(amount_min as string);
      }
      if (amount_max) {
        where.amountAlgo.lte = parseFloat(amount_max as string);
      }
    }

    const orderByMap: Record<string, any> = {
      createdAt: { createdAt: sort_order || 'desc' },
      amount: { amountAlgo: sort_order || 'desc' },
      recipient: { recipient: sort_order || 'asc' },
      status: { status: sort_order || 'asc' },
    };

    const orderBy = orderByMap[sort_by as string] || { createdAt: 'desc' };

    const [intents, total] = await Promise.all([
      prisma.intent.findMany({
        where,
        orderBy,
        take: limitNum,
        skip: offsetNum,
      }),
      prisma.intent.count({ where }),
    ]);

    res.json({
      data: intents,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(400).json({ error: (error as Error).message || 'Search failed' });
  }
});

app.get('/intent/:id', requireAuth, async (req, res) => {
  const request = req as AuthedRequest;
  const { id } = req.params;
  const intent = await prisma.intent.findUnique({ where: { id } });

  if (!intent) {
    return res.status(404).json({ error: 'Intent not found' });
  }

  if (request.authAddress && normalizeAddress(request.authAddress) !== normalizeAddress(intent.userAddress)) {
    return res.status(403).json({ error: 'Wallet does not own this intent' });
  }

  res.json(intent);
});

app.patch('/intents/:id/status', requireAuth, async (req, res) => {
  try {
    const request = req as AuthedRequest;
    const { id } = req.params;
    const { status } = req.body;
    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Unsupported intent status' });
    }

    if (request.authAddress) {
      const existingIntent = await prisma.intent.findUnique({ where: { id } });
      if (!existingIntent) {
        return res.status(404).json({ error: 'Intent not found' });
      }

      if (normalizeAddress(existingIntent.userAddress) !== normalizeAddress(request.authAddress)) {
        return res.status(403).json({ error: 'Wallet does not own this intent' });
      }
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

app.post('/intents/:id/cancel', requireAuth, async (req, res) => {
  try {
    const request = req as AuthedRequest;
    const { id } = req.params;
    const { userAddress, reason } = req.body as { userAddress?: string; reason?: string };
    const ownerAddress = resolveOwnerAddress(request, userAddress);

    if (!ownerAddress || !validateAlgoAddress(ownerAddress)) {
      return res.status(400).json({ error: 'Valid wallet address is required to cancel an intent' });
    }

    const intent = await prisma.intent.findUnique({ where: { id } });
    if (!intent) {
      return res.status(404).json({ error: 'Intent not found' });
    }

    if (normalizeAddress(intent.userAddress) !== normalizeAddress(ownerAddress)) {
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
    logger.info(`Intent ${id} cancelled for ${ownerAddress}`);
    res.json(cancelledIntent);
  } catch (error) {
    logger.error('Cancel error:', error instanceof Error ? error.message : error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to cancel intent' });
  }
});

// Confirm transaction execution
app.post('/intents/:id/confirm-execution', requireAuth, async (req, res) => {
  try {
    const request = req as AuthedRequest;
    const { id } = req.params;
    const { txnId, userAddress } = req.body as { txnId?: string; userAddress?: string };
    const ownerAddress = resolveOwnerAddress(request, userAddress);

    if (!txnId) {
      return res.status(400).json({ error: 'Transaction ID required' });
    }

    const intent = await prisma.intent.findUnique({ where: { id } }) as StoredIntent | null;
    if (!intent) {
      return res.status(404).json({ error: 'Intent not found' });
    }

    if (ownerAddress && normalizeAddress(ownerAddress) !== normalizeAddress(intent.userAddress)) {
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
      logger.info(`Intent ${id} executed with txn ${txnId}`);
      res.json(finalIntent);
    } catch (algodError) {
      logger.warn('Confirmation check failed:', algodError instanceof Error ? algodError.message : algodError);
      return res.status(202).json({ status: 'pending', message: 'Transaction still being confirmed' });
    }
  } catch (error) {
    logger.error('Confirmation error:', error instanceof Error ? error.message : error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to confirm execution' });
  }
});

// Socket connection with proper cleanup
io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id}`);

  socket.on('join_user', (userAddress: string) => {
    if (validateAlgoAddress(userAddress)) {
      const normalized = normalizeAddress(userAddress);
      socket.join(normalized);
      logger.debug(`User ${normalized} joined`);
    } else {
      logger.warn(`Invalid address attempted to join: ${userAddress}`);
      socket.emit('error', { message: 'Invalid wallet address' });
    }
  });

  socket.on('leave_user', (userAddress: string) => {
    if (validateAlgoAddress(userAddress)) {
      const normalized = normalizeAddress(userAddress);
      socket.leave(normalized);
      logger.debug(`User ${normalized} left`);
    }
  });

  socket.on('disconnect', () => {
    logger.debug(`Socket disconnected: ${socket.id}`);
  });
});

// Only for Render/self-hosted, not Vercel
if (!IS_VERCEL) {
  void fetchAlgoPrice().then((price) => {
    currentAlgoPrice = price;
    io.emit('price_update', { ...currentAlgoPrice, observedAt: currentPriceObservedAt });
  }).catch(err => {
    logger.warn('Initial price fetch failed:', err instanceof Error ? err.message : err);
  });

  const PORT = parseInt(process.env.PORT || '3001', 10);
  server.listen(
    { port: PORT, host: '0.0.0.0' },
    () => {
      logger.info(`✓ Backend running on http://0.0.0.0:${PORT}`);
      logger.info(`✓ Environment: ${NODE_ENV}`);
      logger.info(`✓ Database: ${process.env.DATABASE_URL?.split('@')[1] || 'configured'}`);
      logger.info(`✓ Socket.IO listening on port ${PORT}`);
    }
  ).on('error', (err) => {
    logger.error('Server failed to start:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
} else {
  // For Vercel: export app for serverless function
  logger.info('Running in Vercel serverless mode');

  const PORT = parseInt(process.env.PORT || '3001', 10);
  server.listen(PORT, () => {
    logger.info(`✓ Backend running on http://localhost:${PORT}`);
    logger.info(`✓ Database: ${process.env.DATABASE_URL?.split('@')[1] || 'configured'}`);
    logger.info(`✓ Socket.IO listening on port ${PORT}`);
  }).on('error', (err) => {
    logger.error('Server failed to start:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

// Graceful shutdown with proper cleanup
const shutdown = async (signal: string) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Cancel cron job
    if (cronJob) {
      cronJob.stop();
      logger.info('Cron job stopped');
    }

    // Close all socket connections
    io.close();
    logger.info('Socket.IO closed');

    // Disconnect Prisma
    await prisma.$disconnect();
    logger.info('Database connection closed');

    logger.info('✓ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error instanceof Error ? error.message : error);
  logger.error(error instanceof Error ? (error.stack || 'No stack trace available') : 'No stack trace available');
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at promise:', promise);
  logger.error('Reason:', reason instanceof Error ? reason.message : reason);
  shutdown('UNHANDLED_REJECTION');
});

export default app;
