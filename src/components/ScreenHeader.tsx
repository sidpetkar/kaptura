import type { ReactNode } from 'react';

interface Props {
  left?: ReactNode;
  right?: ReactNode;
  center?: ReactNode;
}

export default function ScreenHeader({ left, right, center }: Props) {
  return (
    <header className="shrink-0 flex items-center justify-between px-5 pt-6 pb-6">
      <div className="min-w-[60px] flex items-center justify-start">
        {left}
      </div>
      {center && (
        <div className="flex-1 flex items-center justify-center">
          {center}
        </div>
      )}
      <div className="min-w-[60px] flex items-center justify-end">
        {right}
      </div>
    </header>
  );
}
