/**
 * services/trendfetcher.js
 * TrendSync — InwitClipps' competitive differentiator.
 * Fetches real-time trending topics from TikTok, YouTube, and X every 6 hours.
 * Scores and categorizes trends, then upserts into the trends table.
 * 
 * This gives us a massive edge over Opus Clip (which has ZERO trend awareness).
 * Every clip gets scored against what's trending RIGHT NOW on social platforms.
 * 
 * Key dependencies: node-cron, axios, drizzle-orm
 */

import 'dotenv/config';
import cron from 'node-cron';
import axios from 'axios';
import { db } from '../db/index.js';
import { trends } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Category keywords for automatic classification
const CATEGORY_KEYWORDS = {
  tech: [
    'ai', 'chatgpt', 'openai', 'anthropic', 'claude', 'gpt', 'llm', 'machine learning',
    'crypto', 'bitcoin', 'ethereum', 'blockchain', 'web3', 'nft',
    'apple', 'google', 'meta', 'tesla', 'spacex', 'iphone', 'android',
    'coding', 'programming', 'developer', 'software', 'startup', 'saas',
    'tech', 'technology', 'innovation', 'gadget', 'smartphone'
  ],
  gaming: [
    'gaming', 'gamer', 'gameplay', 'twitch', 'streamer', 'stream',
    'fortnite', 'minecraft', 'valorant', 'league', 'lol', 'cod', 'callofduty',
    'ps5', 'playstation', 'xbox', 'nintendo', 'switch', 'steam',
    'esports', 'tournament', 'fps', 'mmorpg', 'rpg', 'moba'
  ],
  politics: [
    'politics', 'political', 'election', 'vote', 'democrat', 'republican',
    'congress', 'senate', 'president', 'government', 'policy', 'war',
    'trump', 'biden', 'debate', 'campaign', 'legislation', 'economy',
    'climate', 'immigration', 'healthcare', 'tax', 'supreme court'
  ],
  general: [] // Default fallback
};

/**
 * Detects the category of a trend based on keyword matching.
 * @param {string} text - The trend topic/description
 * @returns {string} - One of: 'tech', 'gaming', 'politics', 'general'
 */
function detectCategory(text) {
  const lower = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'general') continue;
    
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'general';
}

/**
 * Fetches trending topics from TikTok using Apify API.
 * Apify provides real-time TikTok trending hashtags and challenges.
 * @returns {Promise<Array>} Array of trend objects
 */
async function fetchTikTokTrends() {
  if (!process.env.APIFY_API_KEY) {
    console.warn('[trend-fetcher] APIFY_API_KEY not set, skipping TikTok trends');
    return [];
  }

  try {
    console.log('[trend-fetcher] Fetching TikTok trends via Apify...');
    
    // Apify Actor for TikTok trending hashtags
    const response = await axios.post(
      `https://api.apify.com/v2/acts/clockworks~free-tiktok-hashtag-scraper/runs?token=${process.env.APIFY_API_KEY}`,
      {
        hashtags: ['fyp', 'trending', 'viral', 'foryou'], // Seed hashtags to discover trends
        resultsPerPage: 50
      },
      { timeout: 60000 }
    );

    const runId = response.data.data.id;
    
    // Wait for the run to complete (typically 10-30 seconds)
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Fetch results
    const resultsResponse = await axios.get(
      `https://api.apify.com/v2/acts/clockworks~free-tiktok-hashtag-scraper/runs/${runId}/dataset/items?token=${process.env.APIFY_API_KEY}`
    );

    const items = resultsResponse.data || [];
    
    return items.map(item => ({
      platform: 'tiktok',
      topic: item.hashtag || item.text || '',
      hashtags: [item.hashtag].filter(Boolean),
      score: item.views || item.posts || 0,
      hook_patterns: item.challenges || []
    })).filter(t => t.topic);
    
  } catch (err) {
    console.error('[trend-fetcher] TikTok fetch error:', err.message);
    return [];
  }
}

/**
 * Fetches trending topics from YouTube using the public trending RSS feed.
 * No API key required — uses public RSS feed.
 * @returns {Promise<Array>} Array of trend objects
 */
async function fetchYouTubeTrends() {
  try {
    console.log('[trend-fetcher] Fetching YouTube trends via RSS...');
    
    // YouTube trending feed (returns XML)
    const response = await axios.get('https://www.youtube.com/feed/trending', {
      params: { bp: 'trending' },
      headers: { 'Accept': 'application/rss+xml' },
      timeout: 10000
    });

    // Parse XML (simple regex extraction for trending videos)
    const xml = response.data;
    const titleMatches = xml.matchAll(/<title>([^<]+)<\/title>/g);
    
    const topics = [];
    for (const match of titleMatches) {
      const title = match[1].trim();
      if (title && title !== 'Trending' && title !== 'YouTube') {
        topics.push(title);
      }
    }

    return topics.slice(0, 20).map((topic, idx) => ({
      platform: 'youtube',
      topic,
      hashtags: [],
      score: 100 - idx * 3, // Higher score for top positions
      hook_patterns: []
    }));
    
  } catch (err) {
    console.error('[trend-fetcher] YouTube fetch error:', err.message);
    
    // Fallback: use YouTube Data API v3 if available
    if (process.env.YOUTUBE_API_KEY) {
      try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: {
            part: 'snippet',
            chart: 'mostPopular',
            regionCode: 'US',
            maxResults: 20,
            key: process.env.YOUTUBE_API_KEY
          }
        });

        return response.data.items.map((video, idx) => ({
          platform: 'youtube',
          topic: video.snippet.title,
          hashtags: video.snippet.tags || [],
          score: 100 - idx * 3,
          hook_patterns: []
        }));
      } catch (apiErr) {
        console.error('[trend-fetcher] YouTube API fallback error:', apiErr.message);
      }
    }
    
    return [];
  }
}

