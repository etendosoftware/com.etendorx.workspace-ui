declare global {
  interface Window {
    isc: {
      ClassFactory: {
        defineClass: (
          className: string,
          superClass: string,
        ) => {
          addProperties: (
            properties: unknown[],
          ) => typeof window.isc.ClassFactory;
        };
      };
    };
    OB: Record<string, unknown>;
    classes: Etendo.ClassMap;
  }
  export namespace Etendo {
    type WindowId = string;

    type ColumnId = string;

    type Entity = 'Order' | 'Invoice' | 'Product' | 'OrderLine';

    type Metadata = string;

    interface CachedData<T> {
      updatedAt: number;
      data: T;
    }

    interface CacheStore<T> {
      [key: string]: CachedData<T>;
    }

    interface Criteria {
      fieldName: string;
      operator: string;
      value: string;
    }
    interface MetadataParams extends Record<string, string> {
      _windowId?: string;
      _columns?: string[];
      _startRow?: string;
      _endRow?: string;
      _targetRecordId?: string;
      _sortBy?: string;
      _writeToFile?: boolean;
      _criteria?: Criteria[];
      _mode?: 'SHOW_COLUMNS' | 'GET_DATA';
      _operationType?: 'fetch' | 'add' | 'update' | 'remove';
    }

    interface Object extends Record<string, unknown> {}

    interface Klass {
      name: string;
      superClass: string;
      properties: unknown[];
    }

    interface ClassMap extends Record<string, Klass> {}
  }
}

export {};
