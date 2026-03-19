/**
 * middleware/requestId.js
 * Attaches a unique X-Request-Id to every incoming request.
 * This ID propagates through logs, DB updates, and queue payloads
 * so the full async pipeline can be correlated end-to-end.
 * Key dependencies: node:crypto (built-in)
 */

import { randomUUID } from 'node:crypto';

/**
 * Express middleware — reads an existing X-Request-Id header (if the
 * caller supplied one, e.g. from an API gateway) or generates a new UUID.
 * Sets it on both `req.id` and the response header.
 */
export function requestId(req, _res, next) {
  req.id = req.headers['x-request-id'] || randomUUID();
  _res.setHeader('X-Request-Id', req.id);
  next();
}
