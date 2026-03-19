/**
 * tests/helpers/mockStorage.js
 * Mock storage service for testing S3/Supabase Storage interactions.
 */

import { jest } from '@jest/globals';

const mockFileStore = new Map();

export const mockStorage = {
  uploadFile: jest.fn(async (bucket, path, filePath, contentType) => {
    mockFileStore.set(`${bucket}/${path}`, {
      path: filePath,
      contentType,
      uploadedAt: new Date(),
    });
    return { path: `${bucket}/${path}` };
  }),

  downloadFile: jest.fn(async (bucket, path, destinationPath) => {
    const key = `${bucket}/${path}`;
    if (mockFileStore.has(key)) {
      // Simulate file download by returning success
      return { success: true, destination: destinationPath };
    }
    throw new Error(`File not found: ${key}`);
  }),

  deleteFile: jest.fn(async (bucket, path) => {
    const key = `${bucket}/${path}`;
    mockFileStore.delete(key);
    return { success: true };
  }),

  getPublicUrl: jest.fn((bucket, path) => {
    return `https://mock-storage.example.com/${bucket}/${path}`;
  }),
};

export function resetMockStorage() {
  mockFileStore.clear();
  mockStorage.uploadFile.mockClear();
  mockStorage.downloadFile.mockClear();
  mockStorage.deleteFile.mockClear();
  mockStorage.getPublicUrl.mockClear();
}

export function getMockStorageFiles() {
  return Array.from(mockFileStore.keys());
}
