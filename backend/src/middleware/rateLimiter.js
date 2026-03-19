/**
 * middleware/rateLimiter.js
 * Rate limiting middleware using express-rate-limit.
 * Prevents abuse of resource-intensive endpoints.
 * 
 * Security requirements:
 *   - POST /api/v1/jobs: max 10 requests per user per hour
 *   - Uses user_id from req.user for per-user rate limiting
 * 
 * Key dependencies: express-rate-limit
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for job creation endpoint.
 * Limits each authenticated user to 10 job creations per hour.
 * This prevents abuse of expensive video processing operations.
 */
export const createJobLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour per user
  
  // Key by user ID (from auth middleware)
  keyGenerator: (req) => {
    // If user is authenticated, use their ID; otherwise use IP as fallback
    return req.user?.id || req.ip;
  },
  
  // Custom error message
  message: {
    error: 'Too many job creation requests. Maximum 10 jobs per hour allowed.',
    retryAfter: 'Check the Retry-After header for wait time.',
  },
  
  // Standard rate limit headers
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,  // Disable X-RateLimit-* headers
  
  // Skip successful requests in the count (only count failed attempts)
  skipSuccessfulRequests: false,
  
  // Skip failed requests in the count
  skipFailedRequests: false,
  
  // Handler for when limit is exceeded
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many job creation requests. Maximum 10 jobs per hour allowed.',
      retryAfter: res.getHeader('Retry-After'),
      userId: req.user?.id,
    });
  },
});
