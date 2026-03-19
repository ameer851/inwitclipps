# TrendSync Quick Start Guide

## What is TrendSync?

**InwitClipps' competitive differentiator over Opus Clip.**

- Opus Clip: ❌ No trend awareness, single virality score
- InwitClipps: ✅ Real-time trend intelligence from TikTok, YouTube, X

Every clip gets **dual scoring**:
1. **Virality Score:** Hook strength, pacing, emotional impact
2. **Trend Score:** Alignment with trending topics RIGHT NOW

---

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
cd backend
npm install axios node-cron
```

### 2. Add API Keys to `.env`

```bash
# Required for TrendSync
APIFY_API_KEY=apify_api_...        # Get at: https://console.apify.com

# Optional (has fallbacks)
TWITTER_BEARER_TOKEN=AAAAAAA...     # Get at: https://developer.twitter.com
YOUTUBE_API_KEY=AIzaSy...           # Get at: https://console.cloud.google.com
```

### 3. Start Server

```bash
npm run dev
```

You'll see:
```
🔥 Initializing TrendSync...
[trend-fetcher] TrendSync initialized
[trend-fetcher] Starting TrendSync cycle...
```

---

## Test TrendSync

### Step 1: Manual Trigger (Test First!)

```bash
# Get your Supabase JWT token first
export TOKEN="your-jwt-token-here"

# Trigger TrendSync
curl -X POST http://localhost:3001/api/v1/trends/sync \
  -H "Authorization: Bearer $TOKEN"
```

**Watch the logs:**
```
[trend-fetcher] Fetching TikTok trends via Apify...
[trend-fetcher] Fetching YouTube trends via RSS...
[trend-fetcher] Fetching X/Twitter trends...
[trend-fetcher] ✓ Stored 63 trends in database
[trend-fetcher] Category breakdown:
[trend-fetcher]   - tech: 15
[trend-fetcher]   - gaming: 12
[trend-fetcher]   - politics: 8
[trend-fetcher]   - general: 28
```

### Step 2: View Fetched Trends

```bash
# All trends
curl http://localhost:3001/api/v1/trends | jq

# Filter by category
curl "http://localhost:3001/api/v1/trends?category=tech&limit=5" | jq
```

**Example response:**
```json
[
  {
    "id": "uuid...",
    "category": "tech",
    "topic": "ChatGPT-5 release rumors",
    "hashtags": ["#GPT5", "#OpenAI"],
    "score": 95,
    "fetched_at": "2026-03-09T20:15:00Z"
  }
]
```

### Step 3: Submit a Video Job

```bash
curl -X POST http://localhost:3001/api/v1/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

### Step 4: Watch the Magic

**Worker logs will show:**
```
[ai-worker] ========================================
[ai-worker] Starting TrendSync clip detection for job abc123
[ai-worker] Detected category: tech
[ai-worker] Found 10 trending topics for category "tech"
[ai-worker] Top 3 trends:
[ai-worker]   1. ChatGPT-5 rumors (score: 95)
[ai-worker]   2. Apple Vision Pro reviews (score: 87)
[ai-worker]   3. Bitcoin ETF approval (score: 82)
[ai-worker] Sending to Claude Haiku 4.5 with TrendSync context...
[ai-worker] Detected 6 clips with trend scores
[ai-worker] Clip analytics:
[ai-worker]   - Average virality score: 78/100
[ai-worker]   - Average trend score: 85/100
[ai-worker]   - TrendSync boost: 🔥 HIGH
[ai-worker] Top 3 clips by combined score:
[ai-worker]   1. Clip at 45.2s-78.6s (V:88 + T:92 = 180)
[ai-worker]   2. Clip at 120.5s-165.3s (V:82 + T:87 = 169)
[ai-worker]   3. Clip at 210.1s-248.9s (V:75 + T:78 = 153)
[ai-worker] ========================================
```

### Step 5: Get Clips with Trend Scores

