/**
 * routes/clips.js
 * REST API routes for AI-generated video clips.
 * All routes are protected by Supabase JWT auth middleware.
 * Handles clip listing, style updates, and signed download URL generation.
 * Key dependencies: express, drizzle-orm, zod, storage service
 */

import { Router } from 'express';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { clips, jobs } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { getSignedUrl } from '../services/storage.js';

const router = Router({ mergeParams: true });

// Zod schema for caption_style update
const updateClipSchema = z.object({
  caption_style: z.enum(['bold', 'minimal', 'glowing', 'word-by-word']),
});

// GET /api/v1/jobs/:jobId/clips — list all clips for a job
router.get('/jobs/:jobId/clips', requireAuth, async (req, res, next) => {
  try {
    // Verify user owns the job first
    const [job] = await db
      .select({ id: jobs.id, user_id: jobs.user_id })
      .from(jobs)
      .where(and(eq(jobs.id, req.params.jobId), eq(jobs.user_id, req.user.id)));

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const jobClips = await db
      .select()
      .from(clips)
      .where(eq(clips.job_id, req.params.jobId));

    return res.json(jobClips);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/clips/:id — update caption_style only
router.patch('/clips/:id', requireAuth, async (req, res, next) => {
  try {
    const parsed = updateClipSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    // Fetch clip and verify ownership via job
    const [clip] = await db
      .select()
      .from(clips)
      .where(eq(clips.id, req.params.id));

    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    // Check user owns the parent job
    const [job] = await db
      .select({ user_id: jobs.user_id })
      .from(jobs)
      .where(and(eq(jobs.id, clip.job_id), eq(jobs.user_id, req.user.id)));

    if (!job) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const [updated] = await db
      .update(clips)
      .set({ caption_style: parsed.data.caption_style })
      .where(eq(clips.id, req.params.id))
      .returning();

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/clips/:id/download — return signed download URL
router.get('/clips/:id/download', requireAuth, async (req, res, next) => {
  try {
    const [clip] = await db
      .select()
      .from(clips)
      .where(eq(clips.id, req.params.id));

    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    if (!clip.output_path) {
      return res.status(409).json({ error: 'Clip render not complete yet' });
    }

    // Verify user owns the parent job
    const [job] = await db
      .select({ user_id: jobs.user_id })
      .from(jobs)
      .where(and(eq(jobs.id, clip.job_id), eq(jobs.user_id, req.user.id)));

    if (!job) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const url = await getSignedUrl(
      process.env.STORAGE_CLIPS_BUCKET,
      clip.output_path,
      3600
    );

    return res.json({ url, expiresIn: 3600 });
  } catch (err) {
    next(err);
  }
});

export default router;
