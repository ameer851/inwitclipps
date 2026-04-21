/**
 * siteGenerator.test.js
 * Verifies the generated marketing-site structure for InwitClipps.
 */

import { describe, expect, it } from '@jest/globals';
import { getSiteManifest, renderRoute } from '../../../frontend/site/generator.mjs';

describe('InwitClipps marketing site generator', () => {
  it('covers the required core route families', () => {
    const manifest = getSiteManifest();
    const routeSet = new Set(manifest.routes.map((route) => route.pathname));

    [
      '/',
      '/pricing/',
      '/api/',
      '/tools/',
      '/blog/',
      '/knowledge-base/',
      '/about/',
      '/affiliate/',
      '/contact/',
      '/user-service/',
      '/privacy-policy/',
      '/cookies-policy/',
      '/google-api-services-disclosure/',
      '/sitemap/',
      '/ai-studio/',
      '/ai-studio/video/',
      '/ai-studio/image/',
      '/spark/',
      '/alternatives/opus/',
      '/who-we-help/social-media-marketers/',
    ].forEach((pathname) => {
      expect(routeSet.has(pathname)).toBe(true);
    });
  });

  it('includes every required tool, audience, comparison, and locale family', () => {
    const manifest = getSiteManifest();

    expect(manifest.tools.map((tool) => tool.slug)).toEqual(
      expect.arrayContaining([
        'ai-podcast-clip-generator',
        'ai-video-editor',
        'ai-video-generator',
        'auto-subtitle-generator-online',
        'auto-video-editor',
        'clip-maker',
        'crop-video',
        'dictation-software',
        'facebook-video-editor',
        'free-online-editor',
        'instagram-video-editor',
        'linkedin-video-maker',
        'mp3-to-text',
        'mp4-to-text',
        'podcast-editor',
        'podcast-to-text',
        'repurpose-video',
        'resize-video',
        'screen-recorder',
        'share-video',
        'subtitle-editor',
        'tiktok-video-editor',
        'transcribe-audio-to-text',
        'transcription',
        'twitch-editor',
        'twitter-video-maker',
        'video-splitter',
        'video-to-text',
        'video-translator',
        'video-trimmer',
        'youtube-video-editor',
        'youtube-clip-maker',
        'youtube-shorts-maker',
        'twitter-downloader',
        'tiktok-downloader',
        'kling-3',
        'veo-3',
        'sora-2',
        'nano-banana-2',
        'luma',
        'hailuo',
      ]),
    );

    expect(manifest.audiences.map((audience) => audience.slug)).toEqual(
      expect.arrayContaining([
        'social-media-marketers',
        'content-marketers',
        'performance-marketers',
        'event-marketers',
        'podcasters',
        'coaches',
        'consultants',
        'agencies',
      ]),
    );

    expect(manifest.comparisons.map((comparison) => comparison.slug)).toEqual(
      expect.arrayContaining([
        'opus',
        'capcut',
        'vidyo',
        'getmunch',
        'captions',
        'submagic',
        'veed',
      ]),
    );

    expect(manifest.locales).toEqual(
      expect.arrayContaining([
        'ar',
        'bg',
        'cn',
        'cs',
        'da',
        'de',
        'el',
        'es',
        'fi',
        'fr',
        'he',
        'hi',
        'hr',
        'hu',
        'id',
        'it',
        'ja',
        'ko',
        'lt',
        'ms',
        'nl',
        'no',
        'pl',
        'pt',
        'ro',
        'ru',
        'sk',
        'sr',
        'sv',
        'tr',
        'tw',
        'uk',
        'vi',
        'zh',
      ]),
    );

    expect(manifest.routes.length).toBeGreaterThan(500);
    expect(manifest.routes.some((route) => route.pathname === '/ar/tools/ai-video-generator/')).toBe(true);
    expect(manifest.routes.some((route) => route.pathname === '/zh/tools/video-translator/')).toBe(true);
  });

  it('renders shared navigation, CTAs, and section content for representative pages', () => {
    const home = renderRoute('/');
    const api = renderRoute('/api/');
    const tools = renderRoute('/tools/');

    expect(home).toContain('InwitClipps');
    expect(home).toContain('AI Studio');
    expect(home).toContain('Get started for free');
    expect(home).toContain('viral clips');
    expect(home).toContain('Who we help');

    expect(api).toContain('InwitClipps API');
    expect(api).toContain('Python');
    expect(api).toContain('Java');
    expect(api).toContain('Go');
    expect(api).toContain('Curl');
    expect(api).toContain('READ DOCUMENTATION');

    expect(tools).toContain('All tools');
    expect(tools).toContain('Video translator');
    expect(tools).toContain('TikTok video editor');
    expect(tools).toContain('Locale expansion');
  });
});
