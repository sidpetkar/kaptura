import { useRef, useCallback } from 'react';
import type { FolderMeta } from '../hooks/useFolderStore';

interface Props {
  folders: FolderMeta[];
  activeFolderId: string | null;
  onFolderTap: (id: string) => void;
  onFolderLongPress: (id: string, rect: DOMRect) => void;
}

const LONG_PRESS_MS = 500;

export default function PhotoFolderTabs({
  folders,
  activeFolderId,
  onFolderTap,
  onFolderLongPress,
}: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressedRef = useRef(false);
  const targetRef = useRef<{ id: string; el: HTMLElement } | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (id: string, el: HTMLElement) => {
      pressedRef.current = false;
      targetRef.current = { id, el };
      clearTimer();
      timerRef.current = setTimeout(() => {
        pressedRef.current = true;
        const rect = el.getBoundingClientRect();
        onFolderLongPress(id, rect);
      }, LONG_PRESS_MS);
    },
    [clearTimer, onFolderLongPress],
  );

  const handlePointerUp = useCallback(
    (id: string) => {
      clearTimer();
      if (!pressedRef.current) {
        onFolderTap(id);
      }
      pressedRef.current = false;
    },
    [clearTimer, onFolderTap],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      onFolderLongPress(id, rect);
    },
    [onFolderLongPress],
  );

  if (folders.length === 0) return null;

  return (
    <div
      className="flex gap-5 px-4 py-3 overflow-x-auto shrink-0"
      style={{ touchAction: 'pan-x' }}
    >
      {folders.map((folder) => {
        const isActive = activeFolderId === folder.id;
        const dimmed = activeFolderId !== null && !isActive;

        return (
          <div
            key={folder.id}
            className="flex flex-col items-center gap-1.5 shrink-0 select-none transition-opacity duration-300"
            style={{ opacity: dimmed ? 0.35 : 1 }}
            onPointerDown={(e) => handlePointerDown(folder.id, e.currentTarget)}
            onPointerUp={() => handlePointerUp(folder.id)}
            onPointerCancel={clearTimer}
            onPointerLeave={clearTimer}
            onContextMenu={(e) => handleContextMenu(e, folder.id)}
          >
            <img
              src="/folder-icon.png"
              alt=""
              className="w-14 h-14 object-contain pointer-events-none"
              style={{ mixBlendMode: 'screen', transform: 'scaleX(-1)' }}
              draggable={false}
            />
            <span className="text-[11px] tracking-wider text-accent/80 max-w-[72px] truncate text-center">
              {folder.name}
            </span>
            <div
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: isActive ? 40 : 0,
                backgroundColor: isActive ? '#EAB308' : 'transparent',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
