/**
 * tests/helpers/mockChildProcess.js
 * Mock child_process.spawn for testing yt-dlp interactions.
 */

import { EventEmitter } from 'events';
import { jest } from '@jest/globals';

export class MockChildProcess extends EventEmitter {
  constructor(command, args, options) {
    super();
    this.command = command;
    this.args = args;
    this.options = options;
    this.stdout = new EventEmitter();
    this.stderr = new EventEmitter();
    this.stdin = {
      write: jest.fn(),
      end: jest.fn(),
    };
  }

  kill(signal) {
    this.emit('close', 0);
  }

  // Test helpers
  simulateSuccess(stdout = '', stderr = '') {
    if (stdout) {
      this.stdout.emit('data', Buffer.from(stdout));
    }
    if (stderr) {
      this.stderr.emit('data', Buffer.from(stderr));
    }
    process.nextTick(() => this.emit('close', 0));
  }

  simulateError(code = 1, stderr = 'Error occurred') {
    this.stderr.emit('data', Buffer.from(stderr));
    process.nextTick(() => this.emit('close', code));
  }
}

let spawnMock = jest.fn();

export function createSpawnMock() {
  spawnMock = jest.fn((command, args, options) => {
    const proc = new MockChildProcess(command, args, options);
    
    // Default behavior: simulate success after a short delay
    setTimeout(() => {
      if (command === 'yt-dlp') {
        proc.simulateSuccess('[download] 100% complete', '');
      }
    }, 10);
    
    return proc;
  });
  
  return spawnMock;
}

export function getSpawnMock() {
  return spawnMock;
}

export function resetSpawnMock() {
  spawnMock.mockClear();
}
