import { useCallback } from 'react';
import { DownloadSimple, Crown, X } from '@phosphor-icons/react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (withWatermark: boolean) => void;
  onUpgrade: () => void;
  isProUser: boolean;
}

export default function SaveModal({ open, onClose, onSave, onUpgrade, isProUser }: Props) {
  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleRemoveWatermark = useCallback(() => {
    if (isProUser) {
      onSave(false);
    } else {
      onClose();
      onUpgrade();
    }
  }, [isProUser, onSave, onClose, onUpgrade]);

  if (!open) return null;

  return (
    <>
      {/* Mobile: bottom sheet */}
      <div
        className="md:hidden fixed inset-0 z-50 flex items-end justify-center animate-panel-fade"
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
            onClick={handleRemoveWatermark}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-surface-lighter text-accent/70 font-medium text-sm tracking-wide"
          >
            <Crown size={18} weight="fill" className="text-amber-400/60" />
            Remove watermark
            {!isProUser && (
              <span className="text-[10px] tracking-wider text-muted ml-1 uppercase">Upgrade</span>
            )}
          </button>
        </div>
      </div>

      {/* Desktop: centered popup */}
      <div
        className="hidden md:flex fixed inset-0 z-50 items-center justify-center animate-panel-fade"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={handleBackdrop}
      >
        <div className="w-[380px] bg-surface rounded-2xl px-6 pt-5 pb-6 shadow-2xl animate-panel-fade">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-medium tracking-wider text-accent uppercase">
              Save Image
            </h3>
            <button onClick={onClose} className="text-accent/60 hover:text-accent p-1">
              <X size={18} weight="bold" />
            </button>
          </div>
          <button
            onClick={() => onSave(true)}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-amber-400 text-surface font-semibold text-sm tracking-wide mb-3"
          >
            <DownloadSimple size={20} weight="bold" />
            Download with watermark
          </button>
          <button
            onClick={handleRemoveWatermark}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-surface-lighter text-accent/70 font-medium text-sm tracking-wide"
          >
            <Crown size={18} weight="fill" className="text-amber-400/60" />
            Remove watermark
            {!isProUser && (
              <span className="text-[10px] tracking-wider text-muted ml-1 uppercase">Upgrade</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
