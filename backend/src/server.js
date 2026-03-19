/**
 * server.js
 * HTTP server entry point for InwitClipps API.
 *
 * Responsibilities:
 *   1. Validate environment variables (fail-fast on bad config)
 *   2. Start TrendSync cron job (our competitive differentiator)
 *   3. Start Express on PORT
 *   4. Register SIGINT / SIGTERM handlers for graceful shutdown
 *      → close HTTP server, drain DB pool, close Redis
 *
 * Key dependencies: express (via app.js), dotenv, config/env.js, trendfetcher
 */

import 'dotenv/config';
import { env } from './config/env.js';          // validates or throws
import app, { logger } from './app.js';
import { db } from './db/index.js';
import { startTrendFetcher } from './services/trendfetcher.js';

// ── Start TrendSync ────────────────────────────────────────
// Our competitive moat: real-time trend awareness (Opus Clip has zero)
logger.info('🔥 Initializing TrendSync...');
startTrendFetcher();

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🎬 InwitClipps API running on port ${PORT} [${env.NODE_ENV}]`);
  logger.info('📊 TrendSync active — scoring clips against live trends from TikTok, YouTube, X');
});

// ── Graceful shutdown ──────────────────────────────────────
async function shutdown(signal) {
  logger.info(`${signal} received — shutting down`);

  // 1. Stop accepting new connections (in-flight requests finish)
  server.close(() => logger.info('HTTP server closed'));

  // 2. Drain the Postgres connection pool
  try {
    // db.$client is the underlying pg.Pool in drizzle-orm/node-postgres
    await db.$client?.end?.();
    logger.info('DB pool drained');
  } catch { /* already closed */ }

  // Allow a grace period, then force exit
  setTimeout(() => process.exit(0), 5_000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
