import type { ParsedLUT } from '../types';

/**
 * Parse a compact binary LUT.
 * Format: [4 bytes uint32 LE grid size] + [size^3 * 3 float32 LE RGB values]
 */
export function parseBinary(buffer: ArrayBuffer): ParsedLUT {
  const view = new DataView(buffer);
  const size = view.getUint32(0, true);
  const expected = size * size * size * 3;
  const data = new Float32Array(buffer, 4, expected);
  return { size, data };
}

export function parseCube(raw: string): ParsedLUT {
  const lines = raw.split(/\r?\n/);
  let size = 0;
  const values: number[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('TITLE') || trimmed.startsWith('DOMAIN_MIN') || trimmed.startsWith('DOMAIN_MAX')) {
      continue;
    }

    if (trimmed.startsWith('LUT_3D_SIZE')) {
      size = parseInt(trimmed.split(/\s+/)[1], 10);
      continue;
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 3) {
      const r = parseFloat(parts[0]);
      const g = parseFloat(parts[1]);
      const b = parseFloat(parts[2]);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        values.push(r, g, b);
      }
    }
  }

  if (size === 0) {
    throw new Error('Invalid .cube file: missing LUT_3D_SIZE');
  }

  const expected = size * size * size * 3;
  if (values.length !== expected) {
    throw new Error(`Invalid .cube file: expected ${expected} values, got ${values.length}`);
  }

  return { size, data: new Float32Array(values) };
}
