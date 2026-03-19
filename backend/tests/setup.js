/**
 * tests/setup.js
 * Global test setup and teardown.
 * Runs before all tests to configure environment and mocks.
 */

import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.UPSTASH_REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.STORAGE_RAW_BUCKET = 'test-raw-bucket';
process.env.STORAGE_CLIPS_BUCKET = 'test-clips-bucket';
process.env.TMP_DIR = '/tmp/inwitclipps-test';
process.env.LOG_LEVEL = 'silent';

// Suppress console output during tests (optional - can be enabled for debugging)
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);
