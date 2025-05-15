/* eslint-disable @typescript-eslint/no-explicit-any */
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
  isMandatory: boolean;
  column: Record<string, string>;
  name: string;
  id: string;
  module: string;
  hasDefaultValue: boolean;
  refColumnName: string;
  targetEntity: string;
  gridProps: GridProps;
  type: string;
  field: unknown[];
  selector?: Record<string, string>;
  refList: { id: string; label: string; value: string }[];
  referencedEntity: string;
  referencedWindowId: string;
  referencedTabId: string;
  displayLogicExpression?: string;
  readOnlyLogicExpression?: string;
  isReadOnly: boolean;
  isDisplayed: boolean;
  sequenceNumber: number;
  isUpdatable: boolean;
  description: string;
  helpComment: string;
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

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  SEARCH = 'search',
  TABLEDIR = 'tabledir',
  QUANTITY = 'quantity',
  LIST = 'list',
  BUTTON = 'button',
}

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
  table: string;
  entityName: string;
  fields: Record<string, Field>;
  level: number;
  _identifier: string;
  records: Record<string, never>;
  hqlfilterclause: string;
  hqlwhereclause: string;
  sQLWhereClause: string;
  module: string;
  parentTabId?: string;
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
  token: string;
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
  currentRole: CurrentRole;
  currentOrganization: CurrentOrganization;
  currentClient: CurrentClient;
  currentWarehouse?: CurrentWarehouse;
  roles: RoleList;
  languages: Languages;
  attributes: { [key: string]: null | string };
}

export type RoleList = {
  id: string;
  name: string;
  organizations: Organization[];
  client: string;
}[];

