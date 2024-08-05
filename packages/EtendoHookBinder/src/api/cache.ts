export class CacheStore<T> {
  private store: Etendo.CacheStore<T>;
  private duration: number;

  constructor(duration: number) {
    this.duration = duration;
    this.store = new Map<string, Etendo.CachedData<T>>();
  }

  public has(id: string) {
    const item = this.store.get(id);

    if (item) {
      return Date.now() - item.updatedAt < this.duration;
    }

    return false;
  }

  public get(id: string) {
    if (this.store.has(id)) {
      return this.store.get(id)?.value;
    }
  }

  public set(id: string, value: T) {
    this.store.set(id, {
      updatedAt: Date.now(),
      value,
    });

    return this;
  }

  public delete(id: string) {
    return this.store.delete(id);
  }

  public clear() {
    return this.store.clear();
  }
}
