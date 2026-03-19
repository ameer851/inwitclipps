/**
 * services/storage.js
 * Supabase Storage helpers for server-side file operations.
 * Uses service role key — never expose this to the frontend.
 * Key dependencies: @supabase/supabase-js, fs/promises, dotenv
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile } from 'fs/promises';

// Service role client — required for server-side uploads bypassing RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Uploads a local file to a Supabase Storage bucket.
 * @param {string} bucket - Bucket name (e.g. 'raw-videos')
 * @param {string} key - Storage path/key (e.g. 'abc123.mp4')
 * @param {string} filePath - Local file path to read
 * @param {string} contentType - MIME type (e.g. 'video/mp4')
 * @returns {Promise<string>} The storage path of the uploaded file
 */
export async function uploadFile(bucket, key, filePath, contentType) {
  const buffer = await readFile(filePath);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(key, buffer, { contentType, upsert: true });

  if (error) {
    throw new Error(`[storage] Upload failed: ${error.message}`);
  }

  return data.path;
}

/**
 * Downloads a file from Supabase Storage to a local destination path.
 * @param {string} bucket - Bucket name
 * @param {string} key - Storage path/key
 * @param {string} destPath - Local file path to write to
 * @returns {Promise<void>}
 */
export async function downloadFile(bucket, key, destPath) {
  const { data, error } = await supabase.storage.from(bucket).download(key);

  if (error) {
    throw new Error(`[storage] Download failed: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  await writeFile(destPath, Buffer.from(arrayBuffer));
}

/**
 * Generates a signed URL for temporary access to a private file.
 * @param {string} bucket - Bucket name
 * @param {string} key - Storage path/key
 * @param {number} expiresIn - Expiry in seconds (default 3600)
 * @returns {Promise<string>} Signed URL string
 */
export async function getSignedUrl(bucket, key, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(key, expiresIn);

  if (error) {
    throw new Error(`[storage] Signed URL failed: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Deletes a file from Supabase Storage.
 * @param {string} bucket - Bucket name
 * @param {string} key - Storage path/key
 * @returns {Promise<void>}
 */
export async function deleteFile(bucket, key) {
  const { error } = await supabase.storage.from(bucket).remove([key]);

  if (error) {
    throw new Error(`[storage] Delete failed: ${error.message}`);
  }
}
