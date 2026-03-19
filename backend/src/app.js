/**
 * app.js
 * Express application setup — middleware stack, route mounting, error handler.
 * Does NOT start the HTTP server; that is handled by server.js.
 *
 * Middleware order matters:
 *   1. requestId  → correlation ID on every request
 *   2. helmet     → security headers (CSP, HSTS, etc.)
 *   3. cors       → cross-origin policy
 *   4. pino-http  → structured request/response logging
 *   5. json body  → parse JSON with size limit
 *   6. routes
 *   7. 404 catch
 *   8. error handler
 *
 * Key dependencies: express, helmet, cors, pino-http
 */

import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import pino from 'pino';
import { requestId } from './middleware/requestId.js';
import jobsRouter from './routes/jobs.js';
import clipsRouter from './routes/clips.js';
import trendsRouter from './routes/trends.js';

const app = express();

// ── Structured logger (shared with pino-http) ──
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino/file', options: { destination: 1 } } // pretty stdout
      : undefined,
});

// ── 1 · Request ID (correlation) ──
app.use(requestId);

// ── 2 · Security headers ──
app.use(helmet());

// ── 3 · CORS ──
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── 4 · Structured request logging ──
app.use(
  pinoHttp({
    logger,
    // Propagate the correlation ID into every log line
    customProps: (req) => ({ requestId: req.id }),
    autoLogging: { ignore: (req) => req.url === '/health' },
  }),
);

// ── 5 · JSON body parser with 2 MB limit ──
app.use(express.json({ limit: '2mb' }));

// ── 6 · Routes ──
app.use('/api/v1/jobs', jobsRouter);
app.use('/api/v1', clipsRouter);
app.use('/api/v1/trends', trendsRouter);

// Health check (excluded from access logs above)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'inwitclipps-api', uptime: process.uptime() });
});

// ── 7 · 404 catch-all ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ── 8 · Global error handler ──
// Must have 4 params so Express recognises it as an error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  logger.error({ err, requestId: req.id }, err.message);
  res.status(status).json({
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
