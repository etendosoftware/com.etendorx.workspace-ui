export declare global {
  interface Window {
    isc: {
      ClassFactory: {
        defineClass: (
          className: string,
          superClass: string,
        ) => {
          addProperties: (
            properties: Etendo.WindowMetadataProperties,
          ) => typeof window.isc.ClassFactory;
        };
      };
    };
    OB: Record<string, unknown>;
    Metadata: unknown;
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

    interface GridProps {
      sort: number;
      autoExpand: boolean;
      editorProps: {
        displayField: string;
        valueField: string;
      };
      displaylength: number;
      fkField: boolean;
      selectOnClick: boolean;
      canSort: boolean;
      canFilter: boolean;
      showHover: boolean;
      filterEditorProperties: {
        keyProperty: string;
      };
    }

    interface Field {
      name: string;
      id: string;
      title: string;
      required: boolean;
      hasDefaultValue: boolean;
      columnName: string;
      inpColumnName: string;
      refColumnName: string;
      targetEntity: string;
      gridProps: GridProps;
      type: string; // Consider specifying possible values if known
    }

    interface ViewStandardProperties extends Record<string, unknown> {
      // Define known properties if possible
    }

    interface WindowMetadataProperties {
      windowId: string;
      multiDocumentEnabled: boolean;
      viewProperties: {
        fields: Field[];
        tabTitle: string;
        entity: string;
        statusBarFields: unknown[];
        iconToolbarButtons: unknown[];
        actionToolbarButtons: unknown[];
        isDeleteableTable: boolean;
        tabId: string;
        moduleId: string;
        showCloneButton: boolean;
        askToCloneChildren: boolean;
        standardProperties: ViewStandardProperties;
        showParentButtons: boolean;
        buttonsHaveSessionLogic: boolean;
        initialPropertyToColumns: unknown[]; // Define if known
      };
    }

    interface WindowMetadata {
      name: string;
      superClass?: string;
      properties: WindowMetadataProperties;
    }

    interface WindowMetadataMap extends Record<string, WindowMetadata> {}
  }
}