export interface Organization {
  id: string;
  name: string;
  warehouses: Warehouse[];
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface CurrentClient {
  _identifier: string;
  _entityName: string;
  $ref: string;
  id: string;
  organization: string;
  organization$_identifier: string;
  active: boolean;
  creationDate: Date;
  createdBy: string;
  createdBy$_identifier: string;
  updated: Date;
  updatedBy: string;
  updatedBy$_identifier: string;
  searchKey: string;
  name: string;
  description: string;
  mailHost: null;
  requestEmail: null;
  requestUser: null;
  requestUserPassword: null;
  requestFolder: null;
  language: null;
  multilingualDocuments: boolean;
  sMTPAuthentification: boolean;
  currency: string;
  currency$_identifier: string;
  acctdimCentrallyMaintained: boolean;
  projectAcctdimIsenable: boolean;
  projectAcctdimHeader: boolean;
  projectAcctdimLines: boolean;
  projectAcctdimBreakdown: boolean;
  bpartnerAcctdimIsenable: boolean;
  bpartnerAcctdimHeader: boolean;
  bpartnerAcctdimLines: boolean;
  bpartnerAcctdimBreakdown: boolean;
  productAcctdimIsenable: boolean;
  productAcctdimHeader: boolean;
  productAcctdimLines: boolean;
  productAcctdimBreakdown: boolean;
  costcenterAcctdimHeader: boolean;
  costcenterAcctdimLines: boolean;
  costcenterAcctdimBreakdown: boolean;
  user1AcctdimIsenable: boolean;
  user1AcctdimHeader: boolean;
  user1AcctdimLines: boolean;
  user1AcctdimBreakdown: boolean;
  user2AcctdimIsenable: boolean;
  user2AcctdimHeader: boolean;
  user2AcctdimLines: boolean;
  user2AcctdimBreakdown: boolean;
  costcenterAcctdimIsenable: boolean;
  orgAcctdimIsenable: boolean;
  orgAcctdimHeader: boolean;
  orgAcctdimLines: boolean;
  orgAcctdimBreakdown: boolean;
  daysToPasswordExpiration: number;
  recordTime: number;
}

export interface CurrentOrganization {
  _identifier: string;
  _entityName: string;
  $ref: string;
  id: string;
  client: string;
  client$_identifier: string;
  active: boolean;
  creationDate: Date;
  createdBy: string;
  createdBy$_identifier: string;
  updated: Date;
  updatedBy: string;
  updatedBy$_identifier: string;
  searchKey: string;
  name: string;
  description: null;
  summaryLevel: boolean;
  organizationType: string;
  organizationType$_identifier: string;
  allowPeriodControl: boolean;
  calendar: null;
  ready: boolean;
  socialName: null;
  currency: null;
  generalLedger: null;
  aPRMGlitem: null;
  periodControlAllowedOrganization: string;
  periodControlAllowedOrganization$_identifier: string;
  calendarOwnerOrganization: string;
  calendarOwnerOrganization$_identifier: string;
  legalEntityOrganization: string;
  legalEntityOrganization$_identifier: string;
  inheritedCalendar: string;
  inheritedCalendar$_identifier: string;
  businessUnitOrganization: null;
  extbpEnabled: boolean;
  extbpConfig: null;
  recordTime: number;
}

export interface CurrentRole {
  _identifier: string;
  _entityName: string;
  $ref: string;
  id: string;
  client: string;
  client$_identifier: string;
  organization: string;
  organization$_identifier: string;
  active: boolean;
  creationDate: Date;
  createdBy: string;
  createdBy$_identifier: string;
  updated: Date;
  name: string;
  updatedBy: string;
  updatedBy$_identifier: string;
  description: string;
  userLevel: string;
  currency: null;
  approvalAmount: number;
  primaryTreeMenu: null;
  manual: boolean;
  processNow: boolean;
  clientAdmin: boolean;
  advanced: boolean;
  isrestrictbackend: boolean;
  forPortalUsers: boolean;
  portalAdmin: boolean;
  isWebServiceEnabled: boolean;
  template: boolean;
  recalculatePermissions: null;
  recordTime: number;
}

export interface CurrentWarehouse {
  _identifier: string;
  _entityName: string;
  $ref: string;
  id: string;
  client: string;
  client$_identifier: string;
  organization: string;
  organization$_identifier: string;
  active: boolean;
  creationDate: Date;
  createdBy: string;
  createdBy$_identifier: string;
  updated: Date;
  updatedBy: string;
  updatedBy$_identifier: string;
  searchKey: string;
  name: string;
  description: null;
  locationAddress: string;
  locationAddress$_identifier: string;
  storageBinSeparator: string;
  shipmentVehicle: boolean;
  shipperCode: null;
  fromDocumentNo: null;
  toDocumentNo: null;
  returnlocator: string;
  returnlocator$_identifier: string;
  warehouseRule: null;
  allocated: boolean;
  recordTime: number;
}

export interface Languages {
  [key: string]: {
    id: string;
    name: string;
    language: string;
  };
}

export interface User {
  _identifier: string;
  _entityName: string;
  $ref: string;
  id: string;
  client: string;
  client$_identifier: string;
  organization: string;
  organization$_identifier: string;
  active: boolean;
  creationDate: Date;
  createdBy: string;
  createdBy$_identifier: string;
  updated: Date;
  updatedBy: string;
  updatedBy$_identifier: string;
  name: string;
  description: null;
  password: string;
  email: null;
  supervisor: null;
  businessPartner: null;
  processNow: null;
  emailServerUsername: string;
  emailServerPassword: null;
  partnerAddress: null;
  greeting: null;
  position: null;
  comments: null;
  phone: null;
  alternativePhone: null;
  fax: null;
  lastContactDate: null;
  lastContactResult: null;
  birthday: null;
  trxOrganization: null;
  firstName: string;
  lastName: null;
  username: string;
  defaultClient: string;
  defaultLanguage: string;
  defaultOrganization: string;
  defaultRole: string;
  defaultRole$_identifier: string;
  defaultWarehouse: string;
  locked: boolean;
  image: string;
  grantPortalAccess: boolean;
  lastPasswordUpdate: Date;
  isPasswordExpired: boolean;
  commercialauth: boolean;
  viasms: boolean;
  viaemail: boolean;
  smfswsDefaultWsRole: null;
  recordTime: number;
}

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
type EntityValue = string | number | boolean | symbol | null;

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

export interface ProcessBindings {
  onLoad: (
    process: ProcessDefinition,
    context: { selectedRecords: Record<string, EntityData>; tabId: string },
  ) => Promise<any>;
  onProcess: (
    process: ProcessDefinition,
    params: { recordIds: string[]; windowId: string; entityName: string; buttonValue: any; [param: string]: unknown },
  ) => Promise<any>;
  metadata: Record<string, unknown>;
}

export interface ProcessInfo {
  loadFunction: string;
  searchKey: string;
  clientSideValidation: string;
  _entityName: string;
  id: string;
  name: string;
  javaClassName: string;
  parameters: Array<{
    defaultValue: string;
    id: string;
    name: string;
  }>;
}

export type ListOption = { id: string; label: string; value: string };

export type ProcessParameter = {
  defaultValue: string;
  id: string;
  name: string;
  refList: Array<ListOption>;
} & Record<string, string>;

export type ProcessParameters = Record<string, ProcessParameter>;

export interface ProcessDefinition extends Record<string, unknown> {
  id: string;
  name: string;
  javaClassName: string;
  parameters: ProcessParameters;
  onLoad: string;
  onProcess: string;
}
