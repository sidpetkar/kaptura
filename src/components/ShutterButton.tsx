interface Props {
  onCapture: () => void;
  disabled?: boolean;
}

export default function ShutterButton({ onCapture, disabled }: Props) {
  return (
    <button
      onClick={onCapture}
      disabled={disabled}
      className="w-[72px] h-[72px] rounded-full border-[3px] border-accent/80 flex items-center justify-center transition-transform active:scale-95 disabled:opacity-40"
    >
      <div className="w-[58px] h-[58px] rounded-full bg-accent/90" />
    </button>
  );
}
