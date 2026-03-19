/**
 * tests/helpers/mockSupabase.js
 * Mock Supabase client for testing.
 * Provides mock auth and storage methods.
 */

export const mockSupabaseUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
};

export const mockSupabaseClient = {
  auth: {
    getUser: async (token) => {
      if (token === 'valid-token') {
        return {
          data: { user: mockSupabaseUser },
          error: null,
        };
      }
      return {
        data: { user: null },
        error: { message: 'Invalid token' },
      };
    },
    signUp: async ({ email, password }) => {
      if (email && password) {
        return {
          data: {
            user: { ...mockSupabaseUser, email },
            session: { access_token: 'valid-token' },
          },
          error: null,
        };
      }
      return {
        data: null,
        error: { message: 'Invalid credentials' },
      };
    },
    signInWithPassword: async ({ email, password }) => {
      if (email === 'test@example.com' && password === 'password123') {
        return {
          data: {
            user: mockSupabaseUser,
            session: { access_token: 'valid-token' },
          },
          error: null,
        };
      }
      return {
        data: null,
        error: { message: 'Invalid credentials' },
      };
    },
  },
  storage: {
    from: (bucket) => ({
      upload: async (path, file) => {
        return { data: { path }, error: null };
      },
      download: async (path) => {
        return { data: Buffer.from('mock file data'), error: null };
      },
      remove: async (paths) => {
        return { data: { paths }, error: null };
      },
    }),
  },
};

/**
 * Factory function to create a mock Supabase client.
 * Can be used to replace @supabase/supabase-js createClient.
 */
export function createMockSupabaseClient() {
  return mockSupabaseClient;
}
