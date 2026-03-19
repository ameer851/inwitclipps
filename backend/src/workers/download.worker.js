/**
 * workers/download.worker.js
 * BullMQ worker for the 'download' queue.
 * Downloads video via yt-dlp, gets duration via ffprobe, uploads to Supabase Storage,
 * then enqueues the job onto the 'transcription' queue.
 * Key dependencies: bullmq, yt-dlp (system binary), fluent-ffmpeg, drizzle-orm, storage service
 */

import 'dotenv/config';
import { spawn } from 'child_process';
import { unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { jobs } from '../db/schema.js';
import { uploadFile } from '../services/storage.js';
import { getWorker, getQueue } from '../services/queue.js';

const TMP_DIR = process.env.TMP_DIR || '/tmp/inwitclipps';

/** Ensure temp directory exists on first use. */
async function ensureTmpDir() {
  await mkdir(TMP_DIR, { recursive: true });
}

/**
 * Runs yt-dlp to download a video to /tmp/{jobId}.mp4
 * @param {string} jobId
 * @param {string} sourceUrl
 * @returns {Promise<void>}
 */
function downloadVideo(jobId, sourceUrl) {
  return new Promise((resolve, reject) => {
    const outputPath = join(TMP_DIR, `${jobId}.mp4`);
    const args = [
      '-f', 'bestvideo[ext=mp4]+bestaudio/best[ext=m4a]/best',
      '--merge-output-format', 'mp4',
      '-o', outputPath,
      sourceUrl,
    ];

    console.log(`[download-worker] Spawning yt-dlp for job ${jobId}`);
    const proc = spawn('yt-dlp', args);
    let stderrOutput = '';

    proc.stdout.on('data', (data) => {
      console.log(`[yt-dlp] ${data.toString().trim()}`);
    });

    proc.stderr.on('data', (data) => {
      const line = data.toString().trim();
      stderrOutput += line + '\n';
      console.error(`[yt-dlp] ${line}`);
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderrOutput}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Uses ffprobe to get the duration of a video file in seconds.
 * @param {string} filePath
 * @returns {Promise<number>}
 */
function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const duration = Math.round(metadata.format.duration || 0);
      resolve(duration);
    });
  });
}

// Start the download worker
const downloadWorker = getWorker('download', async (job) => {
  const { jobId, sourceUrl } = job.data;
  await ensureTmpDir();
  const tmpPath = join(TMP_DIR, `${jobId}.mp4`);

  console.log(`[download-worker] Starting job ${jobId}`);

  try {
    // Update job status to 'downloading'
    await db.update(jobs).set({ status: 'downloading' }).where(eq(jobs.id, jobId));
    console.log(`[download-worker] Status → downloading for job ${jobId}`);

    // Download the video via yt-dlp
    await downloadVideo(jobId, sourceUrl);
    console.log(`[download-worker] yt-dlp download complete for job ${jobId}`);

    // Get video duration via ffprobe
    const durationSecs = await getVideoDuration(tmpPath);
    console.log(`[download-worker] Duration: ${durationSecs}s for job ${jobId}`);

    // Upload to Supabase Storage
    console.log(`[download-worker] Uploading to Supabase Storage for job ${jobId}`);
    await uploadFile(
      process.env.STORAGE_RAW_BUCKET,
      `${jobId}.mp4`,
      tmpPath,
      'video/mp4'
    );
    console.log(`[download-worker] Upload complete for job ${jobId}`);

    // Update job record with raw path, duration, and next status
    await db
      .update(jobs)
      .set({
        raw_path: `${jobId}.mp4`,
        duration_secs: durationSecs,
        status: 'transcribing',
      })
      .where(eq(jobs.id, jobId));

    // Enqueue transcription
    const transcriptionQueue = getQueue('transcription');
    await transcriptionQueue.add('transcribe', { jobId });
    console.log(`[download-worker] Enqueued transcription for job ${jobId}`);
  } catch (err) {
    console.error(`[download-worker] Error for job ${jobId}:`, err.message);
    await db
      .update(jobs)
      .set({ status: 'failed', error_msg: err.message })
      .where(eq(jobs.id, jobId));
    throw err;
  } finally {
    // Always clean up temp file, even on errors
    await unlink(tmpPath).catch(() => {});
    console.log(`[download-worker] Cleaned up ${tmpPath}`);
  }
});

downloadWorker.on('error', (err) => {
  console.error('[download-worker] Worker error:', err.message);
});

console.log('[download-worker] Worker started, listening on queue: download');
