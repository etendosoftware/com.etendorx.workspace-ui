export class CacheStore {
  private duration: number;
  private storage: Storage | undefined;

  constructor(duration: number) {
    if (duration <= 0) {
      throw new Error('Duration must be a positive number.');
    }

    // if (![localStorage, sessionStorage].includes(storage)) {
    //   throw new Error('Invalid storage type. Expected localStorage or sessionStorage.');
    // }

    this.duration = duration;
    this.storage = typeof window !== 'undefined' ? window.localStorage : undefined;
  }

  /**
   * Retrieves a value from storage.
   * Returns null if the value has expired or if an error occurs.
   * @param id - The identifier of the value to retrieve.
   */
  public get<T = unknown>(id: string): T | null {
    try {
      const item = this.storage?.getItem(id);

      if (!item) return null;

      const data = this.parseStoredItem(item);

      if (this.isExpired(data.updatedAt)) {
        this.delete(id);

        return null;
      }

      return data.value as T;
    } catch (e) {
      this.handleError(e);

      return null;
    }
  }

  /**
   * Stores a value in the storage.
   * @param id - The identifier for the value to store.
   * @param value - The value to store.
   */
  public set(id: string, value: unknown): this {
    try {
      this.storage?.setItem(id, JSON.stringify(this.createStoredItem(value)));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        this.handleStorageQuotaError();
      } else {
        this.handleError(e);
      }
    }

    return this;
  }

  /**
   * Deletes a value from the storage.
   * @param id - The identifier of the value to delete.
   */
  public delete(id: string): void {
    this.storage?.removeItem(id);
  }

  /**
   * Checks if a value has expired by comparing the last updated timestamp.
   * @param updatedAt - The last update timestamp of the stored item.
   * @returns true if the value has expired, false otherwise.
   */
  private isExpired(updatedAt: number): boolean {
    return Date.now() > updatedAt + this.duration;
  }

  /**
   * Creates an object to store, including the value and the timestamp.
   * @param value - The value to store.
   * @returns The object with the value and timestamp.
   */
  private createStoredItem(value: unknown): { updatedAt: number; value: unknown } {
    return {
      updatedAt: Date.now(),
      value,
    };
  }

  /**
   * Parses a stored item from its JSON format.
   * @param item - The stored item in JSON format.
   * @returns The parsed object.
   */
  private parseStoredItem(item: string): { updatedAt: number; value: unknown } {
    try {
      return JSON.parse(item);
    } catch (error) {
      this.handleError(error);

      throw new Error('Failed to parse stored item.');
    }
  }

  /**
   * Handles general errors in a centralized manner.
   * @param error - The error that occurred.
   */
  private handleError(error: unknown): void {
    console.warn('Error in CacheStore:', error);
  }

  /**
   * Handles storage quota errors when the storage limit is exceeded.
   */
  private handleStorageQuotaError(): void {
    console.warn('Storage quota exceeded.');
  }
}
