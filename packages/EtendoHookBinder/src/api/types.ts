export type WindowId = string;

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

export interface FieldMetadata {
  _identifier: string;
  _entityName: string;
  $ref: string;
  id: string;
  client: string;
  client$_identifier: string;
  organization: string;
  organization$_identifier: string;
  active: boolean;
  creationDate: string;
  createdBy: string;
  createdBy$_identifier: string;
  updated: string;
  updatedBy: string;
  updatedBy$_identifier: string;
  name: string;
  description: string;
  helpComment: string;
  centralMaintenance: boolean;
  tab: string;
  tab$_identifier: string;
  column: ColumnMetadata;
  column$_identifier: string;
  property?: null;
  ignoreInWad: boolean;
  fieldGroup: string;
  fieldGroup$_identifier: string;
  displayed: boolean;
  displayLogic: string;
  displayedLength: number;
  readOnly: boolean;
  sequenceNumber: number;
  recordSortNo?: null;
  displayOnSameLine: boolean;
  displayFieldOnly: boolean;
  displayEncription: boolean;
  showInGridView: boolean;
  isFirstFocusedField: boolean;
  module: string;
  module$_identifier: string;
  gridPosition: number;
  startinoddcolumn: boolean;
  startnewline: boolean;
  shownInStatusBar: boolean;
  onChangeFunction?: null;
  clientclass?: null;
  displaylogicgrid?: null;
  obuiappColspan?: null;
  obuiappRowspan?: null;
  obuiappValidator?: null;
  oBUIAPPShowSummary: boolean;
  obuiappSummaryfn?: null;
  obuiselOutfield?: null;
  obuiappDefaultExpression?: null;
  displayLogicEvaluatedInTheServer?: null;
  recordTime: number;
  checkonsave: boolean;
  editableField: boolean;
  columnName: string;
  isMandatory: boolean;
  inpName: string;
  isParentRecordProperty: boolean;
  fieldName: string;
}

export interface ColumnMetadata {
  _identifier: string;
  _entityName: string;
  $ref: string;
  id: string;
  client: string;
  client$_identifier: string;
  organization: string;
  organization$_identifier: string;
  active: boolean;
  creationDate: string;
  updated: string;
  createdBy: string;
  createdBy$_identifier: string;
  updatedBy: string;
  updatedBy$_identifier: string;
  name: string;
  description: string;
  helpComment: string;
  dBColumnName: string;
  table: string;
  table$_identifier: string;
  reference: string;
  reference$_identifier: string;
  referenceSearchKey?: null;
  validation?: null;
  length: number;
  defaultValue?: null;
  keyColumn: boolean;
  linkToParentColumn: boolean;
  mandatory: boolean;
  updatable: boolean;
  readOnlyLogic?: null;
  identifier: boolean;
  sequenceNumber: number;
  translation: boolean;
  displayEncription: boolean;
  calloutFunction?: null;
  valueFormat?: null;
  minValue?: null;
  maxValue?: null;
  filterColumn: boolean;
  applicationElement: string;
  applicationElement$_identifier: string;
  process?: null;
  storedInSession: boolean;
  secondaryKey: boolean;
  deencryptable: boolean;
  callout?: null;
  developmentStatus: string;
  module: string;
  module$_identifier: string;
  position: number;
  transient: boolean;
  transientCondition?: null;
  isautosave: boolean;
  validateOnNew: boolean;
  excludeAudit: boolean;
  imageSizeValuesAction: string;
  imageWidth?: null;
  imageHeight?: null;
  useAutomaticSequence: boolean;
  sqllogic?: null;
  entityAlias?: null;
  allowSorting: boolean;
  oBUIAPPProcess?: null;
  allowFiltering: boolean;
  allowedCrossOrganizationReference: boolean;
  childPropertyInParentEntity: boolean;
  recordTime: number;
}

export interface Field {
  process: string;
  shownInStatusBar: boolean;
  displayed: boolean;
  startnewline: boolean;
  showInGridView: boolean;
  fieldGroup$_identifier: string;
  fieldGroup: string;
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
  fieldGroup?: string;
  header: string;
  id: string;
  accessorFn: (v: Record<string, unknown>) => unknown;
  columnName: string;
  isMandatory?: boolean;
  name: string;
  reference?: string;
  _identifier: string;
  [key: string]: unknown;
}

export interface MappedField {
  name: string;
  label: string;
  type: FieldType;
  referencedTable?: string;
  required?: boolean;
}

export type FieldType = 'string' | 'text' | 'number' | 'date' | 'boolean' | 'select' | 'tabledir' | 'quantity' | 'list';

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
  name: string;
  title: string;
  parentColumns: string[];
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
  window$_identifier: string;
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

export interface SessionResponse {
  user: {
    id: string;
    name: string;
    username: string;
    defaultRole: string;
    defaultWarehouse: string;
    defaultWarehouse$_identifier: string;
  };
  role: {
    id: string;
    name: string;
  };
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

export interface Warehouse {
  id: string;
  name: string;
}
