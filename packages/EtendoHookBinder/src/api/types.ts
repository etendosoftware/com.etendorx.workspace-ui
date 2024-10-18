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

export interface FieldD {
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

const etendoField = {
  "fieldName": "documentAction",
  "_identifier": "Process Order - Header - Sales Order",
  "_entityName": "ADField",
  "$ref": "ADField/1083",
  "id": "1083",
  "client": "0",
  "client$_identifier": "System",
  "organization": "0",
  "organization$_identifier": "*",
  "active": true,
  "creationDate": "2024-10-02T14:05:46-03:00",
  "createdBy": "0",
  "createdBy$_identifier": "System",
  "updated": "2024-10-02T14:05:46-03:00",
  "updatedBy": "0",
  "updatedBy$_identifier": "System",
  "name": "Process Order",
  "description": "Process Order",
  "helpComment": "Process Order",
  "centralMaintenance": true,
  "tab": "186",
  "tab$_identifier": "Header - Sales Order",
  "column": {
      "_identifier": "DocAction",
      "_entityName": "ADColumn",
      "$ref": "ADColumn/2171",
      "id": "2171",
      "client": "0",
      "client$_identifier": "System",
      "organization": "0",
      "organization$_identifier": "*",
      "active": true,
      "creationDate": "2024-10-02T14:05:44-03:00",
      "updated": "2024-10-02T14:05:44-03:00",
      "createdBy": "0",
      "createdBy$_identifier": "System",
      "updatedBy": "0",
      "updatedBy$_identifier": "System",
      "name": "Document Action",
      "description": "A means of changing the transaction status of the document.",
      "helpComment": "\nYou find the current status in the Document Status field. The options are listed in a popup",
      "dBColumnName": "DocAction",
      "table": "259",
      "table$_identifier": "C_Order",
      "reference": "28",
      "reference$_identifier": "Button",
      "referenceSearchKey": "FF80818130217A35013021A672400035",
      "referenceSearchKey$_identifier": "Order_Document Action",
      "validation": null,
      "length": 60,
      "defaultValue": "CO",
      "keyColumn": false,
      "linkToParentColumn": false,
      "mandatory": true,
      "updatable": true,
      "readOnlyLogic": null,
      "identifier": false,
      "sequenceNumber": null,
      "translation": false,
      "displayEncription": false,
      "calloutFunction": null,
      "valueFormat": null,
      "minValue": null,
      "maxValue": null,
      "filterColumn": false,
      "applicationElement": "287",
      "applicationElement$_identifier": "DocAction - Document Action",
      "process": null,
      "storedInSession": false,
      "secondaryKey": false,
      "deencryptable": false,
      "callout": null,
      "developmentStatus": "RE",
      "module": "0",
      "module$_identifier": "Core - 24.2.6 - English (USA)",
      "position": 12,
      "transient": false,
      "transientCondition": null,
      "isautosave": true,
      "validateOnNew": true,
      "excludeAudit": false,
      "imageSizeValuesAction": "N",
      "imageWidth": null,
      "imageHeight": null,
      "useAutomaticSequence": false,
      "sqllogic": null,
      "entityAlias": null,
      "allowSorting": true,
      "oBUIAPPProcess": "8DF818E471394C01A6546A4AB7F5E529",
      "oBUIAPPProcess$_identifier": "Process Orders",
      "allowFiltering": true,
      "allowedCrossOrganizationReference": false,
      "childPropertyInParentEntity": true,
      "recordTime": 1728058907847
  },
  "column$_identifier": "DocAction",
  "property": null,
  "ignoreInWad": false,
  "fieldGroup": "101",
  "fieldGroup$_identifier": "Status",
  "displayed": true,
  "displayLogic": "@DocStatus@!'CL'&@DocStatus@!'VO'",
  "displayedLength": 23,
  "readOnly": false,
  "sequenceNumber": 336,
  "recordSortNo": null,
  "displayOnSameLine": false,
  "displayFieldOnly": false,
  "displayEncription": false,
  "showInGridView": false,
  "isFirstFocusedField": false,
  "module": "0",
  "module$_identifier": "Core - 24.2.6 - English (USA)",
  "gridPosition": null,
  "startinoddcolumn": false,
  "startnewline": false,
  "shownInStatusBar": false,
  "onChangeFunction": null,
  "clientclass": null,
  "displaylogicgrid": null,
  "obuiappColspan": null,
  "obuiappRowspan": null,
  "obuiappValidator": null,
  "oBUIAPPShowSummary": false,
  "obuiappSummaryfn": null,
  "obuiselOutfield": null,
  "obuiappDefaultExpression": null,
  "displayLogicEvaluatedInTheServer": null,
  "recordTime": 1728058907847,
  "checkonsave": true,
  "editableField": true,
  "columnName": "documentAction",
  "isMandatory": true,
  "inpName": "docaction",
  "isParentRecordProperty": false,
  "process": {
      "_identifier": "Process Orders",
      "_entityName": "OBUIAPP_Process",
      "$ref": "OBUIAPP_Process/8DF818E471394C01A6546A4AB7F5E529",
      "id": "8DF818E471394C01A6546A4AB7F5E529",
      "client": "0",
      "client$_identifier": "System",
      "organization": "0",
      "organization$_identifier": "*",
      "active": true,
      "creationDate": "2024-10-02T14:05:50-03:00",
      "createdBy": "0",
      "createdBy$_identifier": "System",
      "updated": "2024-10-02T14:05:50-03:00",
      "updatedBy": "0",
      "updatedBy$_identifier": "System",
      "searchKey": "DJOBS_ProcessOrders",
      "name": "Process Orders",
      "description": null,
      "helpComment": null,
      "dataAccessLevel": "3",
      "javaClassName": "com.smf.jobs.defaults.ProcessOrders",
      "background": false,
      "module": "3C37500DD9174B91B1CCF88FC09AFB9D",
      "module$_identifier": "Default Jobs - 1.0.0 - English (USA)",
      "uIPattern": "A",
      "isMultiRecord": true,
      "requiresExplicitAccessPermission": false,
      "clientSideValidation": null,
      "isgridlegacy": false,
      "loadFunction": "OB.Jobs.ProcessOrders.onLoad",
      "canAddRecordsToASelector": false,
      "refreshFunction": null,
      "smfmuScan": null,
      "recordTime": 1728058907847,
      "parameters": [
          {
              "_identifier": "Document Action",
              "_entityName": "OBUIAPP_Parameter",
              "$ref": "OBUIAPP_Parameter/893D14431B1A4607BEE141A7C7A98EFE",
              "id": "893D14431B1A4607BEE141A7C7A98EFE",
              "client": "0",
              "client$_identifier": "System",
              "organization": "0",
              "organization$_identifier": "*",
              "active": true,
              "creationDate": "2024-10-02T14:05:50-03:00",
              "createdBy": "0",
              "createdBy$_identifier": "System",
              "updated": "2024-10-02T14:05:50-03:00",
              "updatedBy": "0",
              "updatedBy$_identifier": "System",
              "module": "3C37500DD9174B91B1CCF88FC09AFB9D",
              "module$_identifier": "Default Jobs - 1.0.0 - English (USA)",
              "name": "Document Action",
              "description": null,
              "helpComment": null,
              "sequenceNumber": 10,
              "reference": "17",
              "reference$_identifier": "List",
              "referenceSearchKey": "FF80818130217A35013021A672400035",
              "referenceSearchKey$_identifier": "Order_Document Action",
              "dBColumnName": "DocAction",
              "centralMaintenance": true,
              "length": 60,
              "mandatory": true,
              "defaultValue": null,
              "applicationElement": "287",
              "applicationElement$_identifier": "DocAction - Document Action",
              "fixed": false,
              "fixedValue": null,
              "obkmoWidgetClass": null,
              "evaluateFixedValue": false,
              "obuiappProcess": "8DF818E471394C01A6546A4AB7F5E529",
              "obuiappProcess$_identifier": "Process Orders",
              "startinnewline": false,
              "displayLogic": null,
              "validation": null,
              "fieldGroup": null,
              "readOnlyLogic": null,
              "attachmentMethod": null,
              "numColumn": null,
              "onChangeFunction": null,
              "tab": null,
              "displayedRows": 5,
              "showInDescription": false,
              "displayTitle": true,
              "propertyPath": null,
              "onGridLoadFunction": null,
              "recordTime": 1728058907847,
              "refList": [
                  {
                      "id": "062015A2BD78490A982D7575778E8777",
                      "label": "Process",
                      "value": "PR"
                  },
                  {
                      "id": "09270627DC864FF9B4EC671005235D88",
                      "label": "Transfer",
                      "value": "TR"
                  },
                  {
                      "id": "137FAE2E0B2E41CB901067BC77E37EE7",
                      "label": "Book",
                      "value": "CO"
                  },
                  {
                      "id": "146E194904144669A27BEDDB0D79C47B",
                      "label": "Post",
                      "value": "PO"
                  },
                  {
                      "id": "83E7ED16C71F43558DA8404D21D0B63B",
                      "label": "Approve",
                      "value": "AP"
                  },
                  {
                      "id": "9D453B94D05B4C719DDD896DE80C8B5A",
                      "label": "Unlock",
                      "value": "XL"
                  },
                  {
                      "id": "A27B7159B661436A9A6C282BAFA4EA62",
                      "label": "<None>",
                      "value": "--"
                  },
                  {
                      "id": "A2FBBAAA0EB14047894A6E5BACDF6899",
                      "label": "Void",
                      "value": "RC"
                  },
                  {
                      "id": "B06D9380FA25434EB5EDCAF44368F347",
                      "label": "Reject",
                      "value": "RJ"
                  },
                  {
                      "id": "C102A96C20C44BA6BAAD322E999633A3",
                      "label": "Reactivate",
                      "value": "RE"
                  },
                  {
                      "id": "C31C73D8912A42068D903FC5322876D9",
                      "label": "Void",
                      "value": "VO"
                  },
                  {
                      "id": "F2554D08E74F4361AAE811EA5CDDCEB6",
                      "label": "Reverse - Accrual",
                      "value": "RA"
                  },
                  {
                      "id": "FA50DEFEDC4E4EFE82BA5BF71C55E53F",
                      "label": "Close",
                      "value": "CL"
                  }
              ]
          }
      ]
  }
}

export type Field = typeof etendoField & FieldD;

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

export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'search' | 'tabledir' | 'quantity';

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
