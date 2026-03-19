/**
 * config/env.js
 * Zod-based environment variable validation.
 * Import this at the top of your entry points to fail fast on missing config.
 * Key dependencies: zod, dotenv
 */

import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),

  // Upstash Redis
  UPSTASH_REDIS_URL: z.string().min(1),

  // AI Services
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),

  // Storage buckets
  STORAGE_RAW_BUCKET: z.string().default('raw-videos'),
  STORAGE_CLIPS_BUCKET: z.string().default('rendered-clips'),
});

/**
 * Validated environment variables.
 * Throws ZodError on first import if any required var is missing.
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('[config] Invalid environment variables:');
    for (const issue of result.error.issues) {
      console.error('  ' + issue.path.join('.') + ': ' + issue.message);
    }
    throw new Error('Missing or invalid environment variables');
  }
  return result.data;
}

export const env = validateEnv();
