// To parse this data:
//
//   import { Convert, Models } from "./file";
//
//   const models = Convert.toModels(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Models {
    processes: Process[];
    window:    Window;
}

export interface Process {
    actionHandler:         string;
    clientSideValidation?: string;
    dynamicColumns:        DynamicColumns;
    onLoadFunction?:       string;
    popup:                 boolean;
    processId:             string;
    viewProperties:        ProcessViewProperties;
}

export interface DynamicColumns {
}

export interface ProcessViewProperties {
    fields: PurpleField[];
}

export interface PurpleField {
    datasource?:              PurpleDatasource;
    defaultPopupFilterField?: DisplayField;
    defaultValue?:            string;
    displayedRowsNumber?:     number;
    displayField?:            DisplayField;
    extraSearchFields?:       string[];
    itemIds?:                 string[];
    length?:                  number;
    name:                     string;
    onChangeFunction?:        string;
    onGridLoadFunction?:      string;
    outFields?:               DynamicColumns;
    outHiddenInputPrefix?:    string;
    paramId?:                 string;
    pickListFields?:          Field[];
    popupTextMatchStyle?:     string;
    readOnlyIf?:              boolean;
    required?:                boolean;
    sectionExpanded?:         boolean;
    selectorDefinitionId?:    string;
    selectorGridFields?:      Field[];
    showSelectorGrid?:        boolean;
    showTitle?:               boolean;
    startRow?:                boolean;
    targetEntity?:            string;
    textMatchStyle?:          string;
    title:                    string;
    type:                     string;
    valueField?:              KeyProperty;
    valueMap?:                PurpleValueMap;
    viewProperties?:          FieldViewProperties;
    width?:                   Width;
}

export interface PurpleDatasource {
    createClassName:   string;
    dataURL:           string;
    fields:            DataSourceField[];
    requestProperties: PurpleRequestProperties;
}

export interface DataSourceField {
    additional?: boolean;
    name:        string;
    primaryKey?: boolean;
    type?:       string;
    valueMap?:   { [key: string]: string };
}

export interface PurpleRequestProperties {
    params: PurpleParams;
}

export interface PurpleParams {
    _extraProperties?:        string;
    columnName:               string;
    Constants_FIELDSEPARATOR: ConstantsFIELDSEPARATOR;
    Constants_IDENTIFIER:     DisplayField;
    IsSelectorItem:           string;
}

export enum ConstantsFIELDSEPARATOR {
    Empty = "$",
}

export enum DisplayField {
    CreatedByIdentifier = "createdBy$_identifier",
    Identifier = "_identifier",
    Name = "name",
    ProductName = "productName",
    UpdatedByIdentifier = "updatedBy$_identifier",
}

export interface Field {
    filterOnKeypress?: boolean;
    name:              string;
    showHover?:        boolean;
    title:             string;
    type:              Type;
}

export enum Type {
    ID10 = "_id_10",
    ID12 = "_id_12",
    ID20 = "_id_20",
    ID800008 = "_id_800008",
    IDC632F1CFF5A1453EB28BDF44A70478F8 = "_id_C632F1CFF5A1453EB28BDF44A70478F8",
    Text = "text",
}

export enum KeyProperty {
    ID = "id",
}

export interface PurpleValueMap {
    "--"?:  string;
    AP?:    string;
    B?:     string;
    CL?:    string;
    CO?:    string;
    CR?:    string;
    I?:     string;
    O?:     string;
    PDOUT?: string;
    PO?:    string;
    PR?:    string;
    RA?:    string;
    RC?:    string;
    RCIN?:  string;
    RE?:    string;
    RJ?:    string;
    VO?:    string;
    XL?:    string;
}

export interface FieldViewProperties {
    allowAdd?:            boolean;
    allowDelete?:         boolean;
    dataSourceProperties: DataSource;
    entity:               string;
    fields:               FluffyField[];
    gridProperties:       GridProperties;
    mapping250:           string;
    moduleId:             string;
    newFn?:               string;
    selectionType:        string;
    showSelect:           boolean;
    standardProperties:   StandardProperties;
    statusBarFields:      any[];
    tabId:                string;
    tabTitle:             string;
}

export interface DataSource {
    createClassName:   ClassName;
    dataURL:           string;
    fields:            DataSourceField[];
    requestProperties: DataSourceRequestProperties;
}

export enum ClassName {
    OBPickAndExecuteDataSource = "OBPickAndExecuteDataSource",
    OBViewDataSource = "OBViewDataSource",
}

export interface DataSourceRequestProperties {
    params: FluffyParams;
}

export interface FluffyParams {
    _className:               ClassName;
    _extraProperties?:        string;
    Constants_FIELDSEPARATOR: ConstantsFIELDSEPARATOR;
    Constants_IDENTIFIER:     DisplayField;
    tableId?:                 string;
}

export interface FluffyField {
    colSpan?:                 number;
    columnName?:              string;
    datasource?:              FluffyDatasource;
    datatouce?:               DatatouceClass;
    datosource?:              DatatouceClass;
    defaultPopupFilterField?: string;
    defaultValue?:            string;
    disabled?:                boolean;
    displayField?:            DisplayField;
    extraSearchFields?:       string[];
    firstFocusedField?:       boolean;
    gridProps?:               GridProps;
    hasDefaultValue?:         boolean;
    id?:                      string;
    inFields?:                InField[];
    inpColumnName?:           string;
    itemIds?:                 ItemID[];
    length?:                  number;
    name:                     string;
    onChangeFunction?:        string;
    outFields?:               any[] | PurpleOutFields;
    outHiddenInputPrefix?:    string;
    overflow?:                string;
    personalizable?:          boolean;
    pickListFields?:          Field[];
    popupTextMatchStyle?:     string;
    refColumnName?:           string;
    required?:                boolean;
    searchUrl?:               string;
    selectorDefinitionId?:    string;
    selectorGridFields?:      Field[];
    sessionProperty?:         boolean;
    showSelectorGrid?:        boolean;
    targetEntity?:            string;
    textMatchStyle?:          string;
    title?:                   string;
    type:                     string;
    updatable?:               boolean;
    validationFn?:            string;
    valueField?:              string;
    width?:                   number;
}

export interface FluffyDatasource {
    createClassName:   string;
    dataURL:           string;
    fields:            TentacledField[];
    requestProperties: DatatouceRequestProperties;
}

export interface TentacledField {
    additional?: boolean;
    name:        string;
    primaryKey?: boolean;
    type?:       string;
    valueMap?:   FluffyValueMap;
}

export interface FluffyValueMap {
    "1"?: string;
    "2"?: string;
    "3"?: string;
    "4"?: string;
    "5"?: string;
    AC?:  string;
    B?:   string;
    C?:   string;
    K?:   string;
    LI?:  string;
    MO?:  string;
    N?:   string;
    OC?:  string;
    OP?:  string;
    OR?:  string;
    P?:   string;
    PE?:  string;
    PR?:  string;
    PU?:  string;
    R?:   string;
    RE?:  string;
    RO?:  string;
    S?:   string;
    TE?:  string;
    TI?:  string;
    W?:   string;
    WA?:  string;
    Y?:   string;
    YE?:  string;
}

export interface DatatouceRequestProperties {
    params: TentacledParams;
}

export interface TentacledParams {
    _extraProperties?:        string;
    adTabId:                  string;
    columnName:               string;
    Constants_FIELDSEPARATOR: ConstantsFIELDSEPARATOR;
    Constants_IDENTIFIER:     DisplayField;
    IsSelectorItem:           string;
    targetProperty:           string;
}

export interface DatatouceClass {
    createClassName:   string;
    dataURL:           string;
    fields:            DataSourceField[];
    requestProperties: DatatouceRequestProperties;
}

export interface GridProps {
    autoExpand?:             boolean;
    autoFitWidth?:           boolean;
    canFilter:               boolean;
    canGroupBy?:             boolean;
    canSort:                 boolean;
    cellAlign?:              CellAlign;
    criteriaDisplayField?:   OrderByClause;
    criteriaField?:          string;
    displaylength?:          number;
    displayProperty?:        OrderByClause;
    editorProps?:            EditorProps;
    editorType?:             string;
    filterEditorProperties?: GridPropsFilterEditorProperties;
    filterOnKeypress?:       boolean;
    fkField?:                boolean;
    length?:                 number;
    selectOnClick?:          boolean;
    showHover:               boolean;
    showIf?:                 string;
    sort:                    number;
    width?:                  Width;
    yesNo?:                  boolean;
}

