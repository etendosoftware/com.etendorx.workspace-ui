export class CacheStore<T> {
  private duration: number;

  constructor(duration: number) {
    this.duration = duration;
  }

  public get(id: string) {
    const item = localStorage.getItem(id);
    console.log({ item });

    if (item) {
      const data = JSON.parse(item);
      const expired = Date.now() - data.updatedAt > this.duration;

      return expired ? null : data.value;
    }

    return null;
  }

  public set(id: string, value: T) {
    localStorage.setItem(
      id,
      JSON.stringify({
        updatedAt: Date.now(),
        value,
      }),
    );

    return this;
  }

  public delete(id: string) {
    return localStorage.removeItem(id);
  }

  public clear() {
    return localStorage.clear();
  }
}
