/**
 * Upload Film LUT assets to Cloudflare R2 bucket.
 *
 * Only uploads LUTs from the "Film Luts [ALL]" collection:
 *   - .cube files from Film Luts [ALL]/<Brand>/
 *   - .bin files from bin/Film Luts [ALL]/<Brand>/
 *   - thumb-bundle.bin (all LUTs at 8^3 for instant thumbnails)
 *   - manifest.json
 *
 * Run build-lut-binaries.mjs FIRST to generate the binary files.
 *
 * Usage:  node scripts/upload-luts-r2.mjs
 *
 * Requires: wrangler logged in (`npx wrangler login`)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUCKET = 'kaptura';
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const LUTS_DIR = path.join(PUBLIC_DIR, 'luts');
const FILM_DIR = path.join(LUTS_DIR, 'Film Luts [ALL]');
const BIN_FILM_DIR = path.join(LUTS_DIR, 'bin', 'Film Luts [ALL]');

function walk(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const cubeFiles = walk(FILM_DIR).filter((f) => f.endsWith('.cube') && !path.basename(f).startsWith('._'));
const binFiles = walk(BIN_FILM_DIR).filter((f) => f.endsWith('.bin'));
const manifestPath = path.join(LUTS_DIR, 'manifest.json');
const thumbBundlePath = path.join(LUTS_DIR, 'thumb-bundle.bin');

console.log(`  .cube files (Film Luts [ALL]): ${cubeFiles.length}`);
console.log(`  .bin files:                    ${binFiles.length}`);
console.log();

if (binFiles.length === 0) {
  console.log('No .bin files found! Run build-lut-binaries.mjs first.\n');
  console.log('  node scripts/build-lut-binaries.mjs');
  console.log('  node scripts/upload-luts-r2.mjs\n');
  process.exit(1);
}

function getContentType(filePath) {
  if (filePath.endsWith('.json')) return 'application/json';
  if (filePath.endsWith('.bin')) return 'application/octet-stream';
  return 'text/plain';
}

const sharedFiles = [];
if (fs.existsSync(manifestPath)) sharedFiles.push(manifestPath);
if (fs.existsSync(thumbBundlePath)) sharedFiles.push(thumbBundlePath);

const filesToUpload = [
  ...binFiles,
  ...sharedFiles,
  ...cubeFiles,
];

console.log(`  Total to upload: ${filesToUpload.length}\n`);

let uploaded = 0;
let failed = 0;

for (const filePath of filesToUpload) {
  const rel = path.relative(PUBLIC_DIR, filePath).replace(/\\/g, '/');
  const objectKey = rel;
  const ct = getContentType(filePath);

  try {
    execSync(
      `npx wrangler r2 object put "${BUCKET}/${objectKey}" --remote -f "${filePath}" --ct "${ct}"`,
      { stdio: 'pipe' },
    );
    uploaded++;
    process.stdout.write(`\r  Uploaded ${uploaded}/${filesToUpload.length}`);
  } catch (err) {
    failed++;
    console.error(`\n  FAILED: ${objectKey} — ${err.message}`);
  }
}

console.log(`\n\nDone! ${uploaded} uploaded, ${failed} failed.`);
console.log(`New manifest.json + thumb-bundle.bin replace old ones on R2.`);
console.log(`Old LUT packs remain on R2 but are hidden (not in manifest).`);
