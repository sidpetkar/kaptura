import { useState, useRef, useCallback, useEffect } from 'react';
import { Check, X } from '@phosphor-icons/react';

interface Props {
  sourceImage: HTMLImageElement;
  onConfirm: (croppedImage: HTMLImageElement) => void;
  onCancel: () => void;
}

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ASPECT_RATIOS: { label: string; ratio: number | null }[] = [
  { label: 'Free', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '2:3', ratio: 2 / 3 },
  { label: '3:2', ratio: 3 / 2 },
  { label: '3:4', ratio: 3 / 4 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '4:5', ratio: 4 / 5 },
  { label: '5:4', ratio: 5 / 4 },
];

const MIN_CROP = 0.02;

export default function CropTool({ sourceImage, onConfirm, onCancel }: Props) {
  const [tab, setTab] = useState<'crop' | 'skew'>('crop');
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 1, h: 1 });
  const [aspect, setAspect] = useState<number | null>(null);
  const [straighten, setStraighten] = useState(0);
  const [skewX, setSkewX] = useState(0);
  const [skewY, setSkewY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    type: 'move' | 'tl' | 'tr' | 'bl' | 'br';
    startX: number;
    startY: number;
    startCrop: CropRect;
  } | null>(null);

  const imgW = sourceImage.naturalWidth;
  const imgH = sourceImage.naturalHeight;

  const [displaySize, setDisplaySize] = useState({ w: 300, h: 300, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const maxW = el.clientWidth - 32;
    const maxH = el.clientHeight - 32;
    const scale = Math.min(1, maxW / imgW, maxH / imgH);
    const w = Math.round(imgW * scale);
    const h = Math.round(imgH * scale);
    setDisplaySize({
      w,
      h,
      offsetX: (el.clientWidth - w) / 2,
      offsetY: (el.clientHeight - h) / 2,
    });
  }, [imgW, imgH]);

  const applyAspect = useCallback((ratio: number | null) => {
    setAspect(ratio);
    if (!ratio) return;

    const imgRatio = imgW / imgH;
    let w: number, h: number;
    if (ratio > imgRatio) {
      w = 1;
      h = (imgW / ratio) / imgH;
    } else {
      h = 1;
      w = (imgH * ratio) / imgW;
    }
    const x = (1 - w) / 2;
    const y = (1 - h) / 2;
    setCrop({ x, y, w, h });
  }, [imgW, imgH]);

  const handlePointerDown = useCallback((e: React.PointerEvent, type: 'move' | 'tl' | 'tr' | 'bl' | 'br') => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
    };
  }, [crop]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;

    const dx = (e.clientX - d.startX) / displaySize.w;
    const dy = (e.clientY - d.startY) / displaySize.h;
    const sc = d.startCrop;

    if (d.type === 'move') {
      const nx = Math.max(0, Math.min(1 - sc.w, sc.x + dx));
      const ny = Math.max(0, Math.min(1 - sc.h, sc.y + dy));
      setCrop({ ...sc, x: nx, y: ny });
    } else {
      let nx = sc.x, ny = sc.y, nw = sc.w, nh = sc.h;

      if (d.type === 'tl' || d.type === 'bl') {
        nw = Math.max(MIN_CROP, sc.w - dx);
        nx = sc.x + sc.w - nw;
      }
      if (d.type === 'tr' || d.type === 'br') {
        nw = Math.max(MIN_CROP, sc.w + dx);
      }
      if (d.type === 'tl' || d.type === 'tr') {
        nh = Math.max(MIN_CROP, sc.h - dy);
        ny = sc.y + sc.h - nh;
      }
      if (d.type === 'bl' || d.type === 'br') {
        nh = Math.max(MIN_CROP, sc.h + dy);
      }

      if (aspect) {
        const targetRatio = aspect * (imgH / imgW);
        nh = nw / targetRatio;
      }

      nx = Math.max(0, nx);
      ny = Math.max(0, ny);
      nw = Math.min(nw, 1 - nx);
      nh = Math.min(nh, 1 - ny);

      setCrop({ x: nx, y: ny, w: nw, h: nh });
    }
  }, [displaySize, aspect, imgW, imgH]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleConfirm = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const sx = Math.round(crop.x * imgW);
    const sy = Math.round(crop.y * imgH);
    const sw = Math.max(1, Math.round(crop.w * imgW));
    const sh = Math.max(1, Math.round(crop.h * imgH));

    if (straighten !== 0 || skewX !== 0 || skewY !== 0) {
      canvas.width = sw;
      canvas.height = sh;
      ctx.save();
      ctx.translate(sw / 2, sh / 2);
      ctx.rotate((straighten * Math.PI) / 180);

      if (skewX !== 0 || skewY !== 0) {
        ctx.transform(
          1,
          Math.tan((skewY * Math.PI) / 180),
          Math.tan((skewX * Math.PI) / 180),
          1,
          0,
          0,
        );
      }

      const scale = 1 / Math.cos((straighten * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.drawImage(sourceImage, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
      ctx.restore();
    } else {
      canvas.width = sw;
      canvas.height = sh;
      ctx.drawImage(sourceImage, sx, sy, sw, sh, 0, 0, sw, sh);
    }

    const newImg = new Image();
    newImg.onload = () => onConfirm(newImg);
    newImg.src = canvas.toDataURL('image/jpeg', 0.95);
  }, [crop, straighten, skewX, skewY, sourceImage, imgW, imgH, onConfirm]);

  const imageTransform = tab === 'skew'
    ? `skewX(${skewX}deg) skewY(${skewY}deg)`
    : `rotate(${straighten}deg)`;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Centered tab pills */}
      <div className="flex items-center justify-center gap-4 px-4 pt-3 pb-2">
        <button
          onClick={() => setTab('crop')}
          className={`text-[11px] tracking-wider px-3 py-1 rounded-full transition-colors ${
            tab === 'crop' ? 'bg-amber-400/20 text-amber-400' : 'text-muted/60'
          }`}
        >
          Crop + Straighten
        </button>
        <button
          onClick={() => setTab('skew')}
          className={`text-[11px] tracking-wider px-3 py-1 rounded-full transition-colors ${
            tab === 'skew' ? 'bg-amber-400/20 text-amber-400' : 'text-muted/60'
          }`}
        >
          Skew
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="absolute"
          style={{
            left: displaySize.offsetX,
            top: displaySize.offsetY,
            width: displaySize.w,
            height: displaySize.h,
            transform: imageTransform,
            transformOrigin: 'center center',
          }}
        >
          <img
            src={sourceImage.src}
            alt=""
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />

          {/* Darkened overlay outside crop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to right,
                rgba(0,0,0,0.6) ${crop.x * 100}%,
                transparent ${crop.x * 100}%,
                transparent ${(crop.x + crop.w) * 100}%,
                rgba(0,0,0,0.6) ${(crop.x + crop.w) * 100}%)`,
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              left: 0,
              right: 0,
              top: 0,
              height: `${crop.y * 100}%`,
              backgroundColor: 'rgba(0,0,0,0.6)',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              left: 0,
              right: 0,
              bottom: 0,
              height: `${(1 - crop.y - crop.h) * 100}%`,
              backgroundColor: 'rgba(0,0,0,0.6)',
            }}
          />

          {/* Crop region border + grid */}
          <div
            className="absolute border border-white/40"
            style={{
              left: `${crop.x * 100}%`,
              top: `${crop.y * 100}%`,
              width: `${crop.w * 100}%`,
              height: `${crop.h * 100}%`,
            }}
            onPointerDown={(e) => handlePointerDown(e, 'move')}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
            </div>
          </div>

          {/* Corner handles -- larger touch targets */}
          {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => {
            const isLeft = corner[1] === 'l';
            const isTop = corner[0] === 't';
            const cx = isLeft ? crop.x : crop.x + crop.w;
            const cy = isTop ? crop.y : crop.y + crop.h;
            const borderSides = [
              isTop ? 'border-t-2' : 'border-b-2',
              isLeft ? 'border-l-2' : 'border-r-2',
            ].join(' ');
            const noBorders = [
              isTop ? 'border-b-0' : 'border-t-0',
              isLeft ? 'border-r-0' : 'border-l-0',
            ].join(' ');
            return (
              <div
                key={corner}
                className={`absolute w-8 h-8 touch-none ${borderSides} ${noBorders} border-2 border-amber-400`}
                style={{
                  left: `calc(${cx * 100}% - 16px)`,
                  top: `calc(${cy * 100}% - 16px)`,
                }}
                onPointerDown={(e) => handlePointerDown(e, corner)}
              />
            );
          })}
        </div>
      </div>

      <div className="shrink-0 bg-surface border-t border-white/5 px-4 pb-safe">
        {tab === 'crop' ? (
          <div className="space-y-3 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none justify-center">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.label}
                  onClick={() => applyAspect(ar.ratio)}
                  className={`text-[10px] tracking-wider shrink-0 px-2.5 py-1 rounded-full transition-colors ${
                    aspect === ar.ratio
                      ? 'bg-amber-400/20 text-amber-400'
                      : 'text-muted/50 bg-white/5'
                  }`}
                >
                  {ar.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted tracking-wider w-16 shrink-0 text-right">
                Straighten
              </span>
              <input
                type="range"
                min={-45}
                max={45}
                step={0.5}
                value={straighten}
                onChange={(e) => setStraighten(Number(e.target.value))}
                className="flex-1 accent-amber-400 h-1"
              />
              <span className="text-[10px] text-muted tracking-wider w-8 shrink-0">
                {straighten.toFixed(1)}°
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted tracking-wider w-12 shrink-0 text-right">
                Skew X
              </span>
              <input
                type="range"
                min={-30}
                max={30}
                step={0.5}
                value={skewX}
                onChange={(e) => setSkewX(Number(e.target.value))}
                className="flex-1 accent-amber-400 h-1"
              />
              <span className="text-[10px] text-muted tracking-wider w-8 shrink-0">
                {skewX.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted tracking-wider w-12 shrink-0 text-right">
                Skew Y
              </span>
              <input
                type="range"
                min={-30}
                max={30}
                step={0.5}
                value={skewY}
                onChange={(e) => setSkewY(Number(e.target.value))}
                className="flex-1 accent-amber-400 h-1"
              />
              <span className="text-[10px] text-muted tracking-wider w-8 shrink-0">
                {skewY.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-1 py-3 border-t border-white/5">
          <button onClick={onCancel} className="text-accent/80 p-1">
            <X size={22} weight="bold" />
          </button>
          <span className="text-[12px] tracking-widest text-amber-400 font-medium uppercase">
            Adjust
          </span>
          <button onClick={handleConfirm} className="text-accent p-1">
            <Check size={22} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
