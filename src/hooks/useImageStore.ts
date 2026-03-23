import { useState, useEffect, useCallback } from 'react';
import { imageStore, thumbnailStore, metaStore } from '../store/db';
import { uploadImageToCloud, deleteImageFromCloud } from '../services/cloudSync';
import { auth } from '../lib/firebase';

interface ImageMeta {
  id: string;
  timestamp: number;
  lutId?: string;
  folderId?: string;
}

function getUid(): string | null {
  return auth?.currentUser?.uid ?? null;
}

export function useImageStore() {
  const [images, setImages] = useState<{ id: string; thumbnailUrl: string; timestamp: number; folderId?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const metas: ImageMeta[] = [];
    await metaStore.iterate<ImageMeta, void>((value) => {
      metas.push(value);
    });
    metas.sort((a, b) => b.timestamp - a.timestamp);

    const items = await Promise.all(
      metas.map(async (m) => {
        const thumbBlob = await thumbnailStore.getItem<Blob>(m.id);
        const thumbnailUrl = thumbBlob ? URL.createObjectURL(thumbBlob) : '';
        return { id: m.id, thumbnailUrl, timestamp: m.timestamp, folderId: m.folderId };
      }),
    );

    setImages(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveImage = useCallback(
    async (blob: Blob, lutId?: string, existingId?: string): Promise<string> => {
      const id = existingId ?? `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const timestamp = Date.now();
      const thumbBlob = await createThumbnail(blob, 400);

      await imageStore.setItem(id, blob);
      await thumbnailStore.setItem(id, thumbBlob);
      await metaStore.setItem(id, { id, timestamp, lutId } as ImageMeta);

      const uid = getUid();
      if (uid) {
        uploadImageToCloud(uid, id, blob, thumbBlob, { timestamp, lutId }).catch(() => {});
      }

      await refresh();
      return id;
    },
    [refresh],
  );

  const getFullImage = useCallback(async (id: string): Promise<Blob | null> => {
    return imageStore.getItem<Blob>(id);
  }, []);

  const deleteImage = useCallback(
    async (id: string) => {
      await imageStore.removeItem(id);
      await thumbnailStore.removeItem(id);
      await metaStore.removeItem(id);

      const uid = getUid();
      if (uid) {
        deleteImageFromCloud(uid, id).catch(() => {});
      }

      await refresh();
    },
    [refresh],
  );

  const importImages = useCallback(
    async (blobs: Blob[], folderId?: string): Promise<string[]> => {
      const ids: string[] = [];
      const uid = getUid();

      for (let i = 0; i < blobs.length; i++) {
        const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const timestamp = Date.now() - (blobs.length - 1 - i);
        const thumbBlob = await createThumbnail(blobs[i], 400);
        await imageStore.setItem(id, blobs[i]);
        await thumbnailStore.setItem(id, thumbBlob);
        await metaStore.setItem(id, { id, timestamp, folderId } as ImageMeta);

        if (uid) {
          uploadImageToCloud(uid, id, blobs[i], thumbBlob, { timestamp, folderId }).catch(() => {});
        }

        ids.push(id);
      }
      await refresh();
      return ids;
    },
    [refresh],
  );

  return { images, loading, saveImage, importImages, getFullImage, deleteImage, refresh };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

async function createThumbnail(blob: Blob, maxSize: number): Promise<Blob> {
  const img = await createImageBitmap(blob);
  const scale = maxSize / Math.max(img.width, img.height);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  img.close();
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85);
  });
}
