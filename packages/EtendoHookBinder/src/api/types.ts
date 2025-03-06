export type WindowId = string;

export interface CachedData<T> {
  updatedAt: number;
  value: T;
}

export interface CacheStore<T> extends Map<string, CachedData<T>> {}

export interface BaseCriteria {
  fieldName: string;
  operator: string;
  value: string | number | undefined;
}

export interface CompositeCriteria {
  operator: 'and' | 'or';
  criteria: BaseCriteria[];
}

export type Criteria = BaseCriteria | CompositeCriteria;

export type MRT_ColumnFiltersState = {
  id: string;
  value: unknown;
}[];
export interface DatasourceParams {
  windowId?: string;
  tabId?: string;
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
  pageSize?: number;
  headers?: Record<string, string>;
  tabId?: string;
  windowId?: string;
  language?: string;
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

export interface ReadOnlyState {
  readOnly: boolean;
  readOnlyLogicExpr?: string;
  readOnlyReason?: 'FIELD_READONLY' | 'READONLY_LOGIC' | 'ACCESS_LEVEL';
}
export interface Field {
  hqlName: string;
  inputName: string;
  columnName: string;
  readOnlyState?: ReadOnlyState;
  process: string;
  shownInStatusBar: boolean;
  tab: string;
  displayed: boolean;
  startnewline: boolean;
  showInGridView: boolean;
  fieldGroup$_identifier: string;
  fieldGroup: string;
  column: Record<string, string>;
  name: string;
  id: string;
  module: string;
  required: boolean;
  hasDefaultValue: boolean;
  refColumnName: string;
  targetEntity: string;
  gridProps: GridProps;
  type: string; // Consider specifying possible values if known
  selector?: Record<string, string>;
  refList: { id: string; label: string; value: string }[];
  referencedEntity: string;
  referencedWindowId: string;
  referencedTabId: string;
  displayLogicExpression?: string;
  readOnlyLogicExpression?: string;
}

export interface Option<T extends string = string> {
  title: string;
  value: T;
  id: string;
}

export interface ValueWithIdentifier {
  value: unknown;
  identifier: string;
}

export interface Column {
  fieldGroup?: string;
  header: string;
  id: string;
  accessorFn: (v: Record<string, unknown>) => unknown;
  columnName: string;
  isMandatory?: boolean;
  name: string;
  reference?: string;
  _identifier: string;
  displayType?: string;
  [key: string]: unknown;
}

export interface MappedField {
  name: string;
  label: string;
  type: FieldType;
  referencedTable?: string;
  required?: boolean;
}

export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'search' | 'tabledir' | 'quantity' | 'list';

export interface MappedTab {
  id: string;
  name: string;
  fields: Record<string, MappedField>;
}

export interface MappedData {
  id: string;
  name: string;
  tabs: MappedTab[];
  fields?: MappedField[];
}

export interface ViewStandardProperties extends Record<string, unknown> {}

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
  uIPattern: 'STD' | 'SR';
  windowId: string;
  name: string;
  title: string;
  parentColumns: string[];
  id: string;
  entityName: string;
  fields: Record<string, Field>;
  level: number;
  _identifier: string;
  records: Record<string, never>;
  hqlfilterclause: string;
  hqlwhereclause: string;
  sQLWhereClause: string;
  module: string;
}

export interface WindowMetadata {
  id: string;
  name: string;
  superClass?: string;
  properties: WindowMetadataProperties;
  tabs: Tab[];
  window$_identifier: string;
}

export interface RecordPayload extends Record<string, string> {
  _entity_name: string;
}

