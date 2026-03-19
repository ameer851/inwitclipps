/**
 * drizzle.config.js
 * Drizzle Kit configuration for schema generation and migrations.
 *
 * Usage:
 *   npm run db:generate   — generate SQL migration from schema diff
 *   npm run db:migrate    — apply pending migrations to the database
 *   npm run db:studio     — open Drizzle Studio GUI
 *
 * Key dependencies: drizzle-kit, dotenv
 */

import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.js',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,  // log every SQL statement during migration
  strict: true,   // fail on destructive changes unless explicitly allowed
});
