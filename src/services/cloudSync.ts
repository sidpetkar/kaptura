import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  type DocumentData,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { imageStore, thumbnailStore, metaStore } from '../store/db';

export interface CloudImageMeta {
  id: string;
  timestamp: number;
  lutId?: string;
  folderId?: string;
  imageUrl?: string;
  thumbUrl?: string;
}

function imagesCol(uid: string) {
  return collection(db, 'users', uid, 'images');
}

function imageRef(uid: string, imageId: string) {
  return ref(storage, `users/${uid}/images/${imageId}.jpg`);
}

function thumbRef(uid: string, imageId: string) {
  return ref(storage, `users/${uid}/thumbs/${imageId}.jpg`);
}

export async function uploadImageToCloud(
  uid: string,
  id: string,
  blob: Blob,
  thumbBlob: Blob,
  meta: { timestamp: number; lutId?: string; folderId?: string },
): Promise<void> {
  if (!db || !storage) return;

  try {
    const [imageUrl, thumbUrl] = await Promise.all([
      uploadBytes(imageRef(uid, id), blob, { contentType: 'image/jpeg' }).then((snap) =>
        getDownloadURL(snap.ref),
      ),
      uploadBytes(thumbRef(uid, id), thumbBlob, { contentType: 'image/jpeg' }).then((snap) =>
        getDownloadURL(snap.ref),
      ),
    ]);

    await setDoc(doc(imagesCol(uid), id), {
      id,
      timestamp: meta.timestamp,
      lutId: meta.lutId ?? null,
      folderId: meta.folderId ?? null,
      imageUrl,
      thumbUrl,
    });
  } catch (err) {
    console.error('Cloud upload failed (will retry later):', err);
  }
}

export async function deleteImageFromCloud(uid: string, id: string): Promise<void> {
  if (!db || !storage) return;

  try {
    await Promise.all([
      deleteObject(imageRef(uid, id)).catch(() => {}),
      deleteObject(thumbRef(uid, id)).catch(() => {}),
      deleteDoc(doc(imagesCol(uid), id)),
    ]);
  } catch (err) {
    console.error('Cloud delete failed:', err);
  }
}

export async function syncFromCloud(uid: string): Promise<number> {
  if (!db || !storage) return 0;

  try {
    const q = query(imagesCol(uid), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    let synced = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as DocumentData;
      const id = data.id as string;

      const existsLocally = await metaStore.getItem(id);
      if (existsLocally) continue;

      try {
        const [imageResp, thumbResp] = await Promise.all([
          fetch(data.imageUrl as string),
          fetch(data.thumbUrl as string),
        ]);

        if (!imageResp.ok || !thumbResp.ok) continue;

        const [imageBlob, thumbBlob] = await Promise.all([
          imageResp.blob(),
          thumbResp.blob(),
        ]);

        await imageStore.setItem(id, imageBlob);
        await thumbnailStore.setItem(id, thumbBlob);
        await metaStore.setItem(id, {
          id,
          timestamp: data.timestamp as number,
          lutId: (data.lutId as string) ?? undefined,
          folderId: (data.folderId as string) ?? undefined,
        });

        synced++;
      } catch {
        // skip individual image failures
      }
    }

    return synced;
  } catch (err) {
    console.error('Cloud sync failed:', err);
    return 0;
  }
}

export async function uploadAllLocalToCloud(uid: string): Promise<void> {
  if (!db || !storage) return;

  interface LocalMeta {
    id: string;
    timestamp: number;
    lutId?: string;
    folderId?: string;
  }

  const metas: LocalMeta[] = [];
  await metaStore.iterate<LocalMeta, void>((value) => {
    metas.push(value);
  });

  for (const meta of metas) {
    const imageBlob = await imageStore.getItem<Blob>(meta.id);
    const thumbBlob = await thumbnailStore.getItem<Blob>(meta.id);
    if (!imageBlob || !thumbBlob) continue;

    await uploadImageToCloud(uid, meta.id, imageBlob, thumbBlob, meta);
  }
}