export enum CellAlign {
    Left = "left",
}

export enum OrderByClause {
    DocumentNo = "documentNo",
    LineNo = "lineNo",
    Name = "name",
}

export interface EditorProps {
    displayField?: DisplayField;
    showLabel?:    boolean;
    showTitle?:    boolean;
    valueField?:   KeyProperty;
}

export interface GridPropsFilterEditorProperties {
    keyProperty: KeyProperty;
}

export enum Width {
    Empty = "*",
    The50 = "50%",
}

export interface InField {
    columnName:    string;
    parameterName: string;
}

export enum ItemID {
    CreatedBy = "createdBy",
    CreationDate = "creationDate",
    Updated = "updated",
    UpdatedBy = "updatedBy",
}

export interface PurpleOutFields {
    currency?:      NetListPrice;
    netListPrice?:  NetListPrice;
    priceLimit?:    NetListPrice;
    standardPrice?: NetListPrice;
    uOM?:           NetListPrice;
}

export interface NetListPrice {
    fieldName:  string;
    formatType: string;
    suffix:     string;
}

export interface GridProperties {
    alias:                 string;
    allowSummaryFunctions: boolean;
    filterClause:          boolean;
    filterName?:           string;
    orderByClause?:        string;
    sortField?:            string;
}

export interface StandardProperties {
    inpkeyColumnId?:  string;
    inpKeyName?:      string;
    inpTabId:         string;
    inpTableId:       string;
    inpwindowId:      string;
    keyColumnName?:   string;
    keyProperty?:     KeyProperty;
    keyPropertyType?: KeyPropertyType;
}

export enum KeyPropertyType {
    ID13 = "_id_13",
}

export interface Window {
    multiDocumentEnabled: boolean;
    viewProperties:       WindowViewProperties;
    windowId:             string;
}

export interface WindowViewProperties {
    actionToolbarButtons:     ActionToolbarButton[];
    askToCloneChildren:       boolean;
    buttonsHaveSessionLogic:  boolean;
    createViewStructure:      ViewPropertiesCreateViewStructure[];
    dataSource:               DataSource;
    entity:                   string;
    fields:                   IndecentField[];
    hasChildTabs:             boolean;
    iconToolbarButtons:       IconToolbarButton[];
    initialPropertyToColumns: InitialPropertyToColumn[];
    isDeleteableTable:        boolean;
    mapping250:               string;
    moduleId:                 string;
    notesDataSource:          NotesDataSource;
    showCloneButton:          boolean;
    showParentButtons:        boolean;
    standardProperties:       StandardProperties;
    statusBarFields:          string[];
    tabId:                    string;
    tabTitle:                 string;
    viewGrid:                 ViewGrid;
    windowId:                 string;
}

export interface ActionToolbarButton {
    autosave:       boolean;
    command:        string;
    id:             string;
    labelValue?:    LabelValue;
    modal?:         boolean;
    multiRecord?:   boolean;
    newDefinition?: boolean;
    obManualURL:    string;
    processId:      string;
    property:       string;
    title:          string;
    uiPattern?:     string;
    windowId?:      string;
}

export interface LabelValue {
    "--": string;
    AP:   string;
    CL:   string;
    CO:   string;
    PO:   string;
    PR:   string;
    RA:   string;
    RC:   string;
    RE:   string;
    RJ:   string;
    TR:   string;
    VO:   string;
    XL:   string;
}

export interface ViewPropertiesCreateViewStructure {
    actionToolbarButtons:     ActionToolbarButton[];
    askToCloneChildren:       boolean;
    buttonsHaveSessionLogic:  boolean;
    createViewStructure?:     CreateViewStructureCreateViewStructure[];
    dataSource:               PurpleDataSource;
    entity:                   string;
    fields:                   IndigoField[];
    hasChildTabs?:            boolean;
    iconToolbarButtons:       any[];
    initialPropertyToColumns: InitialPropertyToColumn[];
    isDeleteableTable:        boolean;
    mapping250:               string;
    moduleId:                 string;
    notesDataSource:          NotesDataSource;
    parentProperty:           string;
    showCloneButton:          boolean;
    showParentButtons:        boolean;
    standardProperties:       StandardProperties;
    statusBarFields:          string[];
    tabId:                    string;
    tabTitle:                 string;
    viewForm?:                ViewForm;
    viewGrid:                 ViewGrid;
}

export interface CreateViewStructureCreateViewStructure {
    actionToolbarButtons:     any[];
    askToCloneChildren:       boolean;
    buttonsHaveSessionLogic:  boolean;
    dataSource:               DataSource;
    entity:                   string;
    fields:                   StickyField[];
    iconToolbarButtons:       any[];
    initialPropertyToColumns: InitialPropertyToColumn[];
    isDeleteableTable:        boolean;
    mapping250:               string;
    moduleId:                 string;
    notesDataSource:          NotesDataSource;
    parentProperty:           string;
    sessionAttributesNames?:  string[];
    showCloneButton:          boolean;
    showParentButtons:        boolean;
    standardProperties:       StandardProperties;
    statusBarFields:          any[];
    tabId:                    string;
    tabTitle:                 string;
    viewGrid:                 ViewGrid;
}

export interface StickyField {
    columnName?:              string;
    datasource?:              DatatouceClass;
    defaultPopupFilterField?: DisplayField;
    defaultValue?:            string;
    disabled?:                boolean;
    displayed?:               boolean;
    displayField?:            DisplayField;
    extraSearchFields?:       string[];
    gridProps?:               GridProps;
    hasDefaultValue?:         boolean;
    id?:                      string;
    inFields?:                InField[];
    inpColumnName?:           string;
    itemIds?:                 ItemID[];
    length?:                  number;
    name:                     string;
    optionDataSource?:        DatatouceClass;
    outFields?:               any[] | FluffyOutFields;
    outHiddenInputPrefix?:    string;
    overflow?:                string;
    personalizable?:          boolean;
    pickListFields?:          Field[];
    popupTextMatchStyle?:     string;
    refColumnName?:           string;
    required?:                boolean;
    searchUrl?:               string;
    selectorDefinitionId?:    string;
    selectorGridFields?:      PurpleSelectorGridField[];
    sessionProperty?:         boolean;
    showSelectorGrid?:        boolean;
    startRow?:                boolean;
    targetEntity?:            string;
    textMatchStyle?:          string;
    title?:                   string;
    type:                     string;
    updatable?:               boolean;
    valueField?:              string;
    width?:                   number;
}

export interface FluffyOutFields {
    netListPrice?:                                        NetListPrice;
    priceLimit?:                                          NetListPrice;
    product$uOM$id?:                                      NetListPrice;
    productPrice$priceListVersion$priceList$currency$id?: NetListPrice;
    standardPrice?:                                       NetListPrice;
}

export interface PurpleSelectorGridField {
    canFilter?:              boolean;
    displayField?:           string;
    filterEditorProperties?: SelectorGridFieldFilterEditorProperties;
    filterEditorType?:       string;
    filterOnKeypress?:       boolean;
    name:                    string;
    required?:               boolean;
    showHover:               boolean;
    title:                   string;
    type:                    string;
    valueMap?:               SelectorGridFieldValueMap;
}

export interface SelectorGridFieldFilterEditorProperties {
    entity: string;
}

export interface SelectorGridFieldValueMap {
    OC: string;
    OP: string;
    OR: string;
}

export interface InitialPropertyToColumn {
    dbColumn:         string;
    inpColumn:        string;
    property:         string;
    sessionProperty?: boolean;
    type:             string;
}

export interface NotesDataSource {
    createClassName:    string;
    dataURL:            string;
    fields:             DataSourceField[];
    potentiallyShared?: boolean;
    requestProperties:  NotesDataSourceRequestProperties;
}

