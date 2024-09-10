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
  header: string;
  id: string;
  accessorFn: (v: Record<string, unknown>) => unknown;
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

export interface MenuOption {
  type: MenuType;
  isVisible: boolean;
  isProcess: boolean;
  label: string;
  sequenceNumber: number;
  id: string;
  name?: string;
  form?: string;
  view?: string;
  identifier: string;
  process?: string;
  action?: string;
  url?: string;
  description?: string;
  windowId: string;
  children?: MenuOption[]
}

export interface Menu {
  id: string;
  label: string;
  singleRecord: boolean;
  readOnly: boolean;
  editOrDeleteOnly: boolean;
  type: MenuType;
  children?: MenuSubmenu[];
}

export interface MenuSubmenu extends Omit<Menu, 'submenu'> {
  singleRecord: boolean;
  readOnly: boolean;
  editOrDeleteOnly: boolean;
  type: MenuType;
  children?: SubmenuSubmenu[];
  tabId?: string;
  windowId?: string;
  optionType?: OptionType;
  viewValue?: string;
}

export enum OptionType {
  Process = 'process',
  ProcessDefinition = 'processDefinition',
  ProcessManual = 'processManual',
  Tab = 'tab',
  URL = 'url',
}

export interface SubmenuSubmenu {
  label: string;
  type: MenuType;
  tabId?: string;
  windowId?: string;
  optionType?: OptionType;
  id: string;
  viewValue?: string;
  singleRecord: boolean;
  readOnly: boolean;
  editOrDeleteOnly: boolean;
  viewId?: string;
  uiPattern?: UIPattern;
  processId?: string;
  manualUrl?: string;
  formId?: string;
  tabTitle?: string;
  modal?: string;
  manualProcessId?: string;
  submenu?: SubmenuSubmenu[];
}

export enum MenuType {
  Folder = 'folder',
  Form = 'form',
  Process = 'process',
  ProcessDefinition = 'processDefinition',
  ProcessManual = 'processManual',
  Report = 'report',
  View = 'view',
  Window = 'Window',
  Summary = 'Summary',
}

export enum UIPattern {
  A = 'A',
  OBUIAPPPickAndExecute = 'OBUIAPP_PickAndExecute',
  OBUIAPPReport = 'OBUIAPP_Report',
}

export interface RecordPayload extends Record<string, string> {
  _entity_name: string;
}
