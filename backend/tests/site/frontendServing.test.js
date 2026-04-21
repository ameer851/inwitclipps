/**
 * frontendServing.test.js
 * Ensures the Express app serves the generated marketing frontend.
 */

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.LOG_LEVEL = 'silent';

import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(async () => ({
        data: { user: { id: 'test-user-id-123', email: 'test@example.com' } },
        error: null,
      })),
    },
  })),
}));

jest.unstable_mockModule('../../src/db/index.js', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          orderBy: jest.fn(async () => []),
          limit: jest.fn(async () => []),
        })),
        orderBy: jest.fn(() => ({
          limit: jest.fn(async () => []),
        })),
        limit: jest.fn(async () => []),
      })),
    })),
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(async () => []),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(async () => []),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(async () => []),
    })),
  },
}));

jest.unstable_mockModule('../../src/services/queue.js', () => ({
  getQueue: jest.fn(() => ({
    add: jest.fn(async () => ({})),
  })),
}));

jest.unstable_mockModule('../../src/services/storage.js', () => ({
  getSignedUrl: jest.fn(async () => 'https://example.com/download.mp4'),
}));

jest.unstable_mockModule('../../src/services/trendfetcher.js', () => ({
  startTrendFetcher: jest.fn(),
  triggerManualSync: jest.fn(async () => undefined),
}));

const { default: app } = await import('../../src/app.js');

describe('frontend static serving', () => {
  it('serves the generated homepage from root', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('InwitClipps');
    expect(response.text).toContain('AI Studio');
    expect(response.text).toContain('Get started for free');
  });

  it('serves generated nested marketing pages', async () => {
    const pricing = await request(app).get('/pricing/');
    const localizedTool = await request(app).get('/ar/tools/ai-video-generator/');

    expect(pricing.status).toBe(200);
    expect(pricing.text).toContain('Pricing');
    expect(pricing.text).toContain('FAQ');

    expect(localizedTool.status).toBe(200);
    expect(localizedTool.text).toContain('ai video generator');
    expect(localizedTool.text).toContain('Locale: AR');
  });

  it('keeps health checks available alongside the frontend', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'inwitclipps-api',
    });
  });
});
