/**
 * tests/helpers/mockDb.js
 * Mock database client for testing.
 * Provides in-memory data store that mimics Drizzle ORM patterns.
 */

import { jest } from '@jest/globals';

class MockQueryBuilder {
  constructor(table, operation, data = []) {
    this.table = table;
    this.operation = operation;
    this.data = data;
    this.whereConditions = [];
    this.orderByFields = [];
    this.selectFields = null;
  }

  where(...conditions) {
    this.whereConditions.push(...conditions);
    return this;
  }

  orderBy(...fields) {
    this.orderByFields.push(...fields);
    return this;
  }

  returning() {
    return this;
  }

  then(resolve, reject) {
    try {
      let result;
      switch (this.operation) {
        case 'insert':
          result = [this.data];
          break;
        case 'select':
          result = this.applyFilters(mockDataStore[this.table] || []);
          if (this.selectFields) {
            result = result.map(item => {
              const selected = {};
              for (const key in this.selectFields) {
                selected[key] = item[key];
              }
              return selected;
            });
          }
          break;
        case 'update':
          result = this.applyFilters(mockDataStore[this.table] || [])
            .map(item => ({ ...item, ...this.data }));
          break;
        case 'delete':
          result = [];
          break;
        default:
          result = [];
      }
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }

  applyFilters(data) {
    // Simple filter implementation (can be enhanced)
    if (this.whereConditions.length === 0) return data;
    
    return data.filter(item => {
      return this.whereConditions.every(condition => {
        // Basic equality check (simplified)
        if (condition.field && condition.value) {
          return item[condition.field] === condition.value;
        }
        return true;
      });
    });
  }
}

const mockDataStore = {
  jobs: [],
  clips: [],
};

export const mockDb = {
  insert: (table) => ({
    values: (data) => new MockQueryBuilder(table.name, 'insert', data),
  }),
  
  select: (fields) => ({
    from: (table) => {
      const builder = new MockQueryBuilder(table.name, 'select');
      builder.selectFields = fields;
      return builder;
    },
  }),
  
  update: (table) => ({
    set: (data) => {
      const builder = new MockQueryBuilder(table.name, 'update', data);
      return builder;
    },
  }),
  
  delete: (table) => new MockQueryBuilder(table.name, 'delete'),
};

/**
 * Helper to seed mock data for tests.
 */
export function seedMockDb(table, data) {
  if (!mockDataStore[table]) {
    mockDataStore[table] = [];
  }
  mockDataStore[table].push(...data);
}

/**
 * Helper to clear all mock data.
 */
export function clearMockDb() {
  mockDataStore.jobs = [];
  mockDataStore.clips = [];
}

/**
 * Helper to get all data from a table.
 */
export function getMockData(table) {
  return mockDataStore[table] || [];
}
