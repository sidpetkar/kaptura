/**
 * Upload a SINGLE new LUT folder to R2 and refresh shared assets.
 *
 * Uploads:
 *   - .cube files from public/luts/<folder>/
 *   - .bin  files from public/luts/bin/<folder>/  (built by build-lut-binaries.mjs)
 *   - thumb-bundle.bin  (rebuilt by build-lut-binaries.mjs)
 *   - manifest.json     (rebuilt by build-lut-binaries.mjs)
 *
 * IMPORTANT: Run  node scripts/build-lut-binaries.mjs  FIRST!
 *
 * Usage:  node scripts/upload-folder-r2.mjs "folder name"
 * Example: node scripts/upload-folder-r2.mjs "film stocks"
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUCKET = 'kaptura';
const LUTS_DIR = path.resolve(__dirname, '..', 'public', 'luts');
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

const folderName = process.argv[2];
if (!folderName) {
  console.error('Usage: node scripts/upload-folder-r2.mjs "folder name"');
  console.error('Run build-lut-binaries.mjs first!');
  process.exit(1);
}

const cubeDir = path.join(LUTS_DIR, folderName);
const binDir = path.join(LUTS_DIR, 'bin', folderName);

if (!fs.existsSync(cubeDir)) {
  console.error(`Folder not found: ${cubeDir}`);
  process.exit(1);
}

function walk(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else results.push(full);
  }
  return results;
}

// .cube files from the folder
const cubeFiles = walk(cubeDir).filter(
  (f) => f.endsWith('.cube') && !path.basename(f).startsWith('._'),
);

// .bin files from bin/<folder>
const binFiles = walk(binDir).filter((f) => f.endsWith('.bin'));

// Shared assets that need re-uploading
const manifestFile = path.join(LUTS_DIR, 'manifest.json');
const thumbBundle = path.join(LUTS_DIR, 'thumb-bundle.bin');

const sharedFiles = [];
if (fs.existsSync(manifestFile)) sharedFiles.push(manifestFile);
if (fs.existsSync(thumbBundle)) sharedFiles.push(thumbBundle);

console.log(`  .cube files:    ${cubeFiles.length}`);
console.log(`  .bin files:     ${binFiles.length}`);
console.log(`  shared assets:  ${sharedFiles.length} (manifest + thumb-bundle)`);

const filesToUpload = [...cubeFiles, ...binFiles, ...sharedFiles];
console.log(`\n  Total to upload: ${filesToUpload.length}\n`);

if (binFiles.length === 0) {
  console.warn('  WARNING: No .bin files found! Run build-lut-binaries.mjs first.\n');
}

let uploaded = 0;
let failed = 0;

for (const filePath of filesToUpload) {
  const rel = path.relative(PUBLIC_DIR, filePath).replace(/\\/g, '/');
  const ct = filePath.endsWith('.json')
    ? 'application/json'
    : filePath.endsWith('.bin')
      ? 'application/octet-stream'
      : 'text/plain';

  try {
    execSync(
      `npx wrangler r2 object put "${BUCKET}/${rel}" --remote -f "${filePath}" --ct "${ct}"`,
      { stdio: 'pipe' },
    );
    uploaded++;
    process.stdout.write(`\r  Uploaded ${uploaded}/${filesToUpload.length}`);
  } catch (err) {
    failed++;
    console.error(`\n  FAILED: ${rel} — ${err.message}`);
  }
}

console.log(`\n\nDone! ${uploaded} uploaded, ${failed} failed.`);
