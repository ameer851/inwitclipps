/**
 * tests/helpers/mockBullMQ.js
 * Mock BullMQ Queue and Worker for testing.
 * Provides in-memory queue simulation without Redis.
 */

import { jest } from '@jest/globals';

const jobStore = new Map();
let jobIdCounter = 1;

export class MockQueue {
  constructor(name, options) {
    this.name = name;
    this.options = options;
    this.jobs = [];
  }

  async add(jobName, data, options) {
    const job = {
      id: String(jobIdCounter++),
      name: jobName,
      data,
      options,
      timestamp: Date.now(),
    };
    this.jobs.push(job);
    jobStore.set(job.id, job);
    return job;
  }

  async getJob(jobId) {
    return jobStore.get(jobId);
  }

  async close() {
    return Promise.resolve();
  }

  async obliterate() {
    this.jobs = [];
    return Promise.resolve();
  }
}

export class MockWorker {
  constructor(name, processor, options) {
    this.name = name;
    this.processor = processor;
    this.options = options;
    this.eventHandlers = new Map();
  }

  on(event, handler) {
    this.eventHandlers.set(event, handler);
    return this;
  }

  async close() {
    return Promise.resolve();
  }

  // Test helper: manually trigger job processing
  async processJob(data) {
    const job = {
      id: String(jobIdCounter++),
      data,
      name: this.name,
    };
    return this.processor(job);
  }
}

/**
 * Creates a mock queue that can be used in tests.
 */
export function createMockQueue(name) {
  return new MockQueue(name, {});
}

/**
 * Creates a mock worker that can be used in tests.
 */
export function createMockWorker(name, processor) {
  return new MockWorker(name, processor, {});
}

/**
 * Resets all job stores (call between tests).
 */
export function resetMockQueues() {
  jobStore.clear();
  jobIdCounter = 1;
}
