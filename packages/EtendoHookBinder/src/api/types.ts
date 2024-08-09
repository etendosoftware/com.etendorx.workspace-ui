export type WindowId = string;
export type ColumnId = string;
export type Metadata = string;

export interface CachedData<T> {
  updatedAt: number;
  value: T;
}

export interface CacheStore<T> extends Map<string, CachedData<T>> {}

export interface Criteria {
  fieldName: string;
  operator: string;
  value: string;
}

export interface MetadataParams extends Record<string, unknown> {
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

export interface GridProps {
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
  showIf: string;
}

export interface Field {
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

export interface ViewStandardProperties extends Record<string, unknown> {
  // Define known properties if possible
}

export interface WindowMetadataProperties {
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

export interface WindowMetadata {
  name: string;
  superClass?: string;
  properties: WindowMetadataProperties;
}

export interface WindowMetadataMap extends Record<string, WindowMetadata> {}
