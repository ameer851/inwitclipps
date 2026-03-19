/**
 * workers/ai.worker.js
 * BullMQ worker for the 'ai-detection' queue.
 * 
 * *** TrendSync Feature — InwitClipps' competitive differentiator ***
 * Unlike Opus Clip (which has ZERO trend awareness), we score every clip
 * against what's trending RIGHT NOW on TikTok, YouTube, and X.
 * 
 * Analyses transcript via Anthropic Claude Haiku 4.5 to detect high-virality
 * clip segments with real-time trend alignment scoring.
 * 
 * Key dependencies: bullmq, @anthropic-ai/sdk, drizzle-orm, queue service
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { jobs, clips, trends } from '../db/schema.js';
import { getWorker, getQueue } from '../services/queue.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Category keywords for transcript-based content classification.
 */
const CATEGORY_KEYWORDS = {
  tech: ['ai', 'tech', 'software', 'code', 'programming', 'app', 'startup', 'crypto', 'bitcoin'],
  gaming: ['game', 'gaming', 'gamer', 'play', 'stream', 'twitch', 'esport', 'fps', 'rpg'],
  politics: ['politic', 'election', 'government', 'vote', 'president', 'congress', 'policy', 'war'],
};

/**
 * Detects content category from transcript text.
 * @param {string} text - Full transcript text
 * @returns {string} - Detected category: 'tech', 'gaming', 'politics', or 'general'
 */
function detectContentCategory(text) {
  const lower = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'general';
}

/**
 * Builds a TrendSync-powered prompt with real-time trending topics.
 * This is our competitive moat — real-time trend intelligence.
 * 
 * @param {object} transcript - Whisper transcript with words array
 * @param {number} durationSecs - Video duration in seconds
 * @param {string} category - Content category
 * @param {Array} trendingTopics - Top trending topics for this category
 * @returns {Array} - Messages array for Claude API
 */
function buildTrendSyncPrompt(transcript, durationSecs, category, trendingTopics) {
  const text = transcript.text || '';
  const words = transcript.words || [];

  const timeline = words
    .filter((w) => w.start !== undefined)
    .map((w) => w.start.toFixed(1) + '-' + w.end.toFixed(1) + ': ' + w.word)
    .join('\n');

  const trendsList = trendingTopics.length > 0
    ? trendingTopics.map((t, idx) => `${idx + 1}. ${t.topic} (score: ${t.score})`).join('\n')
    : 'No specific trends available for this category.';

  const systemPrompt = 
    'You are a viral short-form video editor for TikTok, Instagram Reels, and YouTube Shorts. ' +
    'You specialise in podcasts, gaming streams, tech talks, and political commentary. ' +
    'Your clips consistently hit 1M+ views by leveraging trending topics and viral hooks.';

  const userPrompt = [
    'TRANSCRIPT WITH WORD-LEVEL TIMESTAMPS:',
    text,
    '',
    'WORD-LEVEL TIMELINE (seconds):',
    timeline.slice(0, 5000), // Truncate for token limits
    '',
    `VIDEO DURATION: ${durationSecs} seconds`,
    '',
    `CONTENT CATEGORY: ${category}`,
    '',
    `TODAY'S TOP TRENDING TOPICS IN "${category.toUpperCase()}" ON TIKTOK/YOUTUBE/X:`,
    trendsList,
    '',
    'TASK: Find 5-8 viral clip segments (30-90 seconds each).',
    '',
    'For each clip, analyze:',
    '1. Virality Score (0-100): Hook strength, pacing, emotional impact, standalone value',
    '2. Trend Score (0-100): Alignment with trending topics above',
    '3. Trending Hook: A suggested opening caption that ties this clip to a current trend',
    '',
    'SCORING GUIDELINES:',
    '• Virality Score: Strong hook (30pts), emotional peak (25pts), surprising reveal (20pts), clear takeaway (15pts), standalone value (10pts)',
    '• Trend Score: Direct topic match (100pts), related keywords (70pts), tangential connection (40pts), no connection (0pts)',
    '',
    'RULES:',
    '- Clips must NOT overlap',
    '- Each clip 30-90 seconds (enforce strictly)',
    '- start_time and end_time must align to word boundaries from the timeline',
    '- Prioritize clips with BOTH high virality AND high trend alignment',
    '- If no strong trend match exists, score honestly — don\'t force connections',
    '',
    'Respond ONLY with valid JSON array:',
    '[{',
    '  "start_time": 12.5,',
    '  "end_time": 65.2,',
    '  "virality_score": 85,',
    '  "trend_score": 92,',
    '  "ai_reason": "Strong opening hook with controversial take",',
    '  "trending_hook": "AI is replacing developers 🤖💻 #TechTrends #AI"',
    '}]',
  ].join('\n');

  return [
    { role: 'user', content: systemPrompt + '\n\n' + userPrompt }
  ];
}

/**
 * Parses Claude response with TrendSync fields.
 * Handles markdown code fences and validates trend scoring.
 */
