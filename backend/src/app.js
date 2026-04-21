/**
 * app.js
 * Express application setup for the InwitClipps API and generated marketing site.
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
import { registerMarketingSite } from './static-site.js';

const app = express();

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino/file', options: { destination: 1 } }
      : undefined,
});

app.use(requestId);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(
  pinoHttp({
    logger,
    customProps: (req) => ({ requestId: req.id }),
    autoLogging: { ignore: (req) => req.url === '/health' },
  }),
);

app.use(express.json({ limit: '2mb' }));

app.use('/api/v1/jobs', jobsRouter);
app.use('/api/v1', clipsRouter);
app.use('/api/v1/trends', trendsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'inwitclipps-api', uptime: process.uptime() });
});

registerMarketingSite(app);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, _next) => {
  const status = err.status || 500;
  logger.error({ err, requestId: req.id }, err.message);
  res.status(status).json({
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
