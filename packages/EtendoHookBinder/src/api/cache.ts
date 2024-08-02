export class CacheStore<T> {
  private store: Etendo.CacheStore<T>;
  private duration: number;

  constructor(duration) {
    this.duration = duration;
    this.store = {};
  }

  private expired(id: string) {
    if (this.store[id]?.updatedAt) {
      return Date.now() - this.store[id].updatedAt > this.duration;
    }

    return true;
  }

  public get(id) {
    return;
  }
}
