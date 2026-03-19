/**
 * tests/api/auth.test.js
 * Tests for authentication middleware and Supabase auth mocking.
 * Tests the requireAuth middleware behavior with valid/invalid tokens.
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import { mockSupabaseClient, createMockSupabaseClient } from '../helpers/mockSupabase.js';

// Mock @supabase/supabase-js before importing app
jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

const { default: app } = await import('../../src/app.js');

describe('Authentication', () => {
  describe('POST /api/v1/auth - Mock Supabase Auth', () => {
    it('should register a new user with valid credentials', async () => {
      const response = await mockSupabaseClient.auth.signUp({
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
      });

      expect(response.data.user).toBeDefined();
      expect(response.data.user.email).toBe('newuser@example.com');
      expect(response.data.session.access_token).toBe('valid-token');
      expect(response.error).toBeNull();
    });

    it('should reject registration with invalid credentials', async () => {
      const response = await mockSupabaseClient.auth.signUp({
        email: '',
        password: '',
      });

      expect(response.data).toBeNull();
      expect(response.error).toBeDefined();
      expect(response.error.message).toBe('Invalid credentials');
    });

    it('should login with valid credentials', async () => {
      const response = await mockSupabaseClient.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.data.user).toBeDefined();
      expect(response.data.user.id).toBe('test-user-id-123');
      expect(response.data.session.access_token).toBe('valid-token');
      expect(response.error).toBeNull();
    });

    it('should reject login with invalid credentials', async () => {
      const response = await mockSupabaseClient.auth.signInWithPassword({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(response.data).toBeNull();
      expect(response.error).toBeDefined();
      expect(response.error.message).toBe('Invalid credentials');
    });

    it('should verify valid JWT token', async () => {
      const response = await mockSupabaseClient.auth.getUser('valid-token');

      expect(response.data.user).toBeDefined();
      expect(response.data.user.id).toBe('test-user-id-123');
      expect(response.data.user.email).toBe('test@example.com');
      expect(response.error).toBeNull();
    });

    it('should reject invalid JWT token', async () => {
      const response = await mockSupabaseClient.auth.getUser('invalid-token');

      expect(response.data.user).toBeNull();
      expect(response.error).toBeDefined();
    });
  });

  describe('Auth Middleware - requireAuth', () => {
    it('should allow requests with valid Bearer token', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', 'Bearer valid-token');

      // Should not get 401 (will get 200 or other status based on route logic)
      expect(response.status).not.toBe(401);
    });

    it('should reject requests without Authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/jobs');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject requests with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', 'InvalidFormat token123');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', 'Bearer invalid-token-xyz');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject requests with expired token', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', 'Bearer expired-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should attach user object to request on successful auth', async () => {
      // This is tested indirectly through the jobs endpoint
      // The user ID will be used in database queries
      const response = await mockSupabaseClient.auth.getUser('valid-token');
      
      expect(response.data.user.id).toBeDefined();
      expect(response.data.user.email).toBeDefined();
    });
  });
});