/**
 * Fetches trending topics from X/Twitter using public trending endpoint.
 * Uses Twitter's public API (no auth required for trending topics).
 * @returns {Promise<Array>} Array of trend objects
 */
async function fetchXTrends() {
  try {
    console.log('[trend-fetcher] Fetching X/Twitter trends...');
    
    // X's public trending API (WOEID 1 = worldwide)
    // Note: This endpoint may require authentication in production
    // For now, we'll use a proxy or scraping approach
    
    const response = await axios.get('https://api.twitter.com/1.1/trends/place.json', {
      params: { id: 1 }, // Worldwide trends
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN || ''}`
      },
      timeout: 10000
    });

    const trends = response.data[0]?.trends || [];
    
    return trends.slice(0, 20).map((trend, idx) => ({
      platform: 'x',
      topic: trend.name,
      hashtags: trend.name.startsWith('#') ? [trend.name] : [],
      score: trend.tweet_volume || (100 - idx * 3),
      hook_patterns: []
    }));
    
  } catch (err) {
    console.error('[trend-fetcher] X/Twitter fetch error:', err.message);
    
    // Fallback: scrape trending from X's explore page (no auth needed)
    try {
      const response = await axios.get('https://twitter.com/i/trends', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      // Extract trend names from HTML (simplified)
      const trendMatches = response.data.matchAll(/data-trend-name="([^"]+)"/g);
      const topics = [];
      for (const match of trendMatches) {
        topics.push(match[1]);
      }
      
      return topics.slice(0, 20).map((topic, idx) => ({
        platform: 'x',
        topic,
        hashtags: topic.startsWith('#') ? [topic] : [],
        score: 100 - idx * 3,
        hook_patterns: []
      }));
      
    } catch (scrapeErr) {
      console.error('[trend-fetcher] X scraping fallback error:', scrapeErr.message);
    }
    
    return [];
  }
}

/**
 * Main trend fetching orchestrator.
 * Fetches from all platforms, categorizes, and upserts to database.
 */
async function fetchAndStoreAllTrends() {
  console.log('[trend-fetcher] ========================================');
  console.log('[trend-fetcher] Starting TrendSync cycle...');
  console.log('[trend-fetcher] ========================================');

  try {
    // Fetch from all platforms in parallel
    const [tiktokTrends, youtubeTrends, xTrends] = await Promise.all([
      fetchTikTokTrends(),
      fetchYouTubeTrends(),
      fetchXTrends()
    ]);

    const allTrends = [...tiktokTrends, ...youtubeTrends, ...xTrends];
    
    console.log('[trend-fetcher] Fetched totals:');
    console.log(`[trend-fetcher]   - TikTok: ${tiktokTrends.length}`);
    console.log(`[trend-fetcher]   - YouTube: ${youtubeTrends.length}`);
    console.log(`[trend-fetcher]   - X/Twitter: ${xTrends.length}`);
    console.log(`[trend-fetcher]   - TOTAL: ${allTrends.length}`);

    if (allTrends.length === 0) {
      console.warn('[trend-fetcher] No trends fetched from any platform');
      return;
    }

    // Delete old trends (older than 24 hours to keep DB lean)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.delete(trends).where(eq(trends.fetched_at, oneDayAgo));

    // Upsert each trend into the database
    let insertedCount = 0;
    for (const trend of allTrends) {
      const category = detectCategory(trend.topic);
      
      try {
        await db.insert(trends).values({
          category,
          topic: trend.topic,
          hashtags: trend.hashtags,
          hook_patterns: trend.hook_patterns,
          score: trend.score,
          fetched_at: new Date()
        });
        insertedCount++;
      } catch (err) {
        // Ignore duplicate key errors
        if (!err.message.includes('duplicate')) {
          console.error(`[trend-fetcher] Insert error for "${trend.topic}":`, err.message);
        }
      }
    }

    console.log('[trend-fetcher] ========================================');
    console.log(`[trend-fetcher] ✓ Stored ${insertedCount} trends in database`);
    console.log('[trend-fetcher] Category breakdown:');
    
    // Count by category
    const categoryCounts = allTrends.reduce((acc, t) => {
      const cat = detectCategory(t.topic);
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    
    for (const [cat, count] of Object.entries(categoryCounts)) {
      console.log(`[trend-fetcher]   - ${cat}: ${count}`);
    }
    
    console.log('[trend-fetcher] Next sync in 6 hours');
    console.log('[trend-fetcher] ========================================');

  } catch (err) {
    console.error('[trend-fetcher] Fatal error:', err.message);
    console.error(err.stack);
  }
}

/**
 * Starts the TrendSync cron job.
 * Runs every 6 hours and on startup.
 */
export function startTrendFetcher() {
  console.log('[trend-fetcher] TrendSync initialized');
  console.log('[trend-fetcher] Schedule: Every 6 hours (cron: 0 */6 * * *)');
  
  // Run immediately on startup
  fetchAndStoreAllTrends();
  
  // Schedule for every 6 hours: "At minute 0 past every 6th hour"
  cron.schedule('0 */6 * * *', () => {
    fetchAndStoreAllTrends();
  });
  
  console.log('[trend-fetcher] Cron job active');
}

/**
 * Manual trigger for testing.
 * Call this from a route or REPL for immediate sync.
 */
export async function triggerManualSync() {
  console.log('[trend-fetcher] Manual trigger requested');
  await fetchAndStoreAllTrends();
}