export interface NotesDataSourceRequestProperties {
    params: StickyParams;
}

export interface StickyParams {
    Constants_FIELDSEPARATOR: ConstantsFIELDSEPARATOR;
    Constants_IDENTIFIER:     DisplayField;
}

export interface ViewGrid {
    allowSummaryFunctions:  boolean;
    filterClause:           boolean;
    filterName?:            string;
    orderByClause?:         OrderByClause;
    requiredGridProperties: string[];
    sortField?:             string;
    uiPattern:              UIPattern;
}

export enum UIPattern {
    Ro = "RO",
    Std = "STD",
}

export interface PurpleDataSource {
    createClassName:    ClassName;
    dataURL:            string;
    fields:             DataSourceField[];
    potentiallyShared?: boolean;
    requestProperties:  DataSourceRequestProperties;
}

export interface IndigoField {
    colSpan?:                 number;
    columnName?:              string;
    datasource?:              DatatouceClass;
    defaultPopupFilterField?: string;
    defaultValue?:            string;
    disabled?:                boolean;
    displayed?:               boolean;
    displayField?:            DisplayField;
    extraSearchFields?:       string[];
    firstFocusedField?:       boolean;
    gridProps?:               GridProps;
    hasDefaultValue?:         boolean;
    id?:                      string;
    inFields?:                InField[];
    inpColumnName?:           string;
    itemIds?:                 string[];
    length?:                  number;
    name:                     string;
    outFields?:               any[] | FluffyOutFields;
    outHiddenInputPrefix?:    string;
    overflow?:                string;
    personalizable?:          boolean;
    pickListFields?:          Field[];
    popupTextMatchStyle?:     string;
    redrawOnChange?:          boolean;
    refColumnName?:           string;
    required?:                boolean;
    rowSpan?:                 number;
    searchUrl?:               string;
    sectionExpanded?:         boolean;
    selectorDefinitionId?:    string;
    selectorGridFields?:      PurpleSelectorGridField[];
    sessionProperty?:         boolean;
    showSelectorGrid?:        boolean;
    targetEntity?:            string;
    textMatchStyle?:          string;
    title?:                   string;
    type:                     string;
    updatable?:               boolean;
    valueField?:              string;
    width?:                   number;
}

export interface ViewForm {
    clone?: string;
}

export interface IndecentField {
    description: any;
    clientClass?:             string;
    columnName?:              string;
    defaultPopupFilterField?: string;
    defaultValue?:            string;
    disabled?:                boolean;
    displayed?:               boolean;
    displayField?:            DisplayField;
    editorType?:              string;
    extraSearchFields?:       string[];
    firstFocusedField?:       boolean;
    gridProps?:               GridProps;
    hasDefaultValue?:         boolean;
    id?:                      string;
    inFields?:                InField[];
    inpColumnName?:           string;
    isComputedColumn?:        boolean;
    itemIds?:                 string[];
    length?:                  number;
    name:                     string;
    outFields?:               any[] | DynamicColumns;
    outHiddenInputPrefix?:    string;
    overflow?:                string;
    personalizable?:          boolean;
    pickListFields?:          Field[];
    popupTextMatchStyle?:     string;
    redrawOnChange?:          boolean;
    refColumnName?:           string;
    required?:                boolean;
    searchUrl?:               string;
    sectionExpanded?:         boolean;
    selectorDefinitionId?:    string;
    selectorGridFields?:      FluffySelectorGridField[];
    sessionProperty?:         boolean;
    showSelectorGrid?:        boolean;
    targetEntity?:            string;
    textMatchStyle?:          string;
    title?:                   string;
    type:                     string;
    updatable?:               boolean;
    valueField?:              string;
    width?:                   number;
}

export interface FluffySelectorGridField {
    displayField?:     string;
    filterOnKeypress?: boolean;
    name:              string;
    showHover:         boolean;
    title:             string;
    type:              string;
    valueMap?:         SelectorGridFieldValueMap;
}

export interface IconToolbarButton {
    buttonType:          string;
    isProcessDefinition: boolean;
    prompt:              string;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toModels(json: string): Models {
        return cast(JSON.parse(json), r("Models"));
    }

