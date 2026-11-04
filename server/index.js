import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { prisma } from './db.js';
import { HttpError } from './routes/http.js';
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import progressRoutes from './routes/progress.js';
import assessmentRoutes from './routes/assessment.js';
import srsRoutes from './routes/srs.js';
import tutorRoutes from './routes/tutor.js';
import sandboxRoutes from './routes/sandbox.js';
import { engineConfigured } from './aiEngine.js';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  cors({
    origin: CLIENT_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true,
  }),
);
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'atlas-api',
    engine: engineConfigured() ? 'python' : 'local',
    sandbox: process.env.NODE_ENV === 'production' && process.env.SANDBOX_ALLOW !== 'true' ? 'disabled' : 'enabled',
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/srs', srsRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/sandbox', sandboxRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' });
});

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message, code: error.code ?? 'ERROR', details: error.details });
    return;
  }
  if (error?.code === 'P2002') {
    res.status(409).json({ error: 'That record already exists.', code: 'DUPLICATE' });
    return;
  }
  if (error?.code === 'P2025') {
    res.status(404).json({ error: 'Record not found.', code: 'NOT_FOUND' });
    return;
  }
  console.error(`[atlas] ${req.method} ${req.originalUrl} failed:`, error);
  res.status(500).json({
    error: 'The server hit an unexpected error. Nothing was charged; try again.',
    code: 'INTERNAL',
  });
});

const server = app.listen(PORT, () => {
  console.log(`[atlas] API listening on http://localhost:${PORT}`);
  console.log(`[atlas] CORS origin: ${CLIENT_ORIGIN}`);
  console.log(`[atlas] tutoring engine: ${engineConfigured() ? 'python (ai-engine)' : 'local deterministic'}`);
});

async function shutdown(signal) {
  console.log(`[atlas] ${signal} received, closing`);
  server.close();
  await prisma.$disconnect().catch(() => {});
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
