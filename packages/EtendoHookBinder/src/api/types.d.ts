declare global {
  export namespace Etendo {
    type WindowId = string;

    type ColumnId = string;

    type Entity = 'Order' | 'Invoice' | 'Product' | 'OrderLine';

    interface Metadata extends Record<string, unknown> {}

    interface CachedData<T> {
      updatedAt: number;
      data: T;
    }

    interface CacheStore<T> {
      [key: string]: CachedData<T>;
    }
    interface MetadataParams {
      windowId: string;
      mode: 'SHOW_COLUMNS' | 'GET_DATA';
      columns?: string[];
      startRow?: number;
      endRow?: number;
      targetRecordId?: string;
      sortBy?: string;
      criteria?: Array<{
        fieldName: string;
        operator: string;
        value: string;
      }>;
      writeToFile?: boolean;
    }

    interface Object extends Record<string, unknown> {}
  }
}

export {};
