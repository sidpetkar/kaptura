import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function ScreenShell({ children }: Props) {
  return (
    <div className="h-full flex flex-col bg-surface animate-screen-in">
      {children}
    </div>
  );
}
