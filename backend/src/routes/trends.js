/**
 * routes/trends.js
 * REST API routes for social media trends.
 * GET is public, POST requires auth (for seeding trend data).
 * POST /sync triggers manual TrendSync fetch (admin/testing).
 * Key dependencies: express, drizzle-orm, zod, trendfetcher
 */

import { Router } from 'express';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { trends } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { triggerManualSync } from '../services/trendfetcher.js';

const router = Router();

// Zod schema for trend creation
const createTrendSchema = z.object({
  category: z.string().min(1).max(100),
  topic: z.string().min(1),
  hashtags: z.array(z.string()).optional(),
  hook_patterns: z.array(z.string()).optional(),
  score: z.number().int().min(0).max(100).optional(),
});

// GET /api/v1/trends - list recent trends (public)
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const category = req.query.category;

    let query = db.select().from(trends).orderBy(desc(trends.score)).limit(limit);

    // Optional category filter
    if (category) {
      query = db
        .select()
        .from(trends)
        .where(eq(trends.category, category))
        .orderBy(desc(trends.score))
        .limit(limit);
    }

    const result = await query;
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/trends - create a new trend (authenticated)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const parsed = createTrendSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const [trend] = await db
      .insert(trends)
      .values({
        category: parsed.data.category,
        topic: parsed.data.topic,
        hashtags: parsed.data.hashtags || [],
        hook_patterns: parsed.data.hook_patterns || [],
        score: parsed.data.score,
      })
      .returning();

    return res.status(201).json(trend);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/trends/sync - trigger manual TrendSync fetch (admin/testing)
router.post('/sync', requireAuth, async (req, res, next) => {
  try {
    console.log(`[trends] Manual TrendSync triggered by user ${req.user.id}`);
    
    // Trigger async (don't wait for completion)
    triggerManualSync().catch(err => {
      console.error('[trends] Manual sync error:', err.message);
    });

    return res.status(202).json({
      message: 'TrendSync started — fetching from TikTok, YouTube, and X',
      note: 'Check server logs for progress. Typically completes in 30-60 seconds.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
