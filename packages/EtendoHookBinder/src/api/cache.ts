'use client';

type StorageType = 'localStorage' | 'sessionStorage';
type CacheData = { updatedAt: number; value: unknown };

export const createCache = (duration: number, storageType: StorageType = 'localStorage') => {
  const getStorage = () => {
    if (typeof window === 'undefined') return null;
    return storageType === 'localStorage' ? window.localStorage : window.sessionStorage;
  };

  const isExpired = (updatedAt: number): boolean => {
    return Date.now() > updatedAt + duration;
  };

  const parseStoredItem = (item: string): CacheData => {
    try {
      return JSON.parse(item);
    } catch (error) {
      console.warn('Error parsing stored item:', error);
      throw new Error('Failed to parse stored item.');
    }
  };

  return {
    get: <T = unknown>(id: string): T | null => {
      const storage = getStorage();
      if (!storage) return null;

      try {
        const item = storage.getItem(id);
        if (!item) return null;

        const data = parseStoredItem(item);
        if (isExpired(data.updatedAt)) {
          storage.removeItem(id);
          return null;
        }

        return data.value as T;
      } catch (e) {
        console.warn('Error in cache get:', e);
        return null;
      }
    },

    set: (id: string, value: unknown) => {
      const storage = getStorage();
      if (!storage) return;

      try {
        const item = {
          updatedAt: Date.now(),
          value,
        };
        storage.setItem(id, JSON.stringify(item));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          console.warn('Storage quota exceeded.');
        } else {
          console.warn('Error in cache set:', e);
        }
      }
    },

    delete: (id: string) => {
      const storage = getStorage();
      if (!storage) return;
      storage.removeItem(id);
    },

    isAvailable: () => {
      return getStorage() !== null;
    },
  };
};
