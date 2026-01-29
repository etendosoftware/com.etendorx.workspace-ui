export interface Screenshot {
  id: string;
  name: string;
  dataUrl: string;
  timestamp: number;
}

const DB_NAME = "etendo-screenshots";
const STORE_NAME = "screenshots";
const DB_VERSION = 1;

class ScreenshotStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
    });
  }

  async save(screenshot: Screenshot): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(screenshot);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(): Promise<Screenshot[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const screenshots = request.result as Screenshot[];
        // Sort by timestamp descending (newest first)
        screenshots.sort((a, b) => b.timestamp - a.timestamp);
        resolve(screenshots);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getNextSequenceNumber(): Promise<string> {
    const screenshots = await this.getAll();
    const numbers = screenshots
      .map((s) => {
        const match = s.name.match(/^screenshot_(\d{3})$/);
        return match ? Number.parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0);

    const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return nextNum.toString().padStart(3, "0");
  }
}

export const screenshotStorage = new ScreenshotStorage();
