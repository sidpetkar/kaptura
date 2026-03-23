import { useState, useEffect, useCallback } from 'react';
import { settingsStore } from '../store/db';

const STORAGE_KEY = 'disabled_categories';

let memoryCache: Set<string> | null = null;

export function useCategoryPrefs() {
  const [disabledCategories, setDisabledCategories] = useState<Set<string>>(
    () => memoryCache ?? new Set(),
  );
  const [loaded, setLoaded] = useState(memoryCache !== null);

  useEffect(() => {
    if (memoryCache) return;
    settingsStore.getItem<string[]>(STORAGE_KEY).then((stored) => {
      const set = new Set(stored ?? []);
      memoryCache = set;
      setDisabledCategories(set);
      setLoaded(true);
    });
  }, []);

  const toggleCategory = useCallback(async (category: string) => {
    setDisabledCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      memoryCache = next;
      settingsStore.setItem(STORAGE_KEY, Array.from(next));
      return next;
    });
  }, []);

  const isCategoryEnabled = useCallback(
    (category: string) => !disabledCategories.has(category),
    [disabledCategories],
  );

  return { disabledCategories, toggleCategory, isCategoryEnabled, loaded };
}

export function getDisabledCategories(): Set<string> {
  return memoryCache ?? new Set();
}
