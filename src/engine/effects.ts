import {
  GRAIN_FRAGMENT,
  LENS_DISTORTION_FRAGMENT,
  CHROMATIC_ABERRATION_FRAGMENT,
} from './shaders';

export interface EffectParam {
  key: string;
  label: string;
  min: number;
  max: number;
  default: number;
  step: number;
}

export interface EffectDef {
  id: string;
  label: string;
  icon: string;
  params: EffectParam[];
  fragmentSource: string;
  setUniforms: (
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    values: Record<string, number>,
  ) => void;
}

export type EffectValues = Record<string, number>;
export type EffectParams = Record<string, EffectValues>;

export const EFFECTS: EffectDef[] = [
  {
    id: 'grain',
    label: 'Film Grain',
    icon: 'GrainSlash',
    params: [
      { key: 'intensity', label: 'Intensity', min: 0, max: 100, default: 40, step: 1 },
      { key: 'scale', label: 'Size', min: 50, max: 800, default: 300, step: 10 },
    ],
    fragmentSource: GRAIN_FRAGMENT,
    setUniforms(gl, program, values) {
      gl.uniform1f(gl.getUniformLocation(program, 'u_grain_intensity'), (values.intensity ?? 40) / 100);
      gl.uniform1f(gl.getUniformLocation(program, 'u_grain_scale'), values.scale ?? 300);
      gl.uniform1f(gl.getUniformLocation(program, 'u_seed'), Math.random() * 1000);
    },
  },
  {
    id: 'lens-distortion',
    label: 'Lens Distort',
    icon: 'CircleHalf',
    params: [
      { key: 'distortion', label: 'Distortion', min: -100, max: 100, default: -30, step: 1 },
      { key: 'cubic', label: 'Cubic', min: 0, max: 100, default: 50, step: 1 },
    ],
    fragmentSource: LENS_DISTORTION_FRAGMENT,
    setUniforms(gl, program, values) {
      gl.uniform1f(gl.getUniformLocation(program, 'u_distortion'), (values.distortion ?? -30) / 100);
      gl.uniform1f(gl.getUniformLocation(program, 'u_cubic_distortion'), (values.cubic ?? 50) / 100);
    },
  },
  {
    id: 'chromatic-aberration',
    label: 'Chromatic',
    icon: 'Rainbow',
    params: [
      { key: 'amount', label: 'Amount', min: 0, max: 100, default: 30, step: 1 },
    ],
    fragmentSource: CHROMATIC_ABERRATION_FRAGMENT,
    setUniforms(gl, program, values) {
      gl.uniform1f(gl.getUniformLocation(program, 'u_aberration_amount'), (values.amount ?? 30) / 200);
    },
  },
];

export const EFFECT_MAP = new Map(EFFECTS.map((e) => [e.id, e]));

export function getDefaultValues(effectId: string): EffectValues {
  const def = EFFECT_MAP.get(effectId);
  if (!def) return {};
  const vals: EffectValues = {};
  for (const p of def.params) {
    vals[p.key] = p.default;
  }
  return vals;
}
