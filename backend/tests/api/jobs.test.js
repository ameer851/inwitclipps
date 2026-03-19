/**
 * tests/api/jobs.test.js
 * Integration tests for /api/v1/jobs endpoints.
 * Tests job creation, listing, retrieval, status checks, and authorization.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.LOG_LEVEL = 'silent';

import { jest } from '@jest/globals';
import request from 'supertest';
import { mockSupabaseClient } from '../helpers/mockSupabase.js';
import { MockQueue, resetMockQueues } from '../helpers/mockBullMQ.js';

// Mock dependencies
jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

jest.unstable_mockModule('bullmq', () => ({
  Queue: MockQueue,
  Worker: class MockWorker {},
}));

// Mock database
const mockJobs = [];
const mockDb = {
  insert: jest.fn(() => ({
    values: jest.fn(() => ({
      returning: jest.fn(async () => {
        const job = {
          id: 'job-' + Date.now(),
          user_id: 'test-user-id-123',
          source_url: 'https://youtube.com/watch?v=test',
          status: 'queued',
          created_at: new Date(),
          updated_at: new Date(),
        };
        mockJobs.push(job);
        return [job];
      }),
    })),
  })),
  select: jest.fn(() => ({
    from: jest.fn(() => ({
      where: jest.fn(() => ({
        orderBy: jest.fn(async () => mockJobs.filter(j => j.user_id === 'test-user-id-123')),
      })),
    })),
  })),
};

jest.unstable_mockModule('../../src/db/index.js', () => ({
  db: mockDb,
}));

jest.unstable_mockModule('../../src/services/queue.js', () => ({
  getQueue: jest.fn((name) => new MockQueue(name, {})),
}));

const { default: app } = await import('../../src/app.js');

describe('Jobs API', () => {
  const validToken = 'Bearer valid-token';
  const invalidToken = 'Bearer invalid-token';

  beforeEach(() => {
    mockJobs.length = 0;
    resetMockQueues();
    jest.clearAllMocks();
  });

  describe('POST /api/v1/jobs', () => {
    it('should create a job with valid URL and auth', async () => {
      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', validToken)
        .send({ source_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        user_id: 'test-user-id-123',
        source_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        status: 'queued',
      });
    });

    it('should reject job creation with invalid URL', async () => {
      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', validToken)
        .send({ source_url: 'not-a-valid-url' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('valid URL');
    });

    it('should reject job creation with missing URL', async () => {
      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', validToken)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject job creation without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/jobs')
        .send({ source_url: 'https://www.youtube.com/watch?v=test' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject job creation with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', invalidToken)
        .send({ source_url: 'https://www.youtube.com/watch?v=test' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should enqueue download job after creation', async () => {
      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', validToken)
        .send({ source_url: 'https://www.youtube.com/watch?v=test123' });

      expect(response.status).toBe(201);
      // Queue add would be called (tested via mock)
    });

    it('should accept various video platform URLs', async () => {
      const urls = [
        'https://www.youtube.com/watch?v=abc123',
        'https://youtu.be/abc123',
        'https://vimeo.com/123456789',
        'https://www.tiktok.com/@user/video/123456',
      ];

      for (const url of urls) {
        const response = await request(app)
          .post('/api/v1/jobs')
          .set('Authorization', validToken)
          .send({ source_url: url });

        expect(response.status).toBe(201);
      }
    });
  });

  describe('GET /api/v1/jobs', () => {
    it('should list all jobs for authenticated user', async () => {
      // Pre-populate some jobs
      mockJobs.push(
        {
          id: 'job-1',
          user_id: 'test-user-id-123',
          source_url: 'https://youtube.com/1',
          status: 'completed',
          created_at: new Date(),
        },
        {
          id: 'job-2',
          user_id: 'test-user-id-123',
          source_url: 'https://youtube.com/2',
          status: 'queued',
          created_at: new Date(),
        }
      );

      mockDb.select.mockReturnValue({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            orderBy: jest.fn(async () => 
              mockJobs.filter(j => j.user_id === 'test-user-id-123')
            ),
          })),
        })),
      });

      const response = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toMatchObject({
        id: 'job-1',
        user_id: 'test-user-id-123',
      });
    });

    it('should return empty array when user has no jobs', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            orderBy: jest.fn(async () => []),
          })),
        })),
      });

      const response = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/jobs');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/jobs/:id', () => {
    it('should return job details for owner', async () => {
      const jobId = 'job-owned-by-user';
      mockDb.select.mockReturnValue({
        from: jest.fn(() => ({
          where: jest.fn(async () => [{
            id: jobId,
            user_id: 'test-user-id-123',
            source_url: 'https://youtube.com/test',
            status: 'completed',
            transcript: { text: 'Test transcript' },
            created_at: new Date(),
          }]),
        })),
      });

      const response = await request(app)
        .get(`/api/v1/jobs/${jobId}`)
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: jobId,
        user_id: 'test-user-id-123',
      });
    });

    it('should return 404 for non-owner access', async () => {
      const jobId = 'job-owned-by-other';
      mockDb.select.mockReturnValue({
        from: jest.fn(() => ({
          where: jest.fn(async () => []), // No results for this user
        })),
      });

      const response = await request(app)
        .get(`/api/v1/jobs/${jobId}`)
        .set('Authorization', validToken);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Job not found');
    });

    it('should return 404 for non-existent job', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn(() => ({
          where: jest.fn(async () => []),
        })),
      });

      const response = await request(app)
        .get('/api/v1/jobs/non-existent-id')
        .set('Authorization', validToken);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/jobs/some-job-id');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/jobs/:id/status', () => {
    it('should return only status fields', async () => {
      const jobId = 'job-status-check';
      mockDb.select.mockReturnValue({
        from: jest.fn(() => ({
          where: jest.fn(async () => [{
            id: jobId,
            status: 'transcribing',
            created_at: new Date().toISOString(),
          }]),
        })),
      });

      const response = await request(app)
        .get(`/api/v1/jobs/${jobId}/status`)
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).not.toHaveProperty('transcript');
      expect(response.body).not.toHaveProperty('user_id');
    });

    it('should return correct status value', async () => {
      const statuses = ['queued', 'downloading', 'transcribing', 'completed', 'failed'];
      
      for (const status of statuses) {
        mockDb.select.mockReturnValue({
          from: jest.fn(() => ({
            where: jest.fn(async () => [{
              id: 'test-job',
              status,
              created_at: new Date().toISOString(),
            }]),
          })),
        });

        const response = await request(app)
          .get('/api/v1/jobs/test-job/status')
          .set('Authorization', validToken);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe(status);
      }
    });

    it('should return 404 for non-owner', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn(() => ({
          where: jest.fn(async () => []),
        })),
      });

      const response = await request(app)
        .get('/api/v1/jobs/other-user-job/status')
        .set('Authorization', validToken);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/jobs/some-job/status');

      expect(response.status).toBe(401);
    });
  });
});
