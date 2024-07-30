declare global {
  export namespace Etendo {
    type WindowId = string;

    type ColumnId = string;

    type Entity = 'Order' | 'Invoice' | 'Product' | 'OrderLine';

    interface Metadata extends Record<string, unknown> {}

    interface CachedData<T> {
      updatedAt: number;
      data: T
    }

    interface CacheStore<T> {
      [key: string]: CachedData<T>
    }

    interface XHROptions extends Record<string, string | number> {}

    interface GETOptions {
      _startRow: string;
      _endRow: string;
      sortBy: string;
      columns: string;
    }
  }
}

export {};
