/**
 * workers/render.worker.js
 * BullMQ worker for the 'render' queue.
 * Downloads raw video from Supabase Storage, cuts the clip segment with ffmpeg,
 * generates a thumbnail at the midpoint, uploads both to storage,
 * and updates the clip record. When ALL clips for a job are done, marks job completed.
 * Key dependencies: bullmq, fluent-ffmpeg, drizzle-orm, storage service
 */

import 'dotenv/config';
import { existsSync } from 'fs';
import { unlink, mkdir } from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { jobs, clips } from '../db/schema.js';
import { downloadFile, uploadFile } from '../services/storage.js';
import { getWorker } from '../services/queue.js';

const TMP_DIR = process.env.TMP_DIR || '/tmp/inwitclipps';

/**
 * Ensures the temp directory exists.
 */
async function ensureTmpDir() {
  await mkdir(TMP_DIR, { recursive: true });
}

/**
 * Converts seconds to HH:MM:SS.mmm format for ffmpeg.
 */
function toTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    s.toFixed(3).padStart(6, '0'),
  ].join(':');
}

/**
 * Cuts a clip from the source video between start and end times.
 * Re-encodes to ensure clean cuts and adds caption-style overlay.
 */
function cutClip(inputPath, outputPath, startTime, endTime, captionStyle) {
  return new Promise((resolve, reject) => {
    const duration = endTime - startTime;

    let command = ffmpeg(inputPath)
      .setStartTime(toTimestamp(startTime))
      .duration(duration)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset', 'fast',
        '-crf', '23',
        '-movflags', '+faststart',
        '-pix_fmt', 'yuv420p',
      ]);

    // Apply caption style as video filter
    const styleFilters = {
      bold: "drawtext=text='InwitClipps':fontsize=24:fontcolor=white:borderw=3:bordercolor=black:x=(w-tw)/2:y=h-60",
      minimal: "drawtext=text='InwitClipps':fontsize=18:fontcolor=white@0.7:x=(w-tw)/2:y=h-40",
      glowing: "drawtext=text='InwitClipps':fontsize=24:fontcolor=white:shadowcolor=cyan:shadowx=2:shadowy=2:x=(w-tw)/2:y=h-60",
      'word-by-word': "drawtext=text='InwitClipps':fontsize=28:fontcolor=yellow:borderw=2:bordercolor=black:x=(w-tw)/2:y=h-80",
    };

    const filter = styleFilters[captionStyle] || styleFilters.bold;
    command = command.videoFilters(filter);

    command
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[render-worker] ffmpeg start: ' + cmd);
      })
      .on('end', () => {
        console.log('[render-worker] Clip rendered: ' + outputPath);
        resolve();
      })
      .on('error', (err) => {
        console.error('[render-worker] ffmpeg error: ' + err.message);
        reject(err);
      })
      .run();
  });
}

/**
 * Generates a thumbnail image at the midpoint of the clip.
 */
function generateThumbnail(inputPath, outputPath, startTime, endTime) {
  return new Promise((resolve, reject) => {
    const midpoint = startTime + (endTime - startTime) / 2;

    ffmpeg(inputPath)
      .seekInput(midpoint)
      .frames(1)
      .outputOptions(['-vf', 'scale=480:-1'])
      .output(outputPath)
      .on('end', () => {
        console.log('[render-worker] Thumbnail generated: ' + outputPath);
        resolve();
      })
      .on('error', (err) => {
        console.error('[render-worker] Thumbnail error: ' + err.message);
        reject(err);
      })
      .run();
  });
}

// Start the render worker
const renderWorker = getWorker('render', async (job) => {
  const { jobId, clipId } = job.data;

  console.log('[render-worker] Starting render for job ' + jobId + ' clip ' + clipId);

  await ensureTmpDir();

  const tmpVideo = TMP_DIR + '/' + jobId + '.mp4';
  const tmpClip = TMP_DIR + '/' + clipId + '_clip.mp4';
  const tmpThumb = TMP_DIR + '/' + clipId + '_thumb.jpg';

  try {
    // Fetch clip record
    const [clipRecord] = await db
      .select()
      .from(clips)
      .where(eq(clips.id, clipId));

    if (!clipRecord) throw new Error('Clip ' + clipId + ' not found');

    // Download raw video from Supabase Storage (if not already cached)
    if (!existsSync(tmpVideo)) {
      console.log('[render-worker] Downloading raw video for job ' + jobId);
      await downloadFile(process.env.STORAGE_RAW_BUCKET, jobId + '.mp4', tmpVideo);
    }

    // Cut the clip
    console.log('[render-worker] Cutting clip ' + clipId + ' (' + clipRecord.start_time + 's - ' + clipRecord.end_time + 's)');
    await cutClip(
      tmpVideo,
      tmpClip,
      clipRecord.start_time,
      clipRecord.end_time,
      clipRecord.caption_style || 'bold'
    );

    // Generate thumbnail
    console.log('[render-worker] Generating thumbnail for clip ' + clipId);
    await generateThumbnail(tmpVideo, tmpThumb, clipRecord.start_time, clipRecord.end_time);

    // Upload clip to Supabase Storage
    const clipStorageKey = jobId + '/clips/' + clipId + '.mp4';
    const thumbStorageKey = jobId + '/thumbs/' + clipId + '.jpg';

    console.log('[render-worker] Uploading clip ' + clipId);
    await uploadFile(
      process.env.STORAGE_CLIPS_BUCKET,
      clipStorageKey,
      tmpClip,
      'video/mp4'
    );

    console.log('[render-worker] Uploading thumbnail ' + clipId);
    await uploadFile(
      process.env.STORAGE_CLIPS_BUCKET,
      thumbStorageKey,
      tmpThumb,
      'image/jpeg'
    );

    // Update clip record with paths
    await db
      .update(clips)
      .set({
        output_path: clipStorageKey,
        thumbnail_path: thumbStorageKey,
      })
      .where(eq(clips.id, clipId));

    console.log('[render-worker] Clip ' + clipId + ' complete');

    // Check if ALL clips for this job are now rendered.
    // Fetch all clips and verify every one has an output_path.
    // Note: multiple render workers may reach this point concurrently;
    // the UPDATE to 'completed' is idempotent so the race is harmless.
    const allJobClips = await db
      .select({ output_path: clips.output_path })
      .from(clips)
      .where(eq(clips.job_id, jobId));

    const allRendered = allJobClips.every((c) => c.output_path !== null);

    if (allRendered) {
      await db.update(jobs).set({ status: 'completed' }).where(eq(jobs.id, jobId));
      console.log('[render-worker] All clips rendered — job ' + jobId + ' marked completed');

      // Clean up the cached raw video
      await unlink(tmpVideo).catch(() => {});
    }
  } catch (err) {
    console.error('[render-worker] Error for clip ' + clipId + ':', err.message);
    await db
      .update(jobs)
      .set({ status: 'failed', error_msg: 'Render failed: ' + err.message })
      .where(eq(jobs.id, jobId));
    throw err;
  } finally {
    // Always clean up clip temp files, even on errors
    await unlink(tmpClip).catch(() => {});
    await unlink(tmpThumb).catch(() => {});
  }
});

renderWorker.on('error', (err) => {
  console.error('[render-worker] Worker error:', err.message);
});

console.log('[render-worker] Worker started, listening on queue: render');
