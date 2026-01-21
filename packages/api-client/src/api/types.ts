/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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
  operator: "and" | "or";
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
  operationType?: "fetch" | "add" | "update" | "remove";
  isSorting?: boolean;
  isImplicitFilterApplied?: boolean;
  operator?: "and" | "or";
  parentId?: string;
}

export interface DatasourceOptions {
  columns?: string[];
  sortBy?: string;
  criteria?: Criteria[];
  operationType?: "fetch" | "add" | "update" | "remove";
  isSorting?: boolean;
  isImplicitFilterApplied?: boolean;
  operator?: "and" | "or";
  pageSize?: number;
  headers?: Record<string, string>;
  tabId?: string;
  windowId?: string;
  language?: string;
  parentId?: string | number;
  referencedTableId?: string;
}

export interface ProcessAction extends Record<string, unknown> {
  id: string;
  name: string;
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
  readOnlyReason?: "FIELD_READONLY" | "READONLY_LOGIC" | "ACCESS_LEVEL";
}

export interface RefListField {
  id: string;
  label: string;
  value: string;
  color?: string;
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
  refList: RefListField[];
  referencedEntity: string;
  referencedWindowId: string;
  referencedTabId: string;
  displayLogicExpression?: string;
  readOnlyLogicExpression?: string;
  isReadOnly: boolean;
  isDisplayed: boolean;
  gridPosition?: number;
  sequenceNumber: number;
  isUpdatable: boolean;
  description: string;
  helpComment: string;
  processDefinition?: ProcessDefinition;
  processAction?: ProcessAction;
  etmetaCustomjs?: string | null;
  isActive: boolean;
  gridDisplayLogic: string;
  /**
   * Indicates if this field contains the parent record ID in a hierarchical tab structure.
   * Used during URL state recovery to traverse from child records up to parent records.
   * The field KEY (not the value of this property) is used to access the parent record ID
   * from the child record's data (e.g., record["cBpartnerId"]).
   */
  isParentRecordProperty?: boolean;
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
  column?: Record<string, string>;
  referencedWindowId?: string;
  [key: string]: unknown;
  fieldId?: string;
  customJs?: string | null;
  referencedTabId: string | null;
}

export interface MappedField {
  name: string;
  label: string;
  type: FieldType;
  referencedTable?: string;
  required?: boolean;
}

