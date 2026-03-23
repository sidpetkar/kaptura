import { ASPECT_RATIOS, type AspectRatio } from '../types';

interface Props {
  active: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
}

export default function AspectRatioSelector({ active, onChange }: Props) {
  return (
    <div className="flex items-center justify-center gap-2 py-2 overflow-x-auto" style={{ touchAction: 'pan-x' }}>
      {ASPECT_RATIOS.map(({ label }) => (
        <button
          key={label}
          onClick={() => onChange(label)}
          className={`flex items-center gap-1 px-2 py-1 text-[10px] tracking-wider rounded-sm transition-colors ${
            active === label
              ? 'bg-accent/15 text-accent border border-accent/30'
              : 'text-muted'
          }`}
        >
          <RatioIcon ratio={label} active={active === label} />
          {label}
        </button>
      ))}
    </div>
  );
}

function RatioIcon({ ratio, active }: { ratio: string; active: boolean }) {
  const color = active ? '#e5e5e5' : '#8a8a8a';
  const [w, h] = ratio.split(':').map(Number);
  const scale = 8 / Math.max(w, h);
  const rw = Math.round(w * scale);
  const rh = Math.round(h * scale);

  return (
    <svg width="12" height="12" viewBox="0 0 12 12">
      <rect
        x={(12 - rw) / 2}
        y={(12 - rh) / 2}
        width={rw}
        height={rh}
        rx="1"
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
    </svg>
  );
}
