import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import * as http from 'http';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
console.error('DATABASE_URL missing');
process.exit(1);
}

const app = express();
const prisma = new PrismaClient();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
res.json({ status: 'ok' });
});

app.get('/health', async (_req, res) => {
try {
await prisma.$queryRaw`SELECT 1`;
res.json({ ok: true });
} catch {
res.status(500).json({ ok: false });
}
});

const PORT = Number(process.env.PORT) || 3001;

server.listen(PORT, () => {
console.log(`Server running on ${PORT}`);
});

process.on('SIGINT', async () => {
await prisma.$disconnect();
process.exit(0);
});
