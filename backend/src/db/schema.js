/**
 * db/schema.js
 * Drizzle ORM table definitions for InwitClipps.
 *
 * Tables:
 *   jobs   – one row per video-processing job (owned by a Supabase auth user)
 *   clips  – individual clips extracted from a job
 *   trends – cached trend data used by the AI ranker
 *
 * NOTE: No users table — Supabase Auth manages users in auth.users.
 *       user_id columns reference auth.users(id) logically; no FK constraint
 *       is added because the auth schema is managed by Supabase.
 *
 * RLS: Each table has RLS enabled.  Policies live in
 *      supabase/migrations/00001_rls_policies.sql
 *
 * Key dependencies: drizzle-orm/pg-core
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  real,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/* ------------------------------------------------------------------ */
/*  Enums                                                              */
/* ------------------------------------------------------------------ */

export const jobStatusEnum = pgEnum('job_status', [
  'queued',
  'downloading',
  'transcribing',
  'clipping',
  'rendering',
  'completed',
  'failed',
]);

/* ------------------------------------------------------------------ */
/*  jobs                                                               */
/* ------------------------------------------------------------------ */

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull(), // auth.users(id) — enforced via RLS
    source_url: text('source_url').notNull(),
    status: jobStatusEnum('status').default('queued'),
    duration_secs: integer('duration_secs'),
    raw_path: text('raw_path'),
    transcript: jsonb('transcript'),
    error_msg: text('error_msg'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    userIdx: index('jobs_user_id_idx').on(t.user_id),
    statusIdx: index('jobs_status_idx').on(t.status),
  }),
);

/* ------------------------------------------------------------------ */
/*  clips                                                              */
/* ------------------------------------------------------------------ */

export const clips = pgTable(
  'clips',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    job_id: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    start_time: real('start_time').notNull(),
    end_time: real('end_time').notNull(),
    virality_score: integer('virality_score'),
    trend_score: integer('trend_score'),
    ai_reason: text('ai_reason'),
    output_path: text('output_path'),
    thumbnail_path: text('thumbnail_path'),
    caption_style: varchar('caption_style', { length: 50 }).default('bold'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    jobIdx: index('clips_job_id_idx').on(t.job_id),
    viralityIdx: index('clips_virality_score_idx').on(t.virality_score),
  }),
);

/* ------------------------------------------------------------------ */
/*  trends                                                             */
/* ------------------------------------------------------------------ */

export const trends = pgTable(
  'trends',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category: varchar('category', { length: 100 }).notNull(),
    topic: text('topic').notNull(),
    hashtags: jsonb('hashtags'),
    hook_patterns: jsonb('hook_patterns'),
    score: integer('score'),
    fetched_at: timestamp('fetched_at').defaultNow(),
  },
  (t) => ({
    categoryIdx: index('trends_category_idx').on(t.category),
    scoreIdx: index('trends_score_idx').on(t.score),
  }),
);

/* ------------------------------------------------------------------ */
/*  Drizzle relations (for relational query API)                       */
/* ------------------------------------------------------------------ */

export const jobsRelations = relations(jobs, ({ many }) => ({
  clips: many(clips),
}));

export const clipsRelations = relations(clips, ({ one }) => ({
  job: one(jobs, { fields: [clips.job_id], references: [jobs.id] }),
}));
