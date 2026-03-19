/**
 * workers/transcription.worker.js
 * BullMQ worker for the 'transcription' queue.
 * Downloads raw video from Supabase Storage, extracts audio with ffmpeg,
 * transcribes via OpenAI Whisper (verbose_json with word timestamps),
 * stores transcript in DB, then enqueues AI clip detection.
 * Key dependencies: bullmq, fluent-ffmpeg, openai, drizzle-orm, storage service
 */

import 'dotenv/config';
import { createReadStream } from 'fs';
import { unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { db } from '../db/index.js';
import { jobs } from '../db/schema.js';
import { downloadFile } from '../services/storage.js';
import { getWorker, getQueue } from '../services/queue.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TMP_DIR = process.env.TMP_DIR || '/tmp/inwitclipps';

async function ensureTmpDir() {
  await mkdir(TMP_DIR, { recursive: true });
}

/**
 * Extracts a mono 16kHz WAV audio track from a video file using ffmpeg.
 * @param {string} inputPath - Local path to the video file
 * @param {string} outputPath - Local path for the WAV output
 * @returns {Promise<void>}
 */
function extractAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioChannels(1)
      .audioFrequency(16000)
      .noVideo()
      .format('wav')
      .output(outputPath)
      .on('start', (cmd) => {
        console.log(`[transcription-worker] ffmpeg start: ${cmd}`);
      })
      .on('end', () => {
        console.log(`[transcription-worker] Audio extraction complete: ${outputPath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`[transcription-worker] ffmpeg error: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

// Start the transcription worker
const transcriptionWorker = getWorker('transcription', async (job) => {
  const { jobId } = job.data;
  await ensureTmpDir();
  const tmpVideo = join(TMP_DIR, `${jobId}.mp4`);
  const tmpAudio = join(TMP_DIR, `${jobId}.wav`);

  console.log(`[transcription-worker] Starting job ${jobId}`);

  try {
    // Update status to 'transcribing'
    await db.update(jobs).set({ status: 'transcribing' }).where(eq(jobs.id, jobId));
    console.log(`[transcription-worker] Status → transcribing for job ${jobId}`);

    // Download raw video from Supabase Storage
    console.log(`[transcription-worker] Downloading raw video for job ${jobId}`);
    await downloadFile(process.env.STORAGE_RAW_BUCKET, `${jobId}.mp4`, tmpVideo);
    console.log(`[transcription-worker] Video downloaded to ${tmpVideo}`);

    // Extract mono 16kHz WAV audio
    console.log(`[transcription-worker] Extracting audio for job ${jobId}`);
    await extractAudio(tmpVideo, tmpAudio);

    // Transcribe via OpenAI Whisper with word-level timestamps
    console.log(`[transcription-worker] Sending to Whisper for job ${jobId}`);
    const audioStream = createReadStream(tmpAudio);
    const transcript = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });
    console.log(
      `[transcription-worker] Whisper complete — ${transcript.words?.length ?? 0} words for job ${jobId}`
    );

    // Store transcript JSONB and update status
    await db
      .update(jobs)
      .set({
        transcript: transcript,
        status: 'analyzing',
      })
      .where(eq(jobs.id, jobId));

    // Enqueue AI clip detection
    const aiQueue = getQueue('ai-detection');
    await aiQueue.add('detect', { jobId });
    console.log(`[transcription-worker] Enqueued ai-detection for job ${jobId}`);
  } catch (err) {
    console.error(`[transcription-worker] Error for job ${jobId}:`, err.message);
    await db
      .update(jobs)
      .set({ status: 'failed', error_msg: err.message })
      .where(eq(jobs.id, jobId));
    throw err;
  } finally {
    // Always clean up temp files, even on errors
    await unlink(tmpVideo).catch(() => {});
    await unlink(tmpAudio).catch(() => {});
    console.log(`[transcription-worker] Cleaned up tmp files for job ${jobId}`);
  }
});

transcriptionWorker.on('error', (err) => {
  console.error('[transcription-worker] Worker error:', err.message);
});

console.log('[transcription-worker] Worker started, listening on queue: transcription');
