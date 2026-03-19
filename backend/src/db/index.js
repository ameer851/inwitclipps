/**
 * db/index.js
 * Initialises Drizzle ORM with a node-postgres connection pool.
 * Connects to Supabase PostgreSQL via DATABASE_URL.
 * Key dependencies: drizzle-orm/node-postgres, pg, dotenv
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Supabase hosted PostgreSQL
});

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error:', err.message);
});

export const db = drizzle(pool, { schema });
