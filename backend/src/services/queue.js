/**
 * services/queue.js
 * BullMQ Queue and Worker factory functions backed by Upstash Redis (ioredis).
 *
 * IMPORTANT: BullMQ requires separate Redis connections for Queue vs Worker
 * instances. Sharing one connection causes blocking conflicts.
 * - Queues share one connection (non-blocking commands only).
 * - Each Worker gets its own connection (uses BRPOPLPUSH / blocking reads).
 *
 * Key dependencies: bullmq, ioredis, dotenv
 */

import 'dotenv/config';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

/** Base options applied to every ioredis instance. */
function redisOpts() {
  return {
    maxRetriesPerRequest: null,   // Required by BullMQ
    enableReadyCheck: false,      // Required for Upstash serverless Redis
    tls: process.env.UPSTASH_REDIS_URL?.startsWith('rediss://') ? {} : undefined,
  };
}

// ── Queue-side connection (singleton, shared by all Queue instances) ──
let queueConnection = null;

function getQueueConnection() {
  if (queueConnection) return queueConnection;

  queueConnection = new Redis(process.env.UPSTASH_REDIS_URL, redisOpts());
  queueConnection.on('error', (err) => console.error('[redis:queue] Error:', err.message));
  queueConnection.on('connect', () => console.log('[redis:queue] Connected'));
  return queueConnection;
}

// ── Track all created workers so we can shut them down gracefully ──
/** @type {Worker[]} */
const activeWorkers = [];

/**
 * Returns a BullMQ Queue instance for the given name.
 * All Queue instances share one Redis connection (safe — non-blocking I/O).
 * @param {string} name  Queue name, e.g. 'download', 'transcription'
 * @returns {Queue}
 */
export function getQueue(name) {
  return new Queue(name, {
    connection: getQueueConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  });
}

/**
 * Returns a BullMQ Worker instance for the given queue name.
 * Each Worker gets its *own* Redis connection (required — uses blocking reads).
 * @param {string} name         Queue name to consume from
 * @param {Function} processorFn Async function(job) that processes each job
 * @param {object} [opts]        Optional overrides (concurrency, limiter, etc.)
 * @returns {Worker}
 */
export function getWorker(name, processorFn, opts = {}) {
  // Dedicated connection per worker — BullMQ requirement
  const workerConn = new Redis(process.env.UPSTASH_REDIS_URL, redisOpts());
  workerConn.on('error', (err) => console.error(`[redis:${name}-worker] Error:`, err.message));

  const worker = new Worker(name, processorFn, {
    connection: workerConn,
    concurrency: opts.concurrency ?? 2,
    ...opts,
  });

  worker.on('failed', (job, err) => {
    console.error(`[${name}-worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('completed', (job) => {
    console.log(`[${name}-worker] Job ${job.id} completed`);
  });

  activeWorkers.push(worker);
  return worker;
}

/**
 * Gracefully close all workers and Redis connections.
 * Call this from your shutdown handler.
 */
export async function closeAll() {
  console.log('[queue] Closing all workers and connections...');
  await Promise.allSettled(activeWorkers.map((w) => w.close()));
  if (queueConnection) await queueConnection.quit().catch(() => {});
  console.log('[queue] All connections closed');
}
