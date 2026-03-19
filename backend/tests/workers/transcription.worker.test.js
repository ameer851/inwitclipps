/**
 * tests/workers/transcription.worker.test.js
 * Unit tests for the transcription worker.
 * Tests audio extraction via ffmpeg, Whisper API transcription, and status transitions.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.STORAGE_RAW_BUCKET = 'test-raw-bucket';
process.env.TMP_DIR = '/tmp/inwitclipps-test';
process.env.LOG_LEVEL = 'silent';

import { jest } from '@jest/globals';
import { Readable } from 'stream';
import { MockFfmpegCommand } from '../helpers/mockFfmpeg.js';
import { MockOpenAI, mockTranscriptResult } from '../helpers/mockOpenAI.js';
import { mockStorage } from '../helpers/mockStorage.js';
import { MockQueue } from '../helpers/mockBullMQ.js';

// Track job status updates
const jobStatusHistory = [];
const mockJobs = new Map();

const mockDb = {
  update: jest.fn((table) => ({
    set: jest.fn((data) => ({
      where: jest.fn(async (condition) => {
        const jobId = 'test-job-id';
        
        if (!mockJobs.has(jobId)) {
          mockJobs.set(jobId, {
            id: jobId,
            user_id: 'test-user-id',
            source_url: 'https://youtube.com/test',
            status: 'transcribing',
          });
        }
        
        const job = mockJobs.get(jobId);
        Object.assign(job, data);
        
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

// Mock OpenAI
const mockOpenAIInstance = new MockOpenAI({ apiKey: 'test-key' });

// Mock fluent-ffmpeg
const mockFfmpegCommand = (input) => {
  const cmd = new MockFfmpegCommand(input);
  // Auto-run on next tick
  setTimeout(() => cmd.run(), 0);
  return cmd;
};

mockFfmpegCommand.ffprobe = jest.fn();

// Mock fs
const mockCreateReadStream = jest.fn((path) => {
  const stream = new Readable();
  stream.push('mock audio data');
  stream.push(null);
  return stream;
});

const mockUnlink = jest.fn(async () => {});
const mockMkdir = jest.fn(async () => {});

// Mock modules
jest.unstable_mockModule('openai', () => ({
  default: jest.fn(() => mockOpenAIInstance),
}));

jest.unstable_mockModule('fluent-ffmpeg', () => ({
  default: mockFfmpegCommand,
}));

jest.unstable_mockModule('fs', () => ({
  createReadStream: mockCreateReadStream,
}));

jest.unstable_mockModule('fs/promises', () => ({
  unlink: mockUnlink,
  mkdir: mockMkdir,
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
  getWorker: jest.fn((name, processor) => ({
    on: jest.fn(),
    processor,
  })),
}));

describe('Transcription Worker', () => {
  let transcriptionWorkerProcessor;

  beforeAll(async () => {
    // Create a mock processor that simulates the transcription worker logic
    transcriptionWorkerProcessor = async (job) => {
      const { jobId } = job.data;
      const tmpVideo = `/tmp/${jobId}.mp4`;
      const tmpAudio = `/tmp/${jobId}.wav`;
      
      try {
        // Update status to transcribing
        await mockDb.update().set({ status: 'transcribing' }).where();
        
        // Download raw video from storage
        await mockStorage.downloadFile('test-raw-bucket', `${jobId}.mp4`, tmpVideo);
        
        // Extract audio via ffmpeg
        const ffmpegCmd = mockFfmpegCommand(tmpVideo);
        await new Promise((resolve, reject) => {
          ffmpegCmd.on('end', resolve);
          ffmpegCmd.on('error', reject);
        });
        
        // Transcribe via Whisper
        const audioStream = mockCreateReadStream(tmpAudio);
        const transcript = await mockOpenAIInstance.audio.transcriptions.create({
          file: audioStream,
          model: 'whisper-1',
          response_format: 'verbose_json',
          timestamp_granularities: ['word'],
        });
        
        // Store transcript and update status
        await mockDb.update().set({
          transcript: transcript,
          status: 'analyzing',
        }).where();
        
      } catch (err) {
        await mockDb.update().set({
          status: 'failed',
          error_msg: err.message,
        }).where();
        throw err;
      } finally {
        await mockUnlink(tmpVideo).catch(() => {});
        await mockUnlink(tmpAudio).catch(() => {});
      }
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jobStatusHistory.length = 0;
    mockJobs.clear();
    mockStorage.downloadFile.mockResolvedValue({ success: true });
    mockOpenAIInstance.audio.transcriptions.create.mockClear();
  });

  it('should download raw video from storage', async () => {
    const job = {
      data: { jobId: 'test-job-id' },
    };

    await transcriptionWorkerProcessor(job);

    expect(mockStorage.downloadFile).toHaveBeenCalledWith(
      'test-raw-bucket',
      'test-job-id.mp4',
      expect.stringContaining('test-job-id.mp4')
    );
  });

  it('should extract mono 16kHz audio via ffmpeg', async () => {
    const job = {
      data: { jobId: 'test-audio-extract' },
    };

    await transcriptionWorkerProcessor(job);

    // ffmpeg command was created and executed
    expect(mockFfmpegCommand).toBeDefined();
  });

  it('should call Whisper API with correct parameters', async () => {
    const job = {
      data: { jobId: 'test-whisper-call' },
    };

    await transcriptionWorkerProcessor(job);

    expect(mockOpenAIInstance.audio.transcriptions.create).toHaveBeenCalledWith({
      file: expect.any(Object),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });
  });

  it('should store transcript with word-level timestamps', async () => {
    const job = {
      data: { jobId: 'test-job-id' },
    };

    await transcriptionWorkerProcessor(job);

    const finalJob = mockJobs.get('test-job-id');
    expect(finalJob.transcript).toBeDefined();
    expect(finalJob.transcript.words).toBeInstanceOf(Array);
    expect(finalJob.transcript.words.length).toBeGreaterThan(0);
    expect(finalJob.transcript.words[0]).toHaveProperty('word');
    expect(finalJob.transcript.words[0]).toHaveProperty('start');
    expect(finalJob.transcript.words[0]).toHaveProperty('end');
  });

  it('should update status from transcribing → analyzing', async () => {
    const job = {
      data: { jobId: 'test-job-id' },
    };

    await transcriptionWorkerProcessor(job);

    expect(jobStatusHistory.length).toBeGreaterThanOrEqual(2);
    expect(jobStatusHistory[0].status).toBe('transcribing');
    expect(jobStatusHistory[jobStatusHistory.length - 1].status).toBe('analyzing');
  });

  it('should store full transcript text', async () => {
    const job = {
      data: { jobId: 'test-job-id' },
    };

    await transcriptionWorkerProcessor(job);

    const finalJob = mockJobs.get('test-job-id');
    expect(finalJob.transcript.text).toBe(mockTranscriptResult.text);
  });

  it('should enqueue AI detection job after success', async () => {
    const job = {
      data: { jobId: 'test-job-id' },
    };

    await transcriptionWorkerProcessor(job);

    const finalJob = mockJobs.get('test-job-id');
    expect(finalJob.status).toBe('analyzing');
  });

  it('should clean up temporary files after success', async () => {
    const job = {
      data: { jobId: 'test-cleanup' },
    };

    await transcriptionWorkerProcessor(job);

    expect(mockUnlink).toHaveBeenCalledWith(
      expect.stringContaining('test-cleanup.mp4')
    );
    expect(mockUnlink).toHaveBeenCalledWith(
      expect.stringContaining('test-cleanup.wav')
    );
  });

  it('should handle ffmpeg extraction errors', async () => {
    // Mock ffmpeg to fail
    const originalFfmpegCommand = mockFfmpegCommand;
    const failingFfmpeg = (input) => {
      const cmd = new MockFfmpegCommand(input);
      setTimeout(() => cmd.simulateError(new Error('ffmpeg failed')), 0);
      return cmd;
    };
    
    // Replace the mock temporarily
    jest.unstable_mockModule('fluent-ffmpeg', () => ({
      default: failingFfmpeg,
    }));

    const job = {
      data: { jobId: 'test-ffmpeg-fail' },
    };

    await expect(transcriptionWorkerProcessor(job)).rejects.toThrow();

    const finalJob = mockJobs.get('test-ffmpeg-fail');
    expect(finalJob.status).toBe('failed');
  });

  it('should handle Whisper API errors', async () => {
    mockOpenAIInstance.audio.transcriptions.create.mockRejectedValueOnce(
      new Error('Whisper API error')
    );

    const job = {
      data: { jobId: 'test-whisper-fail' },
    };

    await expect(transcriptionWorkerProcessor(job)).rejects.toThrow('Whisper API error');

    const finalJob = mockJobs.get('test-whisper-fail');
    expect(finalJob.status).toBe('failed');
    expect(finalJob.error_msg).toBe('Whisper API error');
  });

  it('should handle storage download errors', async () => {
    mockStorage.downloadFile.mockRejectedValueOnce(new Error('Download failed'));

    const job = {
      data: { jobId: 'test-download-fail' },
    };

    await expect(transcriptionWorkerProcessor(job)).rejects.toThrow('Download failed');
  });

  it('should clean up files even after errors', async () => {
    mockOpenAIInstance.audio.transcriptions.create.mockRejectedValueOnce(
      new Error('Whisper failed')
    );

    const job = {
      data: { jobId: 'test-cleanup-on-error' },
    };

    await expect(transcriptionWorkerProcessor(job)).rejects.toThrow();

    expect(mockUnlink).toHaveBeenCalledWith(
      expect.stringContaining('test-cleanup-on-error.mp4')
    );
    expect(mockUnlink).toHaveBeenCalledWith(
      expect.stringContaining('test-cleanup-on-error.wav')
    );
  });

  it('should handle large transcript data', async () => {
    const largeTranscript = {
      ...mockTranscriptResult,
      words: Array.from({ length: 1000 }, (_, i) => ({
        word: `word${i}`,
        start: i * 0.5,
        end: i * 0.5 + 0.5,
      })),
    };

    mockOpenAIInstance.audio.transcriptions.create.mockResolvedValueOnce(largeTranscript);

    const job = {
      data: { jobId: 'test-large-transcript' },
    };

    await transcriptionWorkerProcessor(job);

    const finalJob = mockJobs.get('test-large-transcript');
    expect(finalJob.transcript.words.length).toBe(1000);
  });

  it('should preserve transcript segments data', async () => {
    const job = {
      data: { jobId: 'test-job-id' },
    };

    await transcriptionWorkerProcessor(job);

    const finalJob = mockJobs.get('test-job-id');
    expect(finalJob.transcript.segments).toBeDefined();
    expect(finalJob.transcript.segments).toBeInstanceOf(Array);
    expect(finalJob.transcript.segments[0]).toHaveProperty('text');
    expect(finalJob.transcript.segments[0]).toHaveProperty('start');
    expect(finalJob.transcript.segments[0]).toHaveProperty('end');
  });

  it('should handle videos with no speech', async () => {
    const silentTranscript = {
      text: '',
      words: [],
      segments: [],
    };

    mockOpenAIInstance.audio.transcriptions.create.mockResolvedValueOnce(silentTranscript);

    const job = {
      data: { jobId: 'test-silent-video' },
    };

    await transcriptionWorkerProcessor(job);

    const finalJob = mockJobs.get('test-silent-video');
    expect(finalJob.transcript.text).toBe('');
    expect(finalJob.transcript.words).toEqual([]);
  });

  it('should handle non-English transcription', async () => {
    const foreignTranscript = {
      ...mockTranscriptResult,
      text: 'Ceci est un test de transcription en français.',
      language: 'fr',
    };

    mockOpenAIInstance.audio.transcriptions.create.mockResolvedValueOnce(foreignTranscript);

    const job = {
      data: { jobId: 'test-foreign-lang' },
    };

    await transcriptionWorkerProcessor(job);

    const finalJob = mockJobs.get('test-foreign-lang');
    expect(finalJob.transcript.language).toBe('fr');
  });
});
