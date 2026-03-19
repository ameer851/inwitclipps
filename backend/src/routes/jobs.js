/**
 * routes/jobs.js
 * REST API routes for video processing jobs.
 * All routes are protected by Supabase JWT auth middleware.
 * Handles job creation (queues download), listing, status, and deletion.
 * Key dependencies: express, drizzle-orm, zod, bullmq (via queue service)
 */

import { Router } from 'express';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { jobs } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { createJobLimiter } from '../middleware/rateLimiter.js';
import { getQueue } from '../services/queue.js';

const router = Router();

// Zod schema for job creation
const createJobSchema = z.object({
  source_url: z.string().url({ message: 'source_url must be a valid URL' }),
});

// POST /api/v1/jobs — create a new job and enqueue download
// Protected by auth + rate limiting (10 jobs per user per hour)
router.post('/', requireAuth, createJobLimiter, async (req, res, next) => {
  try {
    const parsed = createJobSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { source_url } = parsed.data;

    const [job] = await db
      .insert(jobs)
      .values({
        user_id: req.user.id,
        source_url,
        status: 'queued',
      })
      .returning();

    // Enqueue the download job
    const downloadQueue = getQueue('download');
    await downloadQueue.add('download', { jobId: job.id, sourceUrl: source_url });

    console.log(`[jobs] Created job ${job.id} for user ${req.user.id}`);

    return res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/jobs — list all jobs for authenticated user
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.user_id, req.user.id))
      .orderBy(desc(jobs.created_at));

    return res.json(userJobs);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/jobs/:id — get full job including transcript
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    // WHERE already scopes to req.user.id — no extra ownership check needed
    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, req.params.id), eq(jobs.user_id, req.user.id)));

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json(job);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/jobs/:id/status — lightweight status poll endpoint
router.get('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const [job] = await db
      .select({
        id: jobs.id,
        status: jobs.status,
        created_at: jobs.created_at,
      })
      .from(jobs)
      .where(and(eq(jobs.id, req.params.id), eq(jobs.user_id, req.user.id)));

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json(job);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/jobs/:id — delete job (clips cascade via FK)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const [job] = await db
      .select({ id: jobs.id, user_id: jobs.user_id })
      .from(jobs)
      .where(eq(jobs.id, req.params.id));

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.delete(jobs).where(eq(jobs.id, req.params.id));

    console.log(`[jobs] Deleted job ${req.params.id}`);

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
