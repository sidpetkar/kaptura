import { useMemo } from 'react';
import { getCategories } from '../engine/lutManager';

interface Props {
  active: string;
  onChange: (tab: string) => void;
  lutsReady?: boolean;
  prefsKey?: number;
}

export default function FolderTabs({ active, onChange, lutsReady, prefsKey }: Props) {
  const categories = useMemo(() => (lutsReady ? getCategories() : []), [lutsReady, prefsKey]);

  if (categories.length <= 1) return null;

  return (
    <div className="flex gap-1 px-4 py-2 overflow-x-auto" style={{ touchAction: 'pan-x' }}>
      {categories.map((cat) => {
        const key = cat === 'all' ? 'all presets' : cat;
        const label = cat === 'all' ? 'all presets' : cat;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`shrink-0 px-3 py-1.5 text-[12px] tracking-widest font-medium rounded-sm transition-colors whitespace-nowrap capitalize ${
              active === key
                ? 'bg-accent/10 text-accent border border-accent/30'
                : 'text-muted hover:text-accent'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