```bash
# Get job details
curl http://localhost:3001/api/v1/jobs/{jobId} \
  -H "Authorization: Bearer $TOKEN" | jq

# Get clips for job
curl http://localhost:3001/api/v1/jobs/{jobId}/clips \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Clip response includes trend_score:**
```json
[
  {
    "id": "clip-uuid",
    "job_id": "job-uuid",
    "start_time": 45.2,
    "end_time": 78.6,
    "virality_score": 88,
    "trend_score": 92,
    "ai_reason": "Strong opening hook with ChatGPT-5 speculation\n\nTrending Hook: Is GPT-5 going to replace developers? 🤖💻 #AI #TechTrends",
    "output_path": "clips/clip-uuid.mp4",
    "created_at": "2026-03-09T20:30:00Z"
  }
]
```

---

## Understanding the Scores

### Virality Score (0-100)
- **Hook Strength (30pts):** Opening captures attention in 2 seconds
- **Emotional Peak (25pts):** Surprise, humor, controversy, inspiration
- **Surprising Reveal (20pts):** Unexpected information or perspective
- **Clear Takeaway (15pts):** Actionable insight or memorable quote
- **Standalone Value (10pts):** Works without original context

### Trend Score (0-100)
- **Direct Topic Match (100pts):** Clip mentions trending topic by name
- **Related Keywords (70pts):** Uses keywords from trending topics
- **Tangential Connection (40pts):** Thematically related to trends
- **No Connection (0pts):** Unique content (not bad, just not trending)

### Combined Score = Virality + Trend
- **150-200:** 🔥 Viral gold — post immediately
- **100-149:** ✓ Strong performer — likely to trend
- **50-99:** ⚠️ Decent — might work with good timing
- **<50:** ❌ Rework or skip

---

## Troubleshooting

### "No trends found" in worker logs

**Problem:** TrendSync hasn't run yet or failed

**Solution:**
```bash
# Manual trigger
curl -X POST http://localhost:3001/api/v1/trends/sync \
  -H "Authorization: Bearer $TOKEN"

# Or restart server (runs on startup)
npm run dev
```

### "APIFY_API_KEY not set"

**Problem:** Missing TikTok API key

**Solution:**
1. Sign up at https://console.apify.com
2. Get free API key (100 runs/month)
3. Add to `.env`: `APIFY_API_KEY=apify_api_...`
4. Restart server

**Alternative:** TrendSync will work with just YouTube + X (TikTok skipped)

### Low trend scores (all clips <20)

**Problem:** No relevant trends in database for content category

**Check trends:**
```bash
curl "http://localhost:3001/api/v1/trends?category=tech" | jq
```

**Solution:**
1. Trigger manual sync to get fresh trends
2. Expand category keywords in `ai.worker.js`
3. Manually seed trends for niche categories:
```bash
curl -X POST http://localhost:3001/api/v1/trends \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "tech",
    "topic": "Your trending topic here",
    "score": 85
  }'
```

### Workers not processing jobs

**Check workers are running:**
```bash
npm run workers:dev
```

**Check queue status:**
```bash
# In Node.js REPL
import { getQueue } from './src/services/queue.js';
const queue = getQueue('ai-detection');
const counts = await queue.getJobCounts();
console.log(counts);
```

---

## Production Checklist

- [ ] Set up automated TrendSync (runs every 6 hours)
- [ ] Get Apify API key (required for TikTok)
- [ ] Optional: Get Twitter Bearer Token
- [ ] Optional: Get YouTube API key
- [ ] Monitor trend fetch success rate
- [ ] Alert if no trends fetched for 24 hours
- [ ] Track average trend scores in analytics
- [ ] A/B test clips with high trend scores vs low

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/trends` | None | List all trends |
| GET | `/api/v1/trends?category=tech` | None | Filter by category |
| POST | `/api/v1/trends` | Required | Create trend (manual) |
| POST | `/api/v1/trends/sync` | Required | Trigger manual fetch |
| GET | `/api/v1/jobs/{id}/clips` | Required | Get clips with scores |

---

## Cost Analysis

**TrendSync Monthly Cost:**
- Apify (TikTok): $49/month (Starter tier, 500 runs)
- Twitter API: Free or $100/month (Pro)
- YouTube API: Free
- **Total: ~$50-150/month**

**Value Proposition:**
- Opus Clip: $0 on trends (they don't have this)
- InwitClipps: $150 for competitive moat
- **ROI: Priceless** 🚀

---

## Next Steps

1. ✅ TrendSync running
2. ✅ Trends fetched
3. ✅ Clips scored with dual metrics
4. 🎯 **Market this feature heavily** — it's our unfair advantage
5. 🎯 **A/B test** — do high trend scores = more views?
6. 🎯 **Analytics dashboard** — show trend alignment to users
7. 🎯 **User feedback** — "Your clip aligns with #TechTrends"

---

## Documentation

- **Full docs:** `docs/TRENDSYNC.md`
- **Architecture:** `docs/architecture.md`
- **API docs:** `docs/api.md`

**Built with:** Node.js, node-cron, axios, Claude Haiku 4.5, Anthropic SDK
**Status:** ✅ Production-ready
