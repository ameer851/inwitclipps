/**
 * workers/index.js
 * Single entry point to start all BullMQ workers.
 * Run with: node src/workers/index.js
 *
 * Graceful shutdown closes all worker connections via closeAll().
 * Key dependencies: dotenv, services/queue.js
 */

import 'dotenv/config';
import { closeAll } from '../services/queue.js';

console.log('[workers] Starting all InwitClipps workers...');

// Import each worker — side-effect: each file registers its worker on import
await import('./download.worker.js');
await import('./transcription.worker.js');
await import('./ai.worker.js');
await import('./render.worker.js');

console.log('[workers] All workers started successfully');
console.log('[workers] Queues: download, transcription, ai-detection, render');
console.log('[workers] Press Ctrl+C to stop');

// ── Graceful shutdown ──
async function shutdown(signal) {
  console.log(`[workers] ${signal} received — shutting down`);
  await closeAll();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