export interface Menu {
  _identifier?: string;
  _entityName?: string;
  $ref?: string;
  recordTime?: number;
  children?: Menu[];
  icon?: string | null;
  id: string;
  name: string;
  windowId?: string;
  recordId?: string;
  tableId?: string;
  window?: Window | null;
  type?: string;
  action?: Action[keyof Action] | null;
  isSearchResult?: boolean;
  path?: string[];
  fullPath?: string;
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

export interface LoginResponse {
  status: string;
  token: string;
  roleList: Array<{
    id: string;
    name: string;
    orgList: Array<{
      id: string;
      name: string;
      warehouseList: Array<{
        id: string;
        name: string;
      }>;
    }>;
  }>;
}

export interface ISession extends Record<string, string | number | boolean | null> {}

export interface User {
  id: string;
  name: string;
  username: string;
  image: string;
  defaultRole: string;
  defaultWarehouse: string;
  defaultWarehouse$_identifier: string;
  defaultClient: string;
  client$_identifier: string;
  defaultLanguage: string;
  defaultLanguage$_identifier: string;
  defaultOrganization: string;
  defaultOrganization$_identifier: string;
  defaultRole$_identifier: string;
}

export interface SessionResponse {
  user: User;
  role: {
    id: string;
    name: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  languages: Record<string, { id: string; language: string; name: string }>;
  session: ISession;
}

/* 
{
  "user": {
  },
  "role": {
      "_identifier": "F&B International Group Admin",
      "_entityName": "ADRole",
      "$ref": "ADRole/42D0EEB1C66F497A90DD526DC597E6F0",
      "id": "42D0EEB1C66F497A90DD526DC597E6F0",
      "client": "23C59575B9CF467C9620760EB255B389",
      "client$_identifier": "F&B International Group",
      "organization": "0",
      "organization$_identifier": "*",
      "active": true,
      "creationDate": "2013-07-04T23:45:45-03:00",
      "createdBy": "0",
      "createdBy$_identifier": "System",
      "updated": "2013-07-04T23:45:45-03:00",
      "name": "F&B International Group Admin",
      "updatedBy": "0",
      "updatedBy$_identifier": "System",
      "description": "F&B International Group Admin",
      "userLevel": " CO",
      "currency": null,
      "approvalAmount": 0,
      "primaryTreeMenu": null,
      "manual": false,
      "processNow": false,
      "clientAdmin": true,
      "advanced": true,
      "isrestrictbackend": false,
      "forPortalUsers": false,
      "portalAdmin": false,
      "isWebServiceEnabled": true,
      "template": false,
      "recalculatePermissions": null,
      "recordTime": 1735965470773
  }
}
 */
export interface DefaultConfiguration {
  language?: string;
  client?: string;
  organization?: string;
  defaultRole?: string;
  defaultWarehouse?: string;
}

export interface Role {
  id: string;
  name: string;
  orgList: Array<{
    id: string;
    name: string;
    warehouseList: Array<{
      id: string;
      name: string;
    }>;
  }>;
}

export interface ProfileInfo {
  name: string;
  email: string;
  image: string;
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface ToolbarButton {
  id: string;
  name: string;
  action: string;
  enabled: boolean;
  visible: boolean;
}

export interface ToolbarMetadata {
  buttons: ToolbarButton[];
  isNew: boolean;
  gridId: string | null;
  action: string;
}

export interface FieldInfo {
  fieldGroup$_identifier?: string;
}

export interface BaseFieldDefinition<T> {
  value: T;
  type: FieldType;
  label: string;
  name: string;
  section?: string;
  required?: boolean;
  initialValue?: T;
  readOnlyState?: ReadOnlyState;
  original: {
    referencedEntity: string;
    referencedWindowId: string;
    referencedTabId: string;
    fieldName: string;
  } & Field;
}

export type SelectOption = { id: string; title: string; value: string };
export type FieldDefinition =
  | BaseFieldDefinition<string>
  | BaseFieldDefinition<number>
  | BaseFieldDefinition<boolean>
  | BaseFieldDefinition<Date>
  | BaseFieldDefinition<string[]>
  | BaseFieldDefinition<SelectOption>;

type EntityKey = string;
type EntityValue = string | number | boolean | symbol;

export interface EntityData {
  [key: EntityKey]: EntityValue;
}

export enum FormMode {
  NEW = 'NEW',
  EDIT = 'EDIT',
}

export interface FormInitializationParams {
  tab: Tab;
  mode: FormMode;
  recordId?: string;
}

export interface FormInitializationResponse {
  columnValues: Record<
    string,
    {
      value: string;
      classicValue?: string;
      identifier?: string;
      entries?: Array<{ id: string; _identifier: string }>;
    }
  >;
  auxiliaryInputValues: Record<string, { value: string; classicValue?: string }>;
  sessionAttributes: Record<string, string>;
  dynamicCols: string[];
  attachmentExists: boolean;
  _readOnly?: boolean;
}
