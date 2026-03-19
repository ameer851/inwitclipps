/**
 * tests/helpers/mockOpenAI.js
 * Mock OpenAI SDK for testing Whisper transcription and GPT interactions.
 */

import { jest } from '@jest/globals';

export const mockTranscriptResult = {
  text: 'This is a test transcription of the video content.',
  language: 'en',
  duration: 120.5,
  words: [
    { word: 'This', start: 0.0, end: 0.5 },
    { word: 'is', start: 0.5, end: 0.8 },
    { word: 'a', start: 0.8, end: 1.0 },
    { word: 'test', start: 1.0, end: 1.5 },
    { word: 'transcription', start: 1.5, end: 2.5 },
    { word: 'of', start: 2.5, end: 2.8 },
    { word: 'the', start: 2.8, end: 3.0 },
    { word: 'video', start: 3.0, end: 3.5 },
    { word: 'content', start: 3.5, end: 4.0 },
  ],
  segments: [
    {
      id: 0,
      seek: 0,
      start: 0.0,
      end: 4.0,
      text: 'This is a test transcription of the video content.',
      tokens: [1, 2, 3, 4, 5],
      temperature: 0.0,
      avg_logprob: -0.5,
      compression_ratio: 1.2,
      no_speech_prob: 0.01,
    },
  ],
};

export class MockOpenAI {
  constructor(config) {
    this.apiKey = config?.apiKey;
    this.audio = {
      transcriptions: {
        create: jest.fn(async ({ file, model, response_format, timestamp_granularities }) => {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 10));
          
          if (response_format === 'verbose_json' && timestamp_granularities?.includes('word')) {
            return mockTranscriptResult;
          }
          
          return {
            text: mockTranscriptResult.text,
          };
        }),
      },
    };
    
    this.chat = {
      completions: {
        create: jest.fn(async ({ messages, model }) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          
          return {
            id: 'chatcmpl-test-123',
            object: 'chat.completion',
            created: Date.now(),
            model: model || 'gpt-4',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: JSON.stringify({
                    clips: [
                      {
                        start_time: 10.5,
                        end_time: 25.3,
                        virality_score: 85,
                        reason: 'High engagement hook with trending topic',
                      },
                    ],
                  }),
                },
                finish_reason: 'stop',
              },
            ],
            usage: {
              prompt_tokens: 100,
              completion_tokens: 50,
              total_tokens: 150,
            },
          };
        }),
      },
    };
  }
}

export function createMockOpenAI(config) {
  return new MockOpenAI(config);
}

export default MockOpenAI;