function parseClips(responseText) {
  let cleaned = responseText.trim();
  
  // Strip markdown code fences if present
  const fenceMatch = cleaned.match(/\`\`\`(?:json)?\s*([\s\S]*?)\s*\`\`\`/);
  if (fenceMatch) {
    cleaned = fenceMatch[1];
  }

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error('Expected JSON array of clips');
  }

  return parsed.map((c) => ({
    start_time: Number(c.start_time),
    end_time: Number(c.end_time),
    virality_score: Math.min(100, Math.max(0, Math.round(Number(c.virality_score || 0)))),
    trend_score: Math.min(100, Math.max(0, Math.round(Number(c.trend_score || 0)))),
    ai_reason: String(c.ai_reason || ''),
    trending_hook: String(c.trending_hook || ''),
  }));
}

// Start the AI detection worker with TrendSync
const aiWorker = getWorker('ai-detection', async (job) => {
  const { jobId } = job.data;

  console.log('[ai-worker] ========================================');
  console.log('[ai-worker] Starting TrendSync clip detection for job ' + jobId);

  try {
    // Update status
    await db.update(jobs).set({ status: 'analyzing' }).where(eq(jobs.id, jobId));

    // Fetch job record with transcript
    const [jobRecord] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId));

    if (!jobRecord) throw new Error('Job ' + jobId + ' not found');
    if (!jobRecord.transcript) throw new Error('Job ' + jobId + ' has no transcript');

    // Detect content category from transcript
    const category = detectContentCategory(jobRecord.transcript.text || '');
    console.log(`[ai-worker] Detected category: ${category}`);

    // Fetch top 10 trending topics for this category
    const trendingTopics = await db
      .select()
      .from(trends)
      .where(eq(trends.category, category))
      .orderBy(desc(trends.score))
      .limit(10);

    console.log(`[ai-worker] Found ${trendingTopics.length} trending topics for category "${category}"`);
    
    if (trendingTopics.length > 0) {
      console.log('[ai-worker] Top 3 trends:');
      trendingTopics.slice(0, 3).forEach((t, idx) => {
        console.log(`[ai-worker]   ${idx + 1}. ${t.topic} (score: ${t.score})`);
      });
    } else {
      console.warn('[ai-worker] No trends found — run TrendSync first or check trend fetcher logs');
    }

    // Build TrendSync-powered prompt
    const messages = buildTrendSyncPrompt(
      jobRecord.transcript,
      jobRecord.duration_secs || 0,
      category,
      trendingTopics
    );

    // Call Claude Haiku 4.5 (our latest model with enhanced trend understanding)
    console.log('[ai-worker] Sending to Claude Haiku 4.5 with TrendSync context...');
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Latest Haiku 4.5 model
      max_tokens: 8192,
      messages: messages,
    });

    const responseText = response.content[0]?.text || '[]';
    console.log('[ai-worker] Claude response received');

    // Parse clips with trend scoring
    const detectedClips = parseClips(responseText);
    console.log(`[ai-worker] Detected ${detectedClips.length} clips with trend scores`);

    if (detectedClips.length === 0) {
      await db.update(jobs).set({ status: 'completed' }).where(eq(jobs.id, jobId));
      console.log('[ai-worker] No clips found for job ' + jobId);
      return;
    }

    // Log clip analytics
    const avgVirality = Math.round(
      detectedClips.reduce((sum, c) => sum + c.virality_score, 0) / detectedClips.length
    );
    const avgTrend = Math.round(
      detectedClips.reduce((sum, c) => sum + c.trend_score, 0) / detectedClips.length
    );
    
    console.log('[ai-worker] Clip analytics:');
    console.log(`[ai-worker]   - Average virality score: ${avgVirality}/100`);
    console.log(`[ai-worker]   - Average trend score: ${avgTrend}/100`);
    console.log(`[ai-worker]   - TrendSync boost: ${avgTrend > 50 ? '🔥 HIGH' : avgTrend > 30 ? '✓ MEDIUM' : '⚠ LOW'}`);

    // Insert clips into DB with trend scores
    const insertedClips = await db
      .insert(clips)
      .values(
        detectedClips.map((c) => ({
          job_id: jobId,
          start_time: c.start_time,
          end_time: c.end_time,
          virality_score: c.virality_score,
          trend_score: c.trend_score, // *** TrendSync differentiation ***
          // Store trending_hook in ai_reason (append if exists)
          ai_reason: c.trending_hook 
            ? `${c.ai_reason}\n\nTrending Hook: ${c.trending_hook}`
            : c.ai_reason,
        }))
      )
      .returning();

    console.log(`[ai-worker] Inserted ${insertedClips.length} clips into DB`);

    // Log top clips by combined score
    const topClips = insertedClips
      .sort((a, b) => (b.virality_score + b.trend_score) - (a.virality_score + a.trend_score))
      .slice(0, 3);
    
    console.log('[ai-worker] Top 3 clips by combined score:');
    topClips.forEach((clip, idx) => {
      const combined = clip.virality_score + clip.trend_score;
      console.log(`[ai-worker]   ${idx + 1}. Clip at ${clip.start_time}s-${clip.end_time}s (V:${clip.virality_score} + T:${clip.trend_score} = ${combined})`);
    });

    // Update status to rendering
    await db.update(jobs).set({ status: 'rendering' }).where(eq(jobs.id, jobId));

    // Enqueue render jobs for each clip
    const renderQueue = getQueue('render');
    for (const clip of insertedClips) {
      await renderQueue.add('render', { jobId, clipId: clip.id });
    }

    console.log('[ai-worker] All render jobs enqueued');
    console.log('[ai-worker] ========================================');
    
  } catch (err) {
    console.error('[ai-worker] ========================================');
    console.error('[ai-worker] Error for job ' + jobId + ':', err.message);
    console.error('[ai-worker] ========================================');
    
    await db
      .update(jobs)
      .set({ status: 'failed', error_msg: err.message })
      .where(eq(jobs.id, jobId));
    throw err;
  }
});

aiWorker.on('error', (err) => {
  console.error('[ai-worker] Worker error:', err.message);
});

console.log('[ai-worker] Worker started, listening on queue: ai-detection');
