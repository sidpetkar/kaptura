import { parseCube } from './cubeParser';
import { WebGLRenderer } from './webgl';
import { getDisabledCategories } from '../hooks/useCategoryPrefs';
import type { ParsedLUT, LUTMeta } from '../types';

const LUT_BASE = import.meta.env.VITE_LUT_BASE_URL || '';

const LUT_REGISTRY: LUTMeta[] = [];
const parsedCache = new Map<string, ParsedLUT>();
const categoryIndex = new Map<string, LUTMeta[]>();

let initialized = false;
let initPromise: Promise<void> | null = null;

const SKIP_FOLDERS = new Set([
  'cube', 'cubes', 'lut', 'luts', '3dl', 'files', 'rec709', 'rec.709',
]);

let thumbRenderer: WebGLRenderer | null = null;
let thumbCanvas: HTMLCanvasElement | null = null;

export function getAllLUTs(): LUTMeta[] {
  const disabled = getDisabledCategories();
  if (disabled.size === 0) return LUT_REGISTRY;
  return LUT_REGISTRY.filter((m) => !disabled.has(m.category));
}

export function getLUTsByCategory(category: string): LUTMeta[] {
  if (category === 'all') return getAllLUTs();
  const disabled = getDisabledCategories();
  if (disabled.has(category)) return [];
  return categoryIndex.get(category) ?? [];
}

export function getCategories(): string[] {
  const disabled = getDisabledCategories();
  const enabled = Array.from(categoryIndex.keys())
    .filter((c) => !disabled.has(c))
    .sort();
  return ['all', ...enabled];
}

export function getAllCategoryNames(): string[] {
  return Array.from(categoryIndex.keys()).sort();
}

export function getCategoryLutCount(category: string): number {
  return (categoryIndex.get(category) ?? []).length;
}

export async function loadLUT(meta: LUTMeta): Promise<ParsedLUT> {
  const cached = parsedCache.get(meta.id);
  if (cached) return cached;

  const url = LUT_BASE ? `${LUT_BASE}${meta.path}` : meta.path;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load LUT: ${url}`);
  const text = await response.text();
  const parsed = parseCube(text);
  parsedCache.set(meta.id, parsed);
  return parsed;
}

export function initLUTs(): Promise<void> {
  if (initialized) return Promise.resolve();
  if (initPromise) return initPromise;
  initPromise = doInit();
  return initPromise;
}

async function doInit() {
  try {
    const manifestUrl = LUT_BASE ? `${LUT_BASE}/luts/manifest.json` : '/luts/manifest.json';
    const resp = await fetch(manifestUrl);
    if (!resp.ok) { initialized = true; return; }
    const paths: string[] = await resp.json();

    const seenIds = new Set<string>();

    for (const encodedPath of paths) {
      const decodedPath = decodeURIComponent(encodedPath);
      const segments = decodedPath.replace(/^\/luts\//, '').split('/');
      const filename = segments.pop()!.replace('.cube', '');
      const folders = segments.filter((s) => !SKIP_FOLDERS.has(s.toLowerCase()));

      let id = filename.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (seenIds.has(id)) {
        const folderSlug = folders.map(f => f.toLowerCase().replace(/[^a-z0-9]/g, '_')).join('_');
        id = `${folderSlug}_${id}`;
      }
      let suffix = 2;
      const baseId = id;
      while (seenIds.has(id)) {
        id = `${baseId}_${suffix++}`;
      }
      seenIds.add(id);

      const name = filename;
      const category = extractCategory(folders);
      const meta: LUTMeta = { id, name, shortCode: '', category, path: encodedPath };

      LUT_REGISTRY.push(meta);

      let bucket = categoryIndex.get(category);
      if (!bucket) {
        bucket = [];
        categoryIndex.set(category, bucket);
      }
      bucket.push(meta);
    }

    assignShortCodes();
  } catch {
    // manifest not found
  }
  initialized = true;
}

function buildCategoryCodes(): Map<string, string> {
  const categories = Array.from(categoryIndex.keys());
  const codeMap = new Map<string, string>();
  const usedCodes = new Set<string>();

  for (const cat of categories) {
    const words = cat.split(/[\s\-]+/).filter(Boolean);
    let code: string;

    if (words.length >= 2) {
      code = words.map((w) => w[0]).join('').toUpperCase().slice(0, 3);
    } else {
      code = cat.slice(0, 2).toUpperCase();
    }

    if (usedCodes.has(code)) {
      code = cat.replace(/[\s\-]+/g, '').slice(0, 3).toUpperCase();
    }
    let attempt = 3;
    while (usedCodes.has(code) && attempt < cat.length) {
      attempt++;
      code = cat.replace(/[\s\-]+/g, '').slice(0, attempt).toUpperCase();
    }

    usedCodes.add(code);
    codeMap.set(cat, code);
  }
  return codeMap;
}

function assignShortCodes() {
  const catCodes = buildCategoryCodes();
  const usedShortCodes = new Set<string>();

  for (const meta of LUT_REGISTRY) {
    const prefix = catCodes.get(meta.category) ?? 'XX';
    const numMatch = meta.name.match(/(\d+)\s*$/);

    let code: string;
    if (numMatch) {
      code = `${prefix}${numMatch[1]}`;
    } else {
      const cleaned = meta.name.replace(/[^a-zA-Z0-9]/g, '');
      code = `${prefix}-${cleaned.slice(0, 3).toUpperCase()}`;
    }

    if (usedShortCodes.has(code)) {
      let suffix = 'a';
      while (usedShortCodes.has(`${code}${suffix}`)) {
        suffix = String.fromCharCode(suffix.charCodeAt(0) + 1);
      }
      code = `${code}${suffix}`;
    }

    usedShortCodes.add(code);
    meta.shortCode = code;
  }
}

function extractCategory(folders: string[]): string {
  if (folders.length === 0) return 'uncategorized';

  const meaningful = folders.find((f) => {
    const fl = f.toLowerCase();
    return !fl.includes('collection') && !fl.includes('pack') && !SKIP_FOLDERS.has(fl);
  });

  const raw = meaningful ?? folders[folders.length - 1];
  return raw
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase() || 'uncategorized';
}

function getThumbRenderer(): WebGLRenderer | null {
  if (thumbRenderer) return thumbRenderer;
  try {
    thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 76;
    thumbCanvas.height = 76;
    thumbRenderer = new WebGLRenderer(thumbCanvas);
    return thumbRenderer;
  } catch {
    return null;
  }
}

function centerCrop(
  source: HTMLImageElement | HTMLCanvasElement,
  size: number,
): HTMLCanvasElement {
  const sw = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const sh = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  const side = Math.min(sw, sh);
  const sx = (sw - side) / 2;
  const sy = (sh - side) / 2;

  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(source, sx, sy, side, side, 0, 0, size, size);
  return c;
}

export async function generateThumbnail(
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  lut: ParsedLUT,
  size = 76,
): Promise<string> {
  const cropped = centerCrop(sourceImage, size);

  const renderer = getThumbRenderer();
  if (!renderer || !thumbCanvas) {
    return cropped.toDataURL('image/jpeg', 0.6);
  }

  if (thumbCanvas.width !== size || thumbCanvas.height !== size) {
    thumbCanvas.width = size;
    thumbCanvas.height = size;
  }

  renderer.uploadImage(cropped);
  renderer.uploadLUT(lut);
  renderer.render();
  return thumbCanvas.toDataURL('image/jpeg', 0.6);
}
