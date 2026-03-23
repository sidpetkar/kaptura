import { useState, useEffect, useCallback } from 'react';
import { folderStore, metaStore, imageStore, thumbnailStore } from '../store/db';

export interface FolderMeta {
  id: string;
  name: string;
  createdAt: number;
}

export function useFolderStore(onImagesChanged?: () => Promise<void>) {
  const [folders, setFolders] = useState<FolderMeta[]>([]);

  const refresh = useCallback(async () => {
    const items: FolderMeta[] = [];
    await folderStore.iterate<FolderMeta, void>((value) => {
      items.push(value);
    });
    items.sort((a, b) => b.createdAt - a.createdAt);
    setFolders(items);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createFolder = useCallback(
    async (name: string): Promise<string> => {
      const id = `folder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const folder: FolderMeta = { id, name, createdAt: Date.now() };
      await folderStore.setItem(id, folder);
      await refresh();
      return id;
    },
    [refresh],
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      await folderStore.removeItem(id);

      // Delete all images that belonged to this folder
      const toDelete: string[] = [];
      await metaStore.iterate<{ id: string; folderId?: string }, void>((value, key) => {
        if (value.folderId === id) {
          toDelete.push(key);
        }
      });
      await Promise.all(
        toDelete.map(async (key) => {
          await imageStore.removeItem(key);
          await thumbnailStore.removeItem(key);
          await metaStore.removeItem(key);
        }),
      );

      await refresh();
      await onImagesChanged?.();
    },
    [refresh, onImagesChanged],
  );

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      const existing = await folderStore.getItem<FolderMeta>(id);
      if (!existing) return;
      await folderStore.setItem(id, { ...existing, name });
      await refresh();
    },
    [refresh],
  );

  return { folders, createFolder, deleteFolder, renameFolder, refresh };
}
