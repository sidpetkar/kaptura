import { useCallback } from 'react';
import { DownloadSimple, Crown } from '@phosphor-icons/react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (withWatermark: boolean) => void;
}

export default function SaveModal({ open, onClose, onSave }: Props) {
  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center animate-panel-fade"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md bg-surface rounded-t-2xl px-5 pt-6 pb-8 animate-panel-slide-up">
        <h3 className="text-sm font-medium tracking-wider text-accent mb-5 text-center uppercase">
          Save Image
        </h3>

        <button
          onClick={() => onSave(true)}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-amber-400 text-surface font-semibold text-sm tracking-wide mb-3"
        >
          <DownloadSimple size={20} weight="bold" />
          Download with watermark
        </button>

        <button
          onClick={() => onSave(false)}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-surface-lighter text-accent/70 font-medium text-sm tracking-wide"
        >
          <Crown size={18} weight="fill" className="text-amber-400/60" />
          Remove watermark
          <span className="text-[10px] tracking-wider text-muted ml-1 uppercase">Premium</span>
        </button>
      </div>
    </div>
  );
}