export enum FieldType {
  TEXT = "text",
  NUMBER = "number",
  DATE = "date",
  BOOLEAN = "boolean",
  SELECT = "select",
  SEARCH = "search",
  TABLEDIR = "tabledir",
  QUANTITY = "quantity",
  LIST = "list",
  BUTTON = "button",
  WINDOW = "window",
  DATETIME = "datetime",
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

export enum UIPattern {
  READ_ONLY = "RO",
  EDIT_ONLY = "SR",
  EDIT_AND_DELETE_ONLY = "ED",
  STANDARD = "STD",
}

export interface Tab {
  uIPattern: UIPattern;
  window: string;
  name: string;
  title: string;
  parentColumns: string[];
  displayLogicExpression?: string;
  displayLogic?: string;
  id: string;
  table: string;
  entityName: string;
  fields: Record<string, Field>;
  tabLevel: number;
  _identifier: string;
  records: Record<string, never>;
  hqlfilterclause: string;
  hqlwhereclause: string;
  sQLWhereClause: string;
  hqlorderbyclause?: string;
  sQLOrderByClause?: string;
  module: string;
  parentTabId?: string;
  table$_identifier?: string;
  window$_identifier?: string;
  tableTree?: boolean | string;
  obuiappShowCloneButton?: boolean;
  obuiappCloneChildren?: boolean;
  process?: string;
  process$_identifier?: string;
}

export interface WindowMetadata {
  id: string;
  name: string;
  superClass?: string;
  properties: WindowMetadataProperties;
  tabs: Tab[];
  window$_identifier: string;
  windowType?: string;
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
  processUrl?: string;
  isModalProcess?: boolean;
}

export enum Action {
  OBUIAPPOpenView = "OBUIAPP_OpenView",
  OBUIAPPProcess = "OBUIAPP_Process",
  P = "P",
  R = "R",
  W = "W",
  X = "X",
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
  M = "M",
  Q = "Q",
  T = "T",
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
  icon: string;
  seqno: number;
  description: string;
  etmetaActionHandler: string;
  nameKey: string;
  buttonType: string;
  section: string;
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
export type EntityValue = string | number | boolean | symbol | null;

export interface EntityData {
  [key: EntityKey]: EntityValue;
}

export enum FormMode {
  NEW = "NEW",
  EDIT = "EDIT",
}

// New independent mode for session operations
export const SessionMode = {
  SETSESSION: "SETSESSION",
} as const;

export type SessionModeType = (typeof SessionMode)[keyof typeof SessionMode];

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
  noteCount: number;
  attachmentCount?: number;
  _readOnly?: boolean;
}

export interface ProcessBindings {
  onLoad: (
    process: ProcessDefinition,
    context: { selectedRecords: Record<string, EntityData>; tabId: string }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ) => Promise<any>;
  onProcess: (
    process: ProcessDefinition,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    params: { recordIds: string[]; windowId: string; entityName: string; buttonValue: any; [param: string]: unknown }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
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

export type ListOption = { id: string; label: string; value: string; active?: boolean };

export type ProcessParameter = {
  defaultValue: string;
  mandatory: boolean;
  id: string;
  name: string;
  refList: Array<ListOption>;
  readOnlyLogicExpression?: string;
  reference: string;
  window?: WindowMetadata; // This type is for process that have defined a window reference
  selector?: SelectorInfo;
} & Record<string, string>;

export interface SelectorInfo extends Record<string, unknown> {
  datasourceName?: string;
  response?: Array<{ id: string; name: string; [key: string]: unknown }>;
}

export type ProcessParameters = Record<string, ProcessParameter>;

export interface ProcessDefinition extends Record<string, unknown> {
  id: string;
  name: string;
  javaClassName: string;
  parameters: ProcessParameters;
  onLoad: string;
  onProcess: string;
}

export interface Labels {
  [key: string]: string;
}

export interface CreateLocationRequest {
  address1: string;
  address2?: string;
  postal?: string;
  city: string;
  countryId: string;
  regionId?: string;
  [key: string]: unknown;
}

export interface LocationResponse {
  id: string;
  _identifier: string;
  address1: string;
  address2?: string;
  postal?: string;
  city: string;
  countryId: string;
  regionId?: string;
}

export interface LocationApiResponse {
  success: boolean;
  data: LocationResponse;
}

export interface LocationErrorResponse {
  success: false;
  error: string;
  status: number;
}

export interface LinkedItemCategory {
  adTabId: string;
  adWindowId: string;
  columnName: string;
  fullElementName: string;
  tableName: string;
  total: string;
}

export interface LinkedItem {
  adMenuName: string;
  adTabId: string;
  adWindowId: string;
  id: string;
  name: string;
}

export interface LinkedItemsResponse {
  usedByLinkData: LinkedItemCategory[] | LinkedItem[];
}

export interface FetchCategoriesParams {
  windowId: string;
  entityName: string;
  recordId: string;
}

export interface FetchLinkedItemsParams {
  windowId: string;
  entityName: string;
  recordId: string;
  adTabId: string;
  tableName: string;
  columnName: string;
}

export interface Note {
  id: string;
  note: string;
  createdBy: string;
  createdBy$_identifier: string;
  creationDate: string;
}

export interface FetchNoteCountParams {
  windowId: string;
  tabId: string;
  recordId: string;
}

export interface FetchNotesParams {
  tableId: string;
  recordId: string;
}

export interface CreateNoteParams {
  recordId: string;
  tableId: string;
  content: string;
}

// Attachment types
export interface Attachment {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdBy$_identifier: string;
  creationDate: string;
  fileSize?: number;
  mimeType?: string;
}

export interface FetchAttachmentsParams {
  tabId: string;
  recordId: string;
}

export interface CreateAttachmentParams {
  recordId: string;
  tabId: string;
  file: File;
  description?: string;
  inpDocumentOrg: string;
}

export interface EditAttachmentParams {
  attachmentId: string;
  tabId: string;
  recordId: string;
  description: string;
}

export interface DeleteAttachmentParams {
  attachmentId?: string;
  tabId: string;
  recordId: string;
}

export interface DownloadAttachmentParams {
  attachmentId: string;
  tabId: string;
  recordId: string;
}

export interface DownloadAllAttachmentsParams {
  tabId: string;
  recordId: string;
}

// Response structure for success/failure
export interface DatasourceResponse {
  response: {
    data?: Note;
    status: number;
    error?: { message: string };
  };
}
