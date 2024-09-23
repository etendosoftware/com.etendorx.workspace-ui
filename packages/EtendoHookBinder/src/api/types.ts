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
  value?: string;
}

export interface DatasourceParams {
  windowId?: string;
  columns?: string[];
  startRow?: number;
  endRow?: number;
  sortBy?: string;
  criteria?: Criteria[];
  operationType?: 'fetch' | 'add' | 'update' | 'remove';
  isSorting?: boolean;
  isImplicitFilterApplied?: boolean;
  operator?: 'and' | 'or';
}

export interface DatasourceOptions {
  columns?: string[];
  sortBy?: string;
  criteria?: Criteria[];
  operationType?: 'fetch' | 'add' | 'update' | 'remove';
  isSorting?: boolean;
  isImplicitFilterApplied?: boolean;
  operator?: 'and' | 'or';
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
  fieldGroup$_identifier: any;
  fieldGroup: any;
  column: Record<string, string>;
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

export interface Column {
  fieldGroup: string;
  header: string;
  id: string;
  accessorFn: (v: Record<string, unknown>) => unknown;
  columnName: string;
  isMandatory: boolean;
  name: string;
  reference: string;
  _identifier: string;
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

export interface Tab {
  id: string;
  entityName: string;
  fields: Record<string, Field>;
  level: number;
  _identifier: string;
}

export interface WindowMetadata {
  id: string;
  name: string;
  superClass?: string;
  properties: WindowMetadataProperties;
  tabs: Tab[];
}

export interface WindowMetadataMap extends Record<string, WindowMetadata> {}

export enum OptionType {
  Process = 'process',
  ProcessDefinition = 'processDefinition',
  ProcessManual = 'processManual',
  Tab = 'tab',
  URL = 'url',
}

export enum UIPattern {
  A = 'A',
  OBUIAPPPickAndExecute = 'OBUIAPP_PickAndExecute',
  OBUIAPPReport = 'OBUIAPP_Report',
}

export interface RecordPayload extends Record<string, string> {
  _entity_name: string;
}

export interface Menu {
  _identifier: string;
  _entityName: string;
  $ref: string;
  recordTime: number;
  children?: Menu[];
  icon?: string | null;
  id: string;
  name: string;
  windowId?: string;
  window?: Window | null;
  action?: Action[keyof Action] | null;
}

export enum Action {
  OBUIAPPOpenView = 'OBUIAPP_OpenView',
  OBUIAPPProcess = 'OBUIAPP_Process',
  P = 'P',
  R = 'R',
  W = 'W',
  X = 'X',
}

export interface Window {
  _identifier: string;
  _entityName: string;
  $ref: string;
  recordTime: number;
  id: string;
  name: string;
  windowType: keyof typeof WindowType;
}

export enum WindowType {
  M = 'M',
  Q = 'Q',
  T = 'T',
}
