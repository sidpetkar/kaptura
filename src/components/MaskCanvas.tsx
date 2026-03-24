import { useRef, useCallback, useImperativeHandle, forwardRef, useEffect, useLayoutEffect, useState } from 'react';

interface Stroke {
  points: Array<{ x: number; y: number }>;
  size: number;
}

interface Props {
  brushSize: number;
  readonly: boolean;
}

export interface MaskCanvasHandle {
  exportMask: (naturalWidth: number, naturalHeight: number) => Promise<Blob>;
  hasStrokes: () => boolean;
  clear: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const STROKE_COLOR = 'rgba(251, 191, 36, 0.55)';
const STROKE_BORDER_COLOR = 'rgba(251, 191, 36, 0.85)';

function buildCircleCursor(size: number): string {
  const r = Math.max(4, size / 2);
  const d = Math.ceil(r * 2 + 4);
  const c = d / 2;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${d}' height='${d}'><circle cx='${c}' cy='${c}' r='${r}' fill='none' stroke='rgba(251,191,36,0.9)' stroke-width='1.5'/><circle cx='${c}' cy='${c}' r='1' fill='rgba(251,191,36,0.9)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${Math.round(c)} ${Math.round(c)}, crosshair`;
}

function drawStrokesOnCtx(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  w: number,
  h: number,
  fillColor: string,
  borderColor?: string,
  scaleSize?: number,
) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;
    const sz = scaleSize ? stroke.size * scaleSize : stroke.size;

    if (borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = sz + 2;
      ctx.beginPath();
      const p0 = stroke.points[0];
      ctx.moveTo(p0.x * w, p0.y * h);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        ctx.lineTo(p.x * w, p.y * h);
      }
      if (stroke.points.length === 1) {
        ctx.lineTo(p0.x * w + 0.1, p0.y * h + 0.1);
      }
      ctx.stroke();
    }

    ctx.strokeStyle = fillColor;
    ctx.lineWidth = sz;
    ctx.beginPath();
    const p0 = stroke.points[0];
    ctx.moveTo(p0.x * w, p0.y * h);
    for (let i = 1; i < stroke.points.length; i++) {
      const p = stroke.points[i];
      ctx.lineTo(p.x * w, p.y * h);
    }
    if (stroke.points.length === 1) {
      ctx.lineTo(p0.x * w + 0.1, p0.y * h + 0.1);
    }
    ctx.stroke();
  }
}

function syncCanvasSize(canvas: HTMLCanvasElement): boolean {
  const rect = canvas.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  if (w === 0 || h === 0) return false;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    return true;
  }
  return false;
}

const MaskCanvas = forwardRef<MaskCanvasHandle, Props>(({ brushSize, readonly }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const redoStackRef = useRef<Stroke[]>([]);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);
  const [, forceUpdate] = useState(0);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStrokesOnCtx(ctx, strokesRef.current, canvas.width, canvas.height, STROKE_COLOR, STROKE_BORDER_COLOR);
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) syncCanvasSize(canvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      if (syncCanvasSize(canvas)) redraw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [redraw]);

  useImperativeHandle(ref, () => ({
    exportMask: (naturalWidth: number, naturalHeight: number): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const offscreen = document.createElement('canvas');
        offscreen.width = naturalWidth;
        offscreen.height = naturalHeight;
        const ctx = offscreen.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context failed')); return; }

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, naturalWidth, naturalHeight);

        const canvas = canvasRef.current;
        const displayW = canvas?.width ?? naturalWidth;
        const sizeScale = naturalWidth / displayW;

        drawStrokesOnCtx(ctx, strokesRef.current, naturalWidth, naturalHeight, '#fff', undefined, sizeScale);

        offscreen.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Mask export failed'));
        }, 'image/png');
      });
    },

    hasStrokes: () => strokesRef.current.length > 0,

    clear: () => {
      strokesRef.current = [];
      redoStackRef.current = [];
      activeStrokeRef.current = null;
      drawingRef.current = false;
      redraw();
      forceUpdate((n) => n + 1);
    },

    undo: () => {
      if (strokesRef.current.length === 0) return;
      const removed = strokesRef.current[strokesRef.current.length - 1];
      strokesRef.current = strokesRef.current.slice(0, -1);
      redoStackRef.current = [...redoStackRef.current, removed];
      redraw();
      forceUpdate((n) => n + 1);
    },

    redo: () => {
      if (redoStackRef.current.length === 0) return;
      const restored = redoStackRef.current[redoStackRef.current.length - 1];
      redoStackRef.current = redoStackRef.current.slice(0, -1);
      strokesRef.current = [...strokesRef.current, restored];
      redraw();
      forceUpdate((n) => n + 1);
    },

    canUndo: () => strokesRef.current.length > 0,
    canRedo: () => redoStackRef.current.length > 0,
  }), [redraw]);

  const ensureSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width === 0 || canvas.height === 0) {
      syncCanvasSize(canvas);
    }
  }, []);

  const getPos = useCallback((e: React.PointerEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  const drawSegment = useCallback((from: { x: number; y: number }, to: { x: number; y: number }, size: number) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = STROKE_BORDER_COLOR;
    ctx.lineWidth = size + 2;
    ctx.beginPath();
    ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
    ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
    ctx.stroke();

    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
    ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
    ctx.stroke();
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (readonly) return;
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    ensureSize();
    const pos = getPos(e);
    if (!pos) return;
    const stroke: Stroke = { points: [pos], size: brushSize };
    activeStrokeRef.current = stroke;
    drawingRef.current = true;
    redoStackRef.current = [];

    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = STROKE_BORDER_COLOR;
    ctx.lineWidth = brushSize + 2;
    ctx.beginPath();
    ctx.moveTo(pos.x * canvas.width, pos.y * canvas.height);
    ctx.lineTo(pos.x * canvas.width + 0.1, pos.y * canvas.height + 0.1);
    ctx.stroke();

    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(pos.x * canvas.width, pos.y * canvas.height);
    ctx.lineTo(pos.x * canvas.width + 0.1, pos.y * canvas.height + 0.1);
    ctx.stroke();
  }, [readonly, brushSize, getPos, ensureSize]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!drawingRef.current || readonly) return;
    e.stopPropagation();
    e.preventDefault();
    const pos = getPos(e);
    if (!pos || !activeStrokeRef.current) return;
    const prev = activeStrokeRef.current.points[activeStrokeRef.current.points.length - 1];
    activeStrokeRef.current.points.push(pos);
    drawSegment(prev, pos, activeStrokeRef.current.size);
  }, [readonly, getPos, drawSegment]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    e.stopPropagation();
    drawingRef.current = false;
    if (activeStrokeRef.current && activeStrokeRef.current.points.length > 0) {
      strokesRef.current = [...strokesRef.current, activeStrokeRef.current];
    }
    activeStrokeRef.current = null;
    forceUpdate((n) => n + 1);
  }, []);

  const cursor = readonly ? 'default' : buildCircleCursor(brushSize);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 w-full h-full"
      style={{ touchAction: 'none', cursor }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
});

MaskCanvas.displayName = 'MaskCanvas';
export default MaskCanvas;
