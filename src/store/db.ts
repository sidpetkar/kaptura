import localforage from 'localforage';

export const imageStore = localforage.createInstance({
  name: 'kaptura',
  storeName: 'images',
  description: 'Saved edited images',
});

export const thumbnailStore = localforage.createInstance({
  name: 'kaptura',
  storeName: 'thumbnails',
  description: 'Image thumbnails for gallery',
});

export const metaStore = localforage.createInstance({
  name: 'kaptura',
  storeName: 'meta',
  description: 'Image metadata',
});

export const settingsStore = localforage.createInstance({
  name: 'kaptura',
  storeName: 'settings',
  description: 'App settings and preferences',
});
