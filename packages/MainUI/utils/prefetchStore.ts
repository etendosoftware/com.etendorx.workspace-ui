const PREFETCH_TTL_MS = 30_000;

interface PrefetchEntry {
  promise: Promise<unknown>;
  timestamp: number;
}

const store = new Map<string, PrefetchEntry>();

export const prefetchStore = {
  set(key: string, promise: Promise<unknown>): void {
    store.set(key, { promise, timestamp: Date.now() });
  },

  get(key: string): Promise<unknown> | undefined {
    const entry = store.get(key);
    if (!entry) return undefined;

    // Auto-expire stale entries
    if (Date.now() - entry.timestamp > PREFETCH_TTL_MS) {
      store.delete(key);
      return undefined;
    }

    // Consume on read
    store.delete(key);
    return entry.promise;
  },

  clear(): void {
    store.clear();
  },
};
