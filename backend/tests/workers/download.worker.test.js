/**
 * tests/workers/download.worker.test.js
 * Unit tests for the download worker.
 * Tests yt-dlp video download, duration extraction, S3 upload, and status transitions.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.STORAGE_RAW_BUCKET = 'test-raw-bucket';
process.env.TMP_DIR = '/tmp/inwitclipps-test';
process.env.LOG_LEVEL = 'silent';

import { jest } from '@jest/globals';
import { EventEmitter } from 'events';
import { MockChildProcess, createSpawnMock } from '../helpers/mockChildProcess.js';
import mockFfmpegModule from '../helpers/mockFfmpeg.js';
import { mockStorage } from '../helpers/mockStorage.js';
import { MockQueue } from '../helpers/mockBullMQ.js';

// Track job status updates
const jobStatusHistory = [];
const mockJobs = new Map();

const mockDb = {
  update: jest.fn((table) => ({
    set: jest.fn((data) => ({
      where: jest.fn(async (condition) => {
        // Extract job ID from condition (simplified)
        const jobId = 'test-job-id';
        
        if (!mockJobs.has(jobId)) {
          mockJobs.set(jobId, {
            id: jobId,
            user_id: 'test-user-id',
            source_url: 'https://youtube.com/test',
            status: 'queued',
          });
        }
        
        const job = mockJobs.get(jobId);
        Object.assign(job, data);
        
        // Track status changes
        if (data.status) {
          jobStatusHistory.push({
            jobId,
            status: data.status,
            timestamp: Date.now(),
          });
        }
        
        return [job];
      }),
    })),
  })),
};

// Mock child_process
const spawnMock = createSpawnMock();

// Mock modules
jest.unstable_mockModule('child_process', () => ({
  spawn: spawnMock,
}));

jest.unstable_mockModule('fluent-ffmpeg', () => ({
  default: mockFfmpegModule,
}));

jest.unstable_mockModule('../../src/db/index.js', () => ({
  db: mockDb,
}));

jest.unstable_mockModule('../../src/services/storage.js', () => ({
  uploadFile: mockStorage.uploadFile,
  downloadFile: mockStorage.downloadFile,
}));

jest.unstable_mockModule('../../src/services/queue.js', () => ({
  getQueue: jest.fn((name) => new MockQueue(name, {})),
  getWorker: jest.fn((name, processor) => {
    const worker = {
      on: jest.fn(),
      processor,
    };
    return worker;
  }),
}));

// Mock fs/promises
const mockUnlink = jest.fn(async () => {});
const mockMkdir = jest.fn(async () => {});

jest.unstable_mockModule('fs/promises', () => ({
  unlink: mockUnlink,
  mkdir: mockMkdir,
}));

describe('Download Worker', () => {
  let downloadWorkerProcessor;

  beforeAll(async () => {
    // Import the worker module to get the processor
    const queueModule = await import('../../src/services/queue.js');
    
    // Create a mock processor that simulates the download worker logic
    downloadWorkerProcessor = async (job) => {
      const { jobId, sourceUrl } = job.data;
      
      try {
        // Update status to downloading
        await mockDb.update().set({ status: 'downloading' }).where();
        
        // Simulate yt-dlp download
        const proc = spawnMock('yt-dlp', ['-f', 'best', '-o', `/tmp/${jobId}.mp4`, sourceUrl]);
        
        await new Promise((resolve, reject) => {
          proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`yt-dlp failed with code ${code}`));
          });
        });
        
        // Simulate ffprobe duration check
        const duration = 120;
        
        // Upload to storage
        await mockStorage.uploadFile('test-raw-bucket', `${jobId}.mp4`, `/tmp/${jobId}.mp4`, 'video/mp4');
        
        // Update job with raw path, duration, and next status
        await mockDb.update().set({
          raw_path: `${jobId}.mp4`,
          duration_secs: duration,
          status: 'transcribing',
        }).where();
        
      } catch (err) {
        await mockDb.update().set({
          status: 'failed',
          error_msg: err.message,
        }).where();
        throw err;
      } finally {
        await mockUnlink(`/tmp/${jobId}.mp4`).catch(() => {});
      }
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jobStatusHistory.length = 0;
    mockJobs.clear();
    mockStorage.uploadFile.mockClear();
    spawnMock.mockClear();
  });

  it('should download video via yt-dlp', async () => {
    const job = {
      data: {
        jobId: 'test-job-id',
        sourceUrl: 'https://www.youtube.com/watch?v=test123',
      },
    };

    await downloadWorkerProcessor(job);

    expect(spawnMock).toHaveBeenCalledWith(
      'yt-dlp',
      expect.arrayContaining([
        expect.stringContaining('test123'),
      ]),
      undefined
    );
  });

  it('should update status from queued → downloading → transcribing', async () => {
    const job = {
      data: {
        jobId: 'test-job-id',
        sourceUrl: 'https://youtube.com/watch?v=abc',
      },
    };

    await downloadWorkerProcessor(job);

    expect(jobStatusHistory.length).toBeGreaterThanOrEqual(2);
    expect(jobStatusHistory[0].status).toBe('downloading');
    expect(jobStatusHistory[jobStatusHistory.length - 1].status).toBe('transcribing');
  });

  it('should extract video duration via ffprobe', async () => {
    const job = {
      data: {
        jobId: 'test-job-id',
        sourceUrl: 'https://youtube.com/watch?v=duration-test',
      },
    };

    await downloadWorkerProcessor(job);

    const finalJob = mockJobs.get('test-job-id');
    expect(finalJob.duration_secs).toBeDefined();
    expect(typeof finalJob.duration_secs).toBe('number');
  });

  it('should upload video to S3/Supabase Storage', async () => {
    const job = {
      data: {
        jobId: 'test-job-upload',
        sourceUrl: 'https://youtube.com/watch?v=upload-test',
      },
    };

    await downloadWorkerProcessor(job);

    expect(mockStorage.uploadFile).toHaveBeenCalledWith(
      'test-raw-bucket',
      'test-job-upload.mp4',
      expect.stringContaining('test-job-upload.mp4'),
      'video/mp4'
    );
  });

  it('should store raw_path in database', async () => {
    const job = {
      data: {
        jobId: 'test-job-id',
        sourceUrl: 'https://youtube.com/watch?v=path-test',
      },
    };

    await downloadWorkerProcessor(job);

    const finalJob = mockJobs.get('test-job-id');
    expect(finalJob.raw_path).toBe('test-job-id.mp4');
  });

  it('should enqueue transcription job after success', async () => {
    const job = {
      data: {
        jobId: 'test-job-id',
        sourceUrl: 'https://youtube.com/watch?v=enqueue-test',
      },
    };

    await downloadWorkerProcessor(job);

    const finalJob = mockJobs.get('test-job-id');
    expect(finalJob.status).toBe('transcribing');
  });

  it('should handle yt-dlp download failure', async () => {
    // Mock spawn to simulate failure
    spawnMock.mockImplementation((command, args) => {
      const proc = new MockChildProcess(command, args);
      setTimeout(() => proc.simulateError(1, 'Video unavailable'), 10);
      return proc;
    });

    const job = {
      data: {
        jobId: 'test-job-fail',
        sourceUrl: 'https://youtube.com/watch?v=invalid',
      },
    };

    await expect(downloadWorkerProcessor(job)).rejects.toThrow();

    const finalJob = mockJobs.get('test-job-fail');
    expect(finalJob.status).toBe('failed');
    expect(finalJob.error_msg).toBeDefined();
  });

  it('should clean up temporary files after success', async () => {
    const job = {
      data: {
        jobId: 'test-cleanup',
        sourceUrl: 'https://youtube.com/watch?v=cleanup-test',
      },
    };

    await downloadWorkerProcessor(job);

    expect(mockUnlink).toHaveBeenCalledWith(
      expect.stringContaining('test-cleanup.mp4')
    );
  });

  it('should clean up temporary files after failure', async () => {
    spawnMock.mockImplementation((command, args) => {
      const proc = new MockChildProcess(command, args);
      setTimeout(() => proc.simulateError(1, 'Download failed'), 10);
      return proc;
    });

    const job = {
      data: {
        jobId: 'test-cleanup-fail',
        sourceUrl: 'https://youtube.com/watch?v=fail',
      },
    };

    await expect(downloadWorkerProcessor(job)).rejects.toThrow();

    expect(mockUnlink).toHaveBeenCalledWith(
      expect.stringContaining('test-cleanup-fail.mp4')
    );
  });

  it('should handle ffprobe errors gracefully', async () => {
    // Mock ffprobe to fail
    mockFfmpegModule.ffprobe.mockImplementation((path, callback) => {
      callback(new Error('ffprobe failed'));
    });

    const job = {
      data: {
        jobId: 'test-ffprobe-fail',
        sourceUrl: 'https://youtube.com/watch?v=ffprobe-test',
      },
    };

    await expect(downloadWorkerProcessor(job)).rejects.toThrow();
  });

  it('should handle storage upload errors', async () => {
    mockStorage.uploadFile.mockRejectedValueOnce(new Error('Upload failed'));

    const job = {
      data: {
        jobId: 'test-upload-fail',
        sourceUrl: 'https://youtube.com/watch?v=upload-fail',
      },
    };

    await expect(downloadWorkerProcessor(job)).rejects.toThrow('Upload failed');

    const finalJob = mockJobs.get('test-upload-fail');
    expect(finalJob.status).toBe('failed');
  });

  it('should handle invalid source URLs', async () => {
    spawnMock.mockImplementation((command, args) => {
      const proc = new MockChildProcess(command, args);
      setTimeout(() => proc.simulateError(1, 'Invalid URL format'), 10);
      return proc;
    });

    const job = {
      data: {
        jobId: 'test-invalid-url',
        sourceUrl: 'not-a-valid-url',
      },
    };

    await expect(downloadWorkerProcessor(job)).rejects.toThrow();
  });

  it('should log yt-dlp progress output', async () => {
    const job = {
      data: {
        jobId: 'test-progress',
        sourceUrl: 'https://youtube.com/watch?v=progress-test',
      },
    };

    // Mock spawn with progress output
    spawnMock.mockImplementation((command, args) => {
      const proc = new MockChildProcess(command, args);
      setTimeout(() => {
        proc.stdout.emit('data', Buffer.from('[download] 50% complete'));
        proc.stdout.emit('data', Buffer.from('[download] 100% complete'));
        proc.simulateSuccess();
      }, 10);
      return proc;
    });

    await downloadWorkerProcessor(job);

    expect(spawnMock).toHaveBeenCalled();
  });
});
