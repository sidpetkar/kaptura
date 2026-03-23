import { useEffect, useRef, useState } from 'react';
import { Trash, PencilSimple } from '@phosphor-icons/react';

interface Props {
  folderId: string;
  folderName: string;
  anchorRect: DOMRect;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onClose: () => void;
}

export default function FolderContextMenu({
  folderId,
  folderName,
  anchorRect,
  onDelete,
  onRename,
  onClose,
}: Props) {
  const [renaming, setRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(folderName);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('pointerdown', handler, true);
    return () => window.removeEventListener('pointerdown', handler, true);
  }, [onClose]);

  const handleRenameSubmit = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== folderName) {
      onRename(folderId, trimmed);
    }
    onClose();
  };

  const menuTop = anchorRect.top - 8;
  const menuLeft = Math.max(8, anchorRect.left + anchorRect.width / 2 - 80);

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        ref={menuRef}
        className="absolute bg-surface-light border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-panel-slide-up"
        style={{
          bottom: `calc(100vh - ${menuTop}px)`,
          left: menuLeft,
          minWidth: 180,
        }}
      >
        {renaming ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRenameSubmit();
            }}
            className="flex items-center gap-2 px-3 py-2.5"
          >
            <input
              ref={inputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              className="flex-1 bg-surface text-accent text-sm px-2 py-1.5 rounded-md border border-white/10 outline-none normal-case"
              style={{ letterSpacing: 'normal' }}
            />
          </form>
        ) : (
          <>
            <button
              onClick={() => setRenaming(true)}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-accent hover:bg-white/5 transition-colors"
            >
              <PencilSimple size={16} weight="bold" />
              <span>Rename</span>
            </button>
            <button
              onClick={() => {
                onDelete(folderId);
                onClose();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors"
            >
              <Trash size={16} weight="bold" />
              <span>Delete Folder</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