    public static modelsToJson(value: Models): string {
        return JSON.stringify(uncast(value, r("Models")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "Models": o([
        { json: "processes", js: "processes", typ: a(r("Process")) },
        { json: "window", js: "window", typ: r("Window") },
    ], false),
    "Process": o([
        { json: "actionHandler", js: "actionHandler", typ: "" },
        { json: "clientSideValidation", js: "clientSideValidation", typ: u(undefined, "") },
        { json: "dynamicColumns", js: "dynamicColumns", typ: r("DynamicColumns") },
        { json: "onLoadFunction", js: "onLoadFunction", typ: u(undefined, "") },
        { json: "popup", js: "popup", typ: true },
        { json: "processId", js: "processId", typ: "" },
        { json: "viewProperties", js: "viewProperties", typ: r("ProcessViewProperties") },
    ], false),
    "DynamicColumns": o([
    ], false),
    "ProcessViewProperties": o([
        { json: "fields", js: "fields", typ: a(r("PurpleField")) },
    ], false),
    "PurpleField": o([
        { json: "datasource", js: "datasource", typ: u(undefined, r("PurpleDatasource")) },
        { json: "defaultPopupFilterField", js: "defaultPopupFilterField", typ: u(undefined, r("DisplayField")) },
        { json: "defaultValue", js: "defaultValue", typ: u(undefined, "") },
        { json: "displayedRowsNumber", js: "displayedRowsNumber", typ: u(undefined, 0) },
        { json: "displayField", js: "displayField", typ: u(undefined, r("DisplayField")) },
        { json: "extraSearchFields", js: "extraSearchFields", typ: u(undefined, a("")) },
        { json: "itemIds", js: "itemIds", typ: u(undefined, a("")) },
        { json: "length", js: "length", typ: u(undefined, 0) },
        { json: "name", js: "name", typ: "" },
        { json: "onChangeFunction", js: "onChangeFunction", typ: u(undefined, "") },
        { json: "onGridLoadFunction", js: "onGridLoadFunction", typ: u(undefined, "") },
        { json: "outFields", js: "outFields", typ: u(undefined, r("DynamicColumns")) },
        { json: "outHiddenInputPrefix", js: "outHiddenInputPrefix", typ: u(undefined, "") },
        { json: "paramId", js: "paramId", typ: u(undefined, "") },
        { json: "pickListFields", js: "pickListFields", typ: u(undefined, a(r("Field"))) },
        { json: "popupTextMatchStyle", js: "popupTextMatchStyle", typ: u(undefined, "") },
        { json: "readOnlyIf", js: "readOnlyIf", typ: u(undefined, true) },
        { json: "required", js: "required", typ: u(undefined, true) },
        { json: "sectionExpanded", js: "sectionExpanded", typ: u(undefined, true) },
        { json: "selectorDefinitionId", js: "selectorDefinitionId", typ: u(undefined, "") },
        { json: "selectorGridFields", js: "selectorGridFields", typ: u(undefined, a(r("Field"))) },
        { json: "showSelectorGrid", js: "showSelectorGrid", typ: u(undefined, true) },
        { json: "showTitle", js: "showTitle", typ: u(undefined, true) },
        { json: "startRow", js: "startRow", typ: u(undefined, true) },
        { json: "targetEntity", js: "targetEntity", typ: u(undefined, "") },
        { json: "textMatchStyle", js: "textMatchStyle", typ: u(undefined, "") },
        { json: "title", js: "title", typ: "" },
        { json: "type", js: "type", typ: "" },
        { json: "valueField", js: "valueField", typ: u(undefined, r("KeyProperty")) },
        { json: "valueMap", js: "valueMap", typ: u(undefined, r("PurpleValueMap")) },
        { json: "viewProperties", js: "viewProperties", typ: u(undefined, r("FieldViewProperties")) },
        { json: "width", js: "width", typ: u(undefined, r("Width")) },
    ], false),
    "PurpleDatasource": o([
        { json: "createClassName", js: "createClassName", typ: "" },
        { json: "dataURL", js: "dataURL", typ: "" },
        { json: "fields", js: "fields", typ: a(r("DataSourceField")) },
        { json: "requestProperties", js: "requestProperties", typ: r("PurpleRequestProperties") },
    ], false),
    "DataSourceField": o([
        { json: "additional", js: "additional", typ: u(undefined, true) },
        { json: "name", js: "name", typ: "" },
        { json: "primaryKey", js: "primaryKey", typ: u(undefined, true) },
        { json: "type", js: "type", typ: u(undefined, "") },
        { json: "valueMap", js: "valueMap", typ: u(undefined, m("")) },
    ], false),
    "PurpleRequestProperties": o([
        { json: "params", js: "params", typ: r("PurpleParams") },
    ], false),
    "PurpleParams": o([
        { json: "_extraProperties", js: "_extraProperties", typ: u(undefined, "") },
        { json: "columnName", js: "columnName", typ: "" },
        { json: "Constants_FIELDSEPARATOR", js: "Constants_FIELDSEPARATOR", typ: r("ConstantsFIELDSEPARATOR") },
        { json: "Constants_IDENTIFIER", js: "Constants_IDENTIFIER", typ: r("DisplayField") },
        { json: "IsSelectorItem", js: "IsSelectorItem", typ: "" },
    ], false),
    "Field": o([
        { json: "filterOnKeypress", js: "filterOnKeypress", typ: u(undefined, true) },
        { json: "name", js: "name", typ: "" },
        { json: "showHover", js: "showHover", typ: u(undefined, true) },
        { json: "title", js: "title", typ: "" },
        { json: "type", js: "type", typ: r("Type") },
    ], false),
    "PurpleValueMap": o([
        { json: "--", js: "--", typ: u(undefined, "") },
        { json: "AP", js: "AP", typ: u(undefined, "") },
        { json: "B", js: "B", typ: u(undefined, "") },
        { json: "CL", js: "CL", typ: u(undefined, "") },
        { json: "CO", js: "CO", typ: u(undefined, "") },
        { json: "CR", js: "CR", typ: u(undefined, "") },
        { json: "I", js: "I", typ: u(undefined, "") },
        { json: "O", js: "O", typ: u(undefined, "") },
        { json: "PDOUT", js: "PDOUT", typ: u(undefined, "") },
        { json: "PO", js: "PO", typ: u(undefined, "") },
        { json: "PR", js: "PR", typ: u(undefined, "") },
        { json: "RA", js: "RA", typ: u(undefined, "") },
        { json: "RC", js: "RC", typ: u(undefined, "") },
        { json: "RCIN", js: "RCIN", typ: u(undefined, "") },
        { json: "RE", js: "RE", typ: u(undefined, "") },
        { json: "RJ", js: "RJ", typ: u(undefined, "") },
        { json: "VO", js: "VO", typ: u(undefined, "") },
        { json: "XL", js: "XL", typ: u(undefined, "") },
    ], false),
    "FieldViewProperties": o([
        { json: "allowAdd", js: "allowAdd", typ: u(undefined, true) },
        { json: "allowDelete", js: "allowDelete", typ: u(undefined, true) },
        { json: "dataSourceProperties", js: "dataSourceProperties", typ: r("DataSource") },
        { json: "entity", js: "entity", typ: "" },
        { json: "fields", js: "fields", typ: a(r("FluffyField")) },
        { json: "gridProperties", js: "gridProperties", typ: r("GridProperties") },
        { json: "mapping250", js: "mapping250", typ: "" },
        { json: "moduleId", js: "moduleId", typ: "" },
        { json: "newFn", js: "newFn", typ: u(undefined, "") },
        { json: "selectionType", js: "selectionType", typ: "" },
        { json: "showSelect", js: "showSelect", typ: true },
        { json: "standardProperties", js: "standardProperties", typ: r("StandardProperties") },
        { json: "statusBarFields", js: "statusBarFields", typ: a("any") },
        { json: "tabId", js: "tabId", typ: "" },
        { json: "tabTitle", js: "tabTitle", typ: "" },
    ], false),
    "DataSource": o([
        { json: "createClassName", js: "createClassName", typ: r("ClassName") },
        { json: "dataURL", js: "dataURL", typ: "" },
        { json: "fields", js: "fields", typ: a(r("DataSourceField")) },
        { json: "requestProperties", js: "requestProperties", typ: r("DataSourceRequestProperties") },
    ], false),
    "DataSourceRequestProperties": o([
        { json: "params", js: "params", typ: r("FluffyParams") },
    ], false),
    "FluffyParams": o([
        { json: "_className", js: "_className", typ: r("ClassName") },
        { json: "_extraProperties", js: "_extraProperties", typ: u(undefined, "") },
        { json: "Constants_FIELDSEPARATOR", js: "Constants_FIELDSEPARATOR", typ: r("ConstantsFIELDSEPARATOR") },
        { json: "Constants_IDENTIFIER", js: "Constants_IDENTIFIER", typ: r("DisplayField") },
        { json: "tableId", js: "tableId", typ: u(undefined, "") },
    ], false),
    "FluffyField": o([
        { json: "colSpan", js: "colSpan", typ: u(undefined, 0) },
        { json: "columnName", js: "columnName", typ: u(undefined, "") },
        { json: "datasource", js: "datasource", typ: u(undefined, r("FluffyDatasource")) },
        { json: "datatouce", js: "datatouce", typ: u(undefined, r("DatatouceClass")) },
        { json: "datosource", js: "datosource", typ: u(undefined, r("DatatouceClass")) },
        { json: "defaultPopupFilterField", js: "defaultPopupFilterField", typ: u(undefined, "") },
        { json: "defaultValue", js: "defaultValue", typ: u(undefined, "") },
        { json: "disabled", js: "disabled", typ: u(undefined, true) },
        { json: "displayField", js: "displayField", typ: u(undefined, r("DisplayField")) },
        { json: "extraSearchFields", js: "extraSearchFields", typ: u(undefined, a("")) },
        { json: "firstFocusedField", js: "firstFocusedField", typ: u(undefined, true) },
        { json: "gridProps", js: "gridProps", typ: u(undefined, r("GridProps")) },
        { json: "hasDefaultValue", js: "hasDefaultValue", typ: u(undefined, true) },
        { json: "id", js: "id", typ: u(undefined, "") },
        { json: "inFields", js: "inFields", typ: u(undefined, a(r("InField"))) },
        { json: "inpColumnName", js: "inpColumnName", typ: u(undefined, "") },
        { json: "itemIds", js: "itemIds", typ: u(undefined, a(r("ItemID"))) },
        { json: "length", js: "length", typ: u(undefined, 0) },
        { json: "name", js: "name", typ: "" },
        { json: "onChangeFunction", js: "onChangeFunction", typ: u(undefined, "") },
        { json: "outFields", js: "outFields", typ: u(undefined, u(a("any"), r("PurpleOutFields"))) },
        { json: "outHiddenInputPrefix", js: "outHiddenInputPrefix", typ: u(undefined, "") },
        { json: "overflow", js: "overflow", typ: u(undefined, "") },
        { json: "personalizable", js: "personalizable", typ: u(undefined, true) },
        { json: "pickListFields", js: "pickListFields", typ: u(undefined, a(r("Field"))) },
        { json: "popupTextMatchStyle", js: "popupTextMatchStyle", typ: u(undefined, "") },
        { json: "refColumnName", js: "refColumnName", typ: u(undefined, "") },
        { json: "required", js: "required", typ: u(undefined, true) },
        { json: "searchUrl", js: "searchUrl", typ: u(undefined, "") },
        { json: "selectorDefinitionId", js: "selectorDefinitionId", typ: u(undefined, "") },
        { json: "selectorGridFields", js: "selectorGridFields", typ: u(undefined, a(r("Field"))) },
        { json: "sessionProperty", js: "sessionProperty", typ: u(undefined, true) },
        { json: "showSelectorGrid", js: "showSelectorGrid", typ: u(undefined, true) },
        { json: "targetEntity", js: "targetEntity", typ: u(undefined, "") },
        { json: "textMatchStyle", js: "textMatchStyle", typ: u(undefined, "") },
        { json: "title", js: "title", typ: u(undefined, "") },
        { json: "type", js: "type", typ: "" },
        { json: "updatable", js: "updatable", typ: u(undefined, true) },
        { json: "validationFn", js: "validationFn", typ: u(undefined, "") },
        { json: "valueField", js: "valueField", typ: u(undefined, "") },
        { json: "width", js: "width", typ: u(undefined, 0) },
    ], false),
    "FluffyDatasource": o([
        { json: "createClassName", js: "createClassName", typ: "" },
        { json: "dataURL", js: "dataURL", typ: "" },
        { json: "fields", js: "fields", typ: a(r("TentacledField")) },
        { json: "requestProperties", js: "requestProperties", typ: r("DatatouceRequestProperties") },
    ], false),
    "TentacledField": o([
        { json: "additional", js: "additional", typ: u(undefined, true) },
        { json: "name", js: "name", typ: "" },
        { json: "primaryKey", js: "primaryKey", typ: u(undefined, true) },
        { json: "type", js: "type", typ: u(undefined, "") },
        { json: "valueMap", js: "valueMap", typ: u(undefined, r("FluffyValueMap")) },
    ], false),
    "FluffyValueMap": o([
        { json: "1", js: "1", typ: u(undefined, "") },
        { json: "2", js: "2", typ: u(undefined, "") },
        { json: "3", js: "3", typ: u(undefined, "") },
        { json: "4", js: "4", typ: u(undefined, "") },
        { json: "5", js: "5", typ: u(undefined, "") },
        { json: "AC", js: "AC", typ: u(undefined, "") },
        { json: "B", js: "B", typ: u(undefined, "") },
        { json: "C", js: "C", typ: u(undefined, "") },
        { json: "K", js: "K", typ: u(undefined, "") },
        { json: "LI", js: "LI", typ: u(undefined, "") },
        { json: "MO", js: "MO", typ: u(undefined, "") },
        { json: "N", js: "N", typ: u(undefined, "") },
        { json: "OC", js: "OC", typ: u(undefined, "") },
        { json: "OP", js: "OP", typ: u(undefined, "") },
        { json: "OR", js: "OR", typ: u(undefined, "") },
        { json: "P", js: "P", typ: u(undefined, "") },
        { json: "PE", js: "PE", typ: u(undefined, "") },
        { json: "PR", js: "PR", typ: u(undefined, "") },
        { json: "PU", js: "PU", typ: u(undefined, "") },
        { json: "R", js: "R", typ: u(undefined, "") },
        { json: "RE", js: "RE", typ: u(undefined, "") },
        { json: "RO", js: "RO", typ: u(undefined, "") },
        { json: "S", js: "S", typ: u(undefined, "") },
        { json: "TE", js: "TE", typ: u(undefined, "") },
        { json: "TI", js: "TI", typ: u(undefined, "") },
        { json: "W", js: "W", typ: u(undefined, "") },
        { json: "WA", js: "WA", typ: u(undefined, "") },
        { json: "Y", js: "Y", typ: u(undefined, "") },
        { json: "YE", js: "YE", typ: u(undefined, "") },
    ], false),
    "DatatouceRequestProperties": o([
        { json: "params", js: "params", typ: r("TentacledParams") },
    ], false),
    "TentacledParams": o([
        { json: "_extraProperties", js: "_extraProperties", typ: u(undefined, "") },
        { json: "adTabId", js: "adTabId", typ: "" },
        { json: "columnName", js: "columnName", typ: "" },
        { json: "Constants_FIELDSEPARATOR", js: "Constants_FIELDSEPARATOR", typ: r("ConstantsFIELDSEPARATOR") },
        { json: "Constants_IDENTIFIER", js: "Constants_IDENTIFIER", typ: r("DisplayField") },
        { json: "IsSelectorItem", js: "IsSelectorItem", typ: "" },
        { json: "targetProperty", js: "targetProperty", typ: "" },
    ], false),
    "DatatouceClass": o([
        { json: "createClassName", js: "createClassName", typ: "" },
        { json: "dataURL", js: "dataURL", typ: "" },
        { json: "fields", js: "fields", typ: a(r("DataSourceField")) },
        { json: "requestProperties", js: "requestProperties", typ: r("DatatouceRequestProperties") },
    ], false),
    "GridProps": o([
        { json: "autoExpand", js: "autoExpand", typ: u(undefined, true) },
        { json: "autoFitWidth", js: "autoFitWidth", typ: u(undefined, true) },
        { json: "canFilter", js: "canFilter", typ: true },
        { json: "canGroupBy", js: "canGroupBy", typ: u(undefined, true) },
        { json: "canSort", js: "canSort", typ: true },
        { json: "cellAlign", js: "cellAlign", typ: u(undefined, r("CellAlign")) },
        { json: "criteriaDisplayField", js: "criteriaDisplayField", typ: u(undefined, r("OrderByClause")) },
        { json: "criteriaField", js: "criteriaField", typ: u(undefined, "") },
        { json: "displaylength", js: "displaylength", typ: u(undefined, 0) },
        { json: "displayProperty", js: "displayProperty", typ: u(undefined, r("OrderByClause")) },
        { json: "editorProps", js: "editorProps", typ: u(undefined, r("EditorProps")) },
        { json: "editorType", js: "editorType", typ: u(undefined, "") },
        { json: "filterEditorProperties", js: "filterEditorProperties", typ: u(undefined, r("GridPropsFilterEditorProperties")) },
        { json: "filterOnKeypress", js: "filterOnKeypress", typ: u(undefined, true) },
        { json: "fkField", js: "fkField", typ: u(undefined, true) },
        { json: "length", js: "length", typ: u(undefined, 0) },
        { json: "selectOnClick", js: "selectOnClick", typ: u(undefined, true) },
        { json: "showHover", js: "showHover", typ: true },
        { json: "showIf", js: "showIf", typ: u(undefined, "") },
        { json: "sort", js: "sort", typ: 0 },
        { json: "width", js: "width", typ: u(undefined, r("Width")) },
        { json: "yesNo", js: "yesNo", typ: u(undefined, true) },
    ], false),
    "EditorProps": o([
        { json: "displayField", js: "displayField", typ: u(undefined, r("DisplayField")) },
        { json: "showLabel", js: "showLabel", typ: u(undefined, true) },
        { json: "showTitle", js: "showTitle", typ: u(undefined, true) },
        { json: "valueField", js: "valueField", typ: u(undefined, r("KeyProperty")) },
    ], false),
    "GridPropsFilterEditorProperties": o([
        { json: "keyProperty", js: "keyProperty", typ: r("KeyProperty") },
    ], false),
    "InField": o([
        { json: "columnName", js: "columnName", typ: "" },
        { json: "parameterName", js: "parameterName", typ: "" },
    ], false),
    "PurpleOutFields": o([
        { json: "currency", js: "currency", typ: u(undefined, r("NetListPrice")) },
        { json: "netListPrice", js: "netListPrice", typ: u(undefined, r("NetListPrice")) },
        { json: "priceLimit", js: "priceLimit", typ: u(undefined, r("NetListPrice")) },
        { json: "standardPrice", js: "standardPrice", typ: u(undefined, r("NetListPrice")) },
        { json: "uOM", js: "uOM", typ: u(undefined, r("NetListPrice")) },
    ], false),
    "NetListPrice": o([
        { json: "fieldName", js: "fieldName", typ: "" },
        { json: "formatType", js: "formatType", typ: "" },
        { json: "suffix", js: "suffix", typ: "" },
    ], false),
    "GridProperties": o([
        { json: "alias", js: "alias", typ: "" },
        { json: "allowSummaryFunctions", js: "allowSummaryFunctions", typ: true },
        { json: "filterClause", js: "filterClause", typ: true },
        { json: "filterName", js: "filterName", typ: u(undefined, "") },
        { json: "orderByClause", js: "orderByClause", typ: u(undefined, "") },
        { json: "sortField", js: "sortField", typ: u(undefined, "") },
    ], false),
    "StandardProperties": o([
        { json: "inpkeyColumnId", js: "inpkeyColumnId", typ: u(undefined, "") },
        { json: "inpKeyName", js: "inpKeyName", typ: u(undefined, "") },
        { json: "inpTabId", js: "inpTabId", typ: "" },
        { json: "inpTableId", js: "inpTableId", typ: "" },
        { json: "inpwindowId", js: "inpwindowId", typ: "" },
        { json: "keyColumnName", js: "keyColumnName", typ: u(undefined, "") },
        { json: "keyProperty", js: "keyProperty", typ: u(undefined, r("KeyProperty")) },
        { json: "keyPropertyType", js: "keyPropertyType", typ: u(undefined, r("KeyPropertyType")) },
    ], false),
    "Window": o([
        { json: "multiDocumentEnabled", js: "multiDocumentEnabled", typ: true },
        { json: "viewProperties", js: "viewProperties", typ: r("WindowViewProperties") },
        { json: "windowId", js: "windowId", typ: "" },
    ], false),
    "WindowViewProperties": o([
        { json: "actionToolbarButtons", js: "actionToolbarButtons", typ: a(r("ActionToolbarButton")) },
        { json: "askToCloneChildren", js: "askToCloneChildren", typ: true },
        { json: "buttonsHaveSessionLogic", js: "buttonsHaveSessionLogic", typ: true },
        { json: "createViewStructure", js: "createViewStructure", typ: a(r("ViewPropertiesCreateViewStructure")) },
        { json: "dataSource", js: "dataSource", typ: r("DataSource") },
        { json: "entity", js: "entity", typ: "" },
        { json: "fields", js: "fields", typ: a(r("IndecentField")) },
        { json: "hasChildTabs", js: "hasChildTabs", typ: true },
        { json: "iconToolbarButtons", js: "iconToolbarButtons", typ: a(r("IconToolbarButton")) },
        { json: "initialPropertyToColumns", js: "initialPropertyToColumns", typ: a(r("InitialPropertyToColumn")) },
        { json: "isDeleteableTable", js: "isDeleteableTable", typ: true },
        { json: "mapping250", js: "mapping250", typ: "" },
        { json: "moduleId", js: "moduleId", typ: "" },
        { json: "notesDataSource", js: "notesDataSource", typ: r("NotesDataSource") },
        { json: "showCloneButton", js: "showCloneButton", typ: true },
        { json: "showParentButtons", js: "showParentButtons", typ: true },
        { json: "standardProperties", js: "standardProperties", typ: r("StandardProperties") },
        { json: "statusBarFields", js: "statusBarFields", typ: a("") },
        { json: "tabId", js: "tabId", typ: "" },
        { json: "tabTitle", js: "tabTitle", typ: "" },
        { json: "viewGrid", js: "viewGrid", typ: r("ViewGrid") },
        { json: "windowId", js: "windowId", typ: "" },
    ], false),
    "ActionToolbarButton": o([
        { json: "autosave", js: "autosave", typ: true },
        { json: "command", js: "command", typ: "" },
        { json: "id", js: "id", typ: "" },
        { json: "labelValue", js: "labelValue", typ: u(undefined, r("LabelValue")) },
        { json: "modal", js: "modal", typ: u(undefined, true) },
        { json: "multiRecord", js: "multiRecord", typ: u(undefined, true) },
        { json: "newDefinition", js: "newDefinition", typ: u(undefined, true) },
        { json: "obManualURL", js: "obManualURL", typ: "" },
        { json: "processId", js: "processId", typ: "" },
        { json: "property", js: "property", typ: "" },
        { json: "title", js: "title", typ: "" },
        { json: "uiPattern", js: "uiPattern", typ: u(undefined, "") },
        { json: "windowId", js: "windowId", typ: u(undefined, "") },
    ], false),
    "LabelValue": o([
        { json: "--", js: "--", typ: "" },
        { json: "AP", js: "AP", typ: "" },
        { json: "CL", js: "CL", typ: "" },
        { json: "CO", js: "CO", typ: "" },
        { json: "PO", js: "PO", typ: "" },
        { json: "PR", js: "PR", typ: "" },
        { json: "RA", js: "RA", typ: "" },
        { json: "RC", js: "RC", typ: "" },
        { json: "RE", js: "RE", typ: "" },
        { json: "RJ", js: "RJ", typ: "" },
        { json: "TR", js: "TR", typ: "" },
        { json: "VO", js: "VO", typ: "" },
        { json: "XL", js: "XL", typ: "" },
    ], false),
    "ViewPropertiesCreateViewStructure": o([
        { json: "actionToolbarButtons", js: "actionToolbarButtons", typ: a(r("ActionToolbarButton")) },
        { json: "askToCloneChildren", js: "askToCloneChildren", typ: true },
        { json: "buttonsHaveSessionLogic", js: "buttonsHaveSessionLogic", typ: true },
        { json: "createViewStructure", js: "createViewStructure", typ: u(undefined, a(r("CreateViewStructureCreateViewStructure"))) },
        { json: "dataSource", js: "dataSource", typ: r("PurpleDataSource") },
        { json: "entity", js: "entity", typ: "" },
        { json: "fields", js: "fields", typ: a(r("IndigoField")) },
        { json: "hasChildTabs", js: "hasChildTabs", typ: u(undefined, true) },
        { json: "iconToolbarButtons", js: "iconToolbarButtons", typ: a("any") },
        { json: "initialPropertyToColumns", js: "initialPropertyToColumns", typ: a(r("InitialPropertyToColumn")) },
        { json: "isDeleteableTable", js: "isDeleteableTable", typ: true },
        { json: "mapping250", js: "mapping250", typ: "" },
        { json: "moduleId", js: "moduleId", typ: "" },
        { json: "notesDataSource", js: "notesDataSource", typ: r("NotesDataSource") },
        { json: "parentProperty", js: "parentProperty", typ: "" },
        { json: "showCloneButton", js: "showCloneButton", typ: true },
        { json: "showParentButtons", js: "showParentButtons", typ: true },
        { json: "standardProperties", js: "standardProperties", typ: r("StandardProperties") },
        { json: "statusBarFields", js: "statusBarFields", typ: a("") },
        { json: "tabId", js: "tabId", typ: "" },
        { json: "tabTitle", js: "tabTitle", typ: "" },
        { json: "viewForm", js: "viewForm", typ: u(undefined, r("ViewForm")) },
        { json: "viewGrid", js: "viewGrid", typ: r("ViewGrid") },
    ], false),
    "CreateViewStructureCreateViewStructure": o([
        { json: "actionToolbarButtons", js: "actionToolbarButtons", typ: a("any") },
        { json: "askToCloneChildren", js: "askToCloneChildren", typ: true },
        { json: "buttonsHaveSessionLogic", js: "buttonsHaveSessionLogic", typ: true },
        { json: "dataSource", js: "dataSource", typ: r("DataSource") },
        { json: "entity", js: "entity", typ: "" },
        { json: "fields", js: "fields", typ: a(r("StickyField")) },
        { json: "iconToolbarButtons", js: "iconToolbarButtons", typ: a("any") },
        { json: "initialPropertyToColumns", js: "initialPropertyToColumns", typ: a(r("InitialPropertyToColumn")) },
        { json: "isDeleteableTable", js: "isDeleteableTable", typ: true },
        { json: "mapping250", js: "mapping250", typ: "" },
        { json: "moduleId", js: "moduleId", typ: "" },
        { json: "notesDataSource", js: "notesDataSource", typ: r("NotesDataSource") },
        { json: "parentProperty", js: "parentProperty", typ: "" },
        { json: "sessionAttributesNames", js: "sessionAttributesNames", typ: u(undefined, a("")) },
        { json: "showCloneButton", js: "showCloneButton", typ: true },
        { json: "showParentButtons", js: "showParentButtons", typ: true },
        { json: "standardProperties", js: "standardProperties", typ: r("StandardProperties") },
        { json: "statusBarFields", js: "statusBarFields", typ: a("any") },
        { json: "tabId", js: "tabId", typ: "" },
        { json: "tabTitle", js: "tabTitle", typ: "" },
        { json: "viewGrid", js: "viewGrid", typ: r("ViewGrid") },
    ], false),
    "StickyField": o([
        { json: "columnName", js: "columnName", typ: u(undefined, "") },
        { json: "datasource", js: "datasource", typ: u(undefined, r("DatatouceClass")) },
        { json: "defaultPopupFilterField", js: "defaultPopupFilterField", typ: u(undefined, r("DisplayField")) },
        { json: "defaultValue", js: "defaultValue", typ: u(undefined, "") },
        { json: "disabled", js: "disabled", typ: u(undefined, true) },
        { json: "displayed", js: "displayed", typ: u(undefined, true) },
        { json: "displayField", js: "displayField", typ: u(undefined, r("DisplayField")) },
        { json: "extraSearchFields", js: "extraSearchFields", typ: u(undefined, a("")) },
        { json: "gridProps", js: "gridProps", typ: u(undefined, r("GridProps")) },
        { json: "hasDefaultValue", js: "hasDefaultValue", typ: u(undefined, true) },
        { json: "id", js: "id", typ: u(undefined, "") },
        { json: "inFields", js: "inFields", typ: u(undefined, a(r("InField"))) },
        { json: "inpColumnName", js: "inpColumnName", typ: u(undefined, "") },
        { json: "itemIds", js: "itemIds", typ: u(undefined, a(r("ItemID"))) },
        { json: "length", js: "length", typ: u(undefined, 0) },
        { json: "name", js: "name", typ: "" },
        { json: "optionDataSource", js: "optionDataSource", typ: u(undefined, r("DatatouceClass")) },
        { json: "outFields", js: "outFields", typ: u(undefined, u(a("any"), r("FluffyOutFields"))) },
        { json: "outHiddenInputPrefix", js: "outHiddenInputPrefix", typ: u(undefined, "") },
        { json: "overflow", js: "overflow", typ: u(undefined, "") },
        { json: "personalizable", js: "personalizable", typ: u(undefined, true) },
        { json: "pickListFields", js: "pickListFields", typ: u(undefined, a(r("Field"))) },
        { json: "popupTextMatchStyle", js: "popupTextMatchStyle", typ: u(undefined, "") },
        { json: "refColumnName", js: "refColumnName", typ: u(undefined, "") },
        { json: "required", js: "required", typ: u(undefined, true) },
        { json: "searchUrl", js: "searchUrl", typ: u(undefined, "") },
        { json: "selectorDefinitionId", js: "selectorDefinitionId", typ: u(undefined, "") },
        { json: "selectorGridFields", js: "selectorGridFields", typ: u(undefined, a(r("PurpleSelectorGridField"))) },
        { json: "sessionProperty", js: "sessionProperty", typ: u(undefined, true) },
        { json: "showSelectorGrid", js: "showSelectorGrid", typ: u(undefined, true) },
        { json: "startRow", js: "startRow", typ: u(undefined, true) },
        { json: "targetEntity", js: "targetEntity", typ: u(undefined, "") },
        { json: "textMatchStyle", js: "textMatchStyle", typ: u(undefined, "") },
        { json: "title", js: "title", typ: u(undefined, "") },
        { json: "type", js: "type", typ: "" },
        { json: "updatable", js: "updatable", typ: u(undefined, true) },
        { json: "valueField", js: "valueField", typ: u(undefined, "") },
        { json: "width", js: "width", typ: u(undefined, 0) },
    ], false),
    "FluffyOutFields": o([
        { json: "netListPrice", js: "netListPrice", typ: u(undefined, r("NetListPrice")) },
        { json: "priceLimit", js: "priceLimit", typ: u(undefined, r("NetListPrice")) },
        { json: "product$uOM$id", js: "product$uOM$id", typ: u(undefined, r("NetListPrice")) },
        { json: "productPrice$priceListVersion$priceList$currency$id", js: "productPrice$priceListVersion$priceList$currency$id", typ: u(undefined, r("NetListPrice")) },
        { json: "standardPrice", js: "standardPrice", typ: u(undefined, r("NetListPrice")) },
    ], false),
    "PurpleSelectorGridField": o([
        { json: "canFilter", js: "canFilter", typ: u(undefined, true) },
        { json: "displayField", js: "displayField", typ: u(undefined, "") },
        { json: "filterEditorProperties", js: "filterEditorProperties", typ: u(undefined, r("SelectorGridFieldFilterEditorProperties")) },
        { json: "filterEditorType", js: "filterEditorType", typ: u(undefined, "") },
        { json: "filterOnKeypress", js: "filterOnKeypress", typ: u(undefined, true) },
        { json: "name", js: "name", typ: "" },
        { json: "required", js: "required", typ: u(undefined, true) },
        { json: "showHover", js: "showHover", typ: true },
        { json: "title", js: "title", typ: "" },
        { json: "type", js: "type", typ: "" },
        { json: "valueMap", js: "valueMap", typ: u(undefined, r("SelectorGridFieldValueMap")) },
    ], false),
    "SelectorGridFieldFilterEditorProperties": o([
        { json: "entity", js: "entity", typ: "" },
    ], false),
    "SelectorGridFieldValueMap": o([
        { json: "OC", js: "OC", typ: "" },
        { json: "OP", js: "OP", typ: "" },
        { json: "OR", js: "OR", typ: "" },
    ], false),
    "InitialPropertyToColumn": o([
        { json: "dbColumn", js: "dbColumn", typ: "" },
        { json: "inpColumn", js: "inpColumn", typ: "" },
        { json: "property", js: "property", typ: "" },
        { json: "sessionProperty", js: "sessionProperty", typ: u(undefined, true) },
        { json: "type", js: "type", typ: "" },
    ], false),
    "NotesDataSource": o([
        { json: "createClassName", js: "createClassName", typ: "" },
        { json: "dataURL", js: "dataURL", typ: "" },
        { json: "fields", js: "fields", typ: a(r("DataSourceField")) },
        { json: "potentiallyShared", js: "potentiallyShared", typ: u(undefined, true) },
        { json: "requestProperties", js: "requestProperties", typ: r("NotesDataSourceRequestProperties") },
    ], false),
    "NotesDataSourceRequestProperties": o([
        { json: "params", js: "params", typ: r("StickyParams") },
    ], false),
    "StickyParams": o([
        { json: "Constants_FIELDSEPARATOR", js: "Constants_FIELDSEPARATOR", typ: r("ConstantsFIELDSEPARATOR") },
        { json: "Constants_IDENTIFIER", js: "Constants_IDENTIFIER", typ: r("DisplayField") },
    ], false),
    "ViewGrid": o([
        { json: "allowSummaryFunctions", js: "allowSummaryFunctions", typ: true },
        { json: "filterClause", js: "filterClause", typ: true },
        { json: "filterName", js: "filterName", typ: u(undefined, "") },
        { json: "orderByClause", js: "orderByClause", typ: u(undefined, r("OrderByClause")) },
        { json: "requiredGridProperties", js: "requiredGridProperties", typ: a("") },
        { json: "sortField", js: "sortField", typ: u(undefined, "") },
        { json: "uiPattern", js: "uiPattern", typ: r("UIPattern") },
    ], false),
    "PurpleDataSource": o([
        { json: "createClassName", js: "createClassName", typ: r("ClassName") },
        { json: "dataURL", js: "dataURL", typ: "" },
        { json: "fields", js: "fields", typ: a(r("DataSourceField")) },
        { json: "potentiallyShared", js: "potentiallyShared", typ: u(undefined, true) },
        { json: "requestProperties", js: "requestProperties", typ: r("DataSourceRequestProperties") },
    ], false),
    "IndigoField": o([
        { json: "colSpan", js: "colSpan", typ: u(undefined, 0) },
        { json: "columnName", js: "columnName", typ: u(undefined, "") },
        { json: "datasource", js: "datasource", typ: u(undefined, r("DatatouceClass")) },
        { json: "defaultPopupFilterField", js: "defaultPopupFilterField", typ: u(undefined, "") },
        { json: "defaultValue", js: "defaultValue", typ: u(undefined, "") },
        { json: "disabled", js: "disabled", typ: u(undefined, true) },
        { json: "displayed", js: "displayed", typ: u(undefined, true) },
        { json: "displayField", js: "displayField", typ: u(undefined, r("DisplayField")) },
        { json: "extraSearchFields", js: "extraSearchFields", typ: u(undefined, a("")) },
        { json: "firstFocusedField", js: "firstFocusedField", typ: u(undefined, true) },
        { json: "gridProps", js: "gridProps", typ: u(undefined, r("GridProps")) },
        { json: "hasDefaultValue", js: "hasDefaultValue", typ: u(undefined, true) },
        { json: "id", js: "id", typ: u(undefined, "") },
        { json: "inFields", js: "inFields", typ: u(undefined, a(r("InField"))) },
        { json: "inpColumnName", js: "inpColumnName", typ: u(undefined, "") },
        { json: "itemIds", js: "itemIds", typ: u(undefined, a("")) },
        { json: "length", js: "length", typ: u(undefined, 0) },
        { json: "name", js: "name", typ: "" },
        { json: "outFields", js: "outFields", typ: u(undefined, u(a("any"), r("FluffyOutFields"))) },
        { json: "outHiddenInputPrefix", js: "outHiddenInputPrefix", typ: u(undefined, "") },
        { json: "overflow", js: "overflow", typ: u(undefined, "") },
        { json: "personalizable", js: "personalizable", typ: u(undefined, true) },
        { json: "pickListFields", js: "pickListFields", typ: u(undefined, a(r("Field"))) },
        { json: "popupTextMatchStyle", js: "popupTextMatchStyle", typ: u(undefined, "") },
        { json: "redrawOnChange", js: "redrawOnChange", typ: u(undefined, true) },
        { json: "refColumnName", js: "refColumnName", typ: u(undefined, "") },
        { json: "required", js: "required", typ: u(undefined, true) },
        { json: "rowSpan", js: "rowSpan", typ: u(undefined, 0) },
        { json: "searchUrl", js: "searchUrl", typ: u(undefined, "") },
        { json: "sectionExpanded", js: "sectionExpanded", typ: u(undefined, true) },
        { json: "selectorDefinitionId", js: "selectorDefinitionId", typ: u(undefined, "") },
        { json: "selectorGridFields", js: "selectorGridFields", typ: u(undefined, a(r("PurpleSelectorGridField"))) },
        { json: "sessionProperty", js: "sessionProperty", typ: u(undefined, true) },
        { json: "showSelectorGrid", js: "showSelectorGrid", typ: u(undefined, true) },
        { json: "targetEntity", js: "targetEntity", typ: u(undefined, "") },
        { json: "textMatchStyle", js: "textMatchStyle", typ: u(undefined, "") },
        { json: "title", js: "title", typ: u(undefined, "") },
        { json: "type", js: "type", typ: "" },
        { json: "updatable", js: "updatable", typ: u(undefined, true) },
        { json: "valueField", js: "valueField", typ: u(undefined, "") },
        { json: "width", js: "width", typ: u(undefined, 0) },
    ], false),
    "ViewForm": o([
        { json: "clone", js: "clone", typ: u(undefined, "") },
    ], false),
    "IndecentField": o([
        { json: "clientClass", js: "clientClass", typ: u(undefined, "") },
        { json: "columnName", js: "columnName", typ: u(undefined, "") },
        { json: "defaultPopupFilterField", js: "defaultPopupFilterField", typ: u(undefined, "") },
        { json: "defaultValue", js: "defaultValue", typ: u(undefined, "") },
        { json: "disabled", js: "disabled", typ: u(undefined, true) },
        { json: "displayed", js: "displayed", typ: u(undefined, true) },
        { json: "displayField", js: "displayField", typ: u(undefined, r("DisplayField")) },
        { json: "editorType", js: "editorType", typ: u(undefined, "") },
        { json: "extraSearchFields", js: "extraSearchFields", typ: u(undefined, a("")) },
        { json: "firstFocusedField", js: "firstFocusedField", typ: u(undefined, true) },
        { json: "gridProps", js: "gridProps", typ: u(undefined, r("GridProps")) },
        { json: "hasDefaultValue", js: "hasDefaultValue", typ: u(undefined, true) },
        { json: "id", js: "id", typ: u(undefined, "") },
        { json: "inFields", js: "inFields", typ: u(undefined, a(r("InField"))) },
        { json: "inpColumnName", js: "inpColumnName", typ: u(undefined, "") },
        { json: "isComputedColumn", js: "isComputedColumn", typ: u(undefined, true) },
        { json: "itemIds", js: "itemIds", typ: u(undefined, a("")) },
        { json: "length", js: "length", typ: u(undefined, 0) },
        { json: "name", js: "name", typ: "" },
        { json: "outFields", js: "outFields", typ: u(undefined, u(a("any"), r("DynamicColumns"))) },
        { json: "outHiddenInputPrefix", js: "outHiddenInputPrefix", typ: u(undefined, "") },
        { json: "overflow", js: "overflow", typ: u(undefined, "") },
        { json: "personalizable", js: "personalizable", typ: u(undefined, true) },
        { json: "pickListFields", js: "pickListFields", typ: u(undefined, a(r("Field"))) },
        { json: "popupTextMatchStyle", js: "popupTextMatchStyle", typ: u(undefined, "") },
        { json: "redrawOnChange", js: "redrawOnChange", typ: u(undefined, true) },
        { json: "refColumnName", js: "refColumnName", typ: u(undefined, "") },
        { json: "required", js: "required", typ: u(undefined, true) },
        { json: "searchUrl", js: "searchUrl", typ: u(undefined, "") },
        { json: "sectionExpanded", js: "sectionExpanded", typ: u(undefined, true) },
        { json: "selectorDefinitionId", js: "selectorDefinitionId", typ: u(undefined, "") },
        { json: "selectorGridFields", js: "selectorGridFields", typ: u(undefined, a(r("FluffySelectorGridField"))) },
        { json: "sessionProperty", js: "sessionProperty", typ: u(undefined, true) },
        { json: "showSelectorGrid", js: "showSelectorGrid", typ: u(undefined, true) },
        { json: "targetEntity", js: "targetEntity", typ: u(undefined, "") },
        { json: "textMatchStyle", js: "textMatchStyle", typ: u(undefined, "") },
        { json: "title", js: "title", typ: u(undefined, "") },
        { json: "type", js: "type", typ: "" },
        { json: "updatable", js: "updatable", typ: u(undefined, true) },
        { json: "valueField", js: "valueField", typ: u(undefined, "") },
        { json: "width", js: "width", typ: u(undefined, 0) },
    ], false),
    "FluffySelectorGridField": o([
        { json: "displayField", js: "displayField", typ: u(undefined, "") },
        { json: "filterOnKeypress", js: "filterOnKeypress", typ: u(undefined, true) },
        { json: "name", js: "name", typ: "" },
        { json: "showHover", js: "showHover", typ: true },
        { json: "title", js: "title", typ: "" },
        { json: "type", js: "type", typ: "" },
        { json: "valueMap", js: "valueMap", typ: u(undefined, r("SelectorGridFieldValueMap")) },
    ], false),
    "IconToolbarButton": o([
        { json: "buttonType", js: "buttonType", typ: "" },
        { json: "isProcessDefinition", js: "isProcessDefinition", typ: true },
        { json: "prompt", js: "prompt", typ: "" },
    ], false),
    "ConstantsFIELDSEPARATOR": [
        "$",
    ],
    "DisplayField": [
        "createdBy$_identifier",
        "_identifier",
        "name",
        "productName",
        "updatedBy$_identifier",
    ],
    "Type": [
        "_id_10",
        "_id_12",
        "_id_20",
        "_id_800008",
        "_id_C632F1CFF5A1453EB28BDF44A70478F8",
        "text",
    ],
    "KeyProperty": [
        "id",
    ],
    "ClassName": [
        "OBPickAndExecuteDataSource",
        "OBViewDataSource",
    ],
    "CellAlign": [
        "left",
    ],
    "OrderByClause": [
        "documentNo",
        "lineNo",
        "name",
    ],
    "Width": [
        "*",
        "50%",
    ],
    "ItemID": [
        "createdBy",
        "creationDate",
        "updated",
        "updatedBy",
    ],
    "KeyPropertyType": [
        "_id_13",
    ],
    "UIPattern": [
        "RO",
        "STD",
    ],
};
