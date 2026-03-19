/**
 * tests/helpers/mockFfmpeg.js
 * Mock fluent-ffmpeg for testing video/audio processing.
 */

import { EventEmitter } from 'events';
import { jest } from '@jest/globals';

export class MockFfmpegCommand extends EventEmitter {
  constructor(input) {
    super();
    this.input = input;
    this.outputPath = null;
    this.options = {};
  }

  audioChannels(channels) {
    this.options.audioChannels = channels;
    return this;
  }

  audioFrequency(freq) {
    this.options.audioFrequency = freq;
    return this;
  }

  noVideo() {
    this.options.noVideo = true;
    return this;
  }

  format(fmt) {
    this.options.format = fmt;
    return this;
  }

  output(path) {
    this.outputPath = path;
    return this;
  }

  on(event, handler) {
    this.addListener(event, handler);
    return this;
  }

  run() {
    process.nextTick(() => {
      this.emit('start', `ffmpeg -i ${this.input} ${this.outputPath}`);
      setTimeout(() => {
        this.emit('end');
      }, 10);
    });
  }

  // Test helper: simulate error
  simulateError(error) {
    process.nextTick(() => {
      this.emit('error', error);
    });
  }
}

// Mock ffprobe
export const mockFfprobe = jest.fn((filePath, callback) => {
  process.nextTick(() => {
    callback(null, {
      format: {
        duration: 120.5, // Default 120.5 seconds
        size: 1024000,
        bit_rate: 256000,
      },
      streams: [
        {
          codec_type: 'video',
          width: 1920,
          height: 1080,
        },
        {
          codec_type: 'audio',
          sample_rate: 48000,
        },
      ],
    });
  });
});

export function createMockFfmpeg(input) {
  return new MockFfmpegCommand(input);
}

// Default export mimics fluent-ffmpeg module structure
const mockFfmpegModule = Object.assign(createMockFfmpeg, {
  ffprobe: mockFfprobe,
  setFfmpegPath: jest.fn(),
  setFfprobePath: jest.fn(),
});

export default mockFfmpegModule;
