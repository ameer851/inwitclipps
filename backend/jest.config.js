/**
 * jest.config.js
 * Jest configuration for InwitClipps backend tests.
 * Uses ES modules, sets up test environment, and configures coverage.
 */

export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.test.js',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/workers/index.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
