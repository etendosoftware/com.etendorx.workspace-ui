export declare global {
  export interface Models {
    processes: Process[];
    window: Window;
  }

  export interface Process {
    actionHandler: string;
    clientSideValidation?: string;
    dynamicColumns: DynamicColumns;
    onLoadFunction?: string;
    popup: boolean;
    processId: string;
    viewProperties: ProcessViewProperties;
  }

  export interface DynamicColumns {}

  export interface ProcessViewProperties {
    fields: PurpleField[];
  }

  export interface PurpleField {
    datasource?: PurpleDatasource;
    defaultPopupFilterField?: DisplayField;
    defaultValue?: string;
    displayedRowsNumber?: number;
    displayField?: DisplayField;
    extraSearchFields?: string[];
    itemIds?: string[];
    length?: number;
    name: string;
    onChangeFunction?: string;
    onGridLoadFunction?: string;
    outFields?: DynamicColumns;
    outHiddenInputPrefix?: string;
    paramId?: string;
    pickListFields?: Field[];
    popupTextMatchStyle?: string;
    readOnlyIf?: boolean;
    required?: boolean;
    sectionExpanded?: boolean;
    selectorDefinitionId?: string;
    selectorGridFields?: Field[];
    showSelectorGrid?: boolean;
    showTitle?: boolean;
    startRow?: boolean;
    targetEntity?: string;
    textMatchStyle?: string;
    title: string;
    type: string;
    valueField?: KeyProperty;
    valueMap?: PurpleValueMap;
    viewProperties?: FieldViewProperties;
    width?: Width;
  }

  export interface PurpleDatasource {
    createClassName: string;
    dataURL: string;
    fields: DataSourceField[];
    requestProperties: PurpleRequestProperties;
  }

  export interface DataSourceField {
    additional?: boolean;
    name: string;
    primaryKey?: boolean;
    type?: string;
    valueMap?: { [key: string]: string };
  }

  export interface PurpleRequestProperties {
    params: PurpleParams;
  }

  export interface PurpleParams {
    _extraProperties?: string;
    columnName: string;
    Constants_FIELDSEPARATOR: ConstantsFIELDSEPARATOR;
    Constants_IDENTIFIER: DisplayField;
    IsSelectorItem: string;
  }

  export enum ConstantsFIELDSEPARATOR {
    Empty = '$',
  }

  export enum DisplayField {
    CreatedByIdentifier = 'createdBy$_identifier',
    Identifier = '_identifier',
    Name = 'name',
    ProductName = 'productName',
    UpdatedByIdentifier = 'updatedBy$_identifier',
  }

  export interface Field {
    filterOnKeypress?: boolean;
    name: string;
    showHover?: boolean;
    title: string;
    type: Type;
  }

  export enum Type {
    ID10 = '_id_10',
    ID12 = '_id_12',
    ID20 = '_id_20',
    ID800008 = '_id_800008',
    IDC632F1CFF5A1453EB28BDF44A70478F8 = '_id_C632F1CFF5A1453EB28BDF44A70478F8',
    Text = 'text',
  }

  export enum KeyProperty {
    ID = 'id',
  }

  export interface PurpleValueMap {
    '--'?: string;
    AP?: string;
    B?: string;
    CL?: string;
    CO?: string;
    CR?: string;
    I?: string;
    O?: string;
    PDOUT?: string;
    PO?: string;
    PR?: string;
    RA?: string;
    RC?: string;
    RCIN?: string;
    RE?: string;
    RJ?: string;
    VO?: string;
    XL?: string;
  }

  export interface FieldViewProperties {
    allowAdd?: boolean;
    allowDelete?: boolean;
    dataSourceProperties: DataSource;
    entity: string;
    fields: FluffyField[];
    gridProperties: GridProperties;
    mapping250: string;
    moduleId: string;
    newFn?: string;
    selectionType: string;
    showSelect: boolean;
    standardProperties: StandardProperties;
    statusBarFields: unknown[];
    tabId: string;
    tabTitle: string;
  }

  export interface DataSource {
    createClassName: ClassName;
    dataURL: string;
    fields: DataSourceField[];
    requestProperties: DataSourceRequestProperties;
  }

  export enum ClassName {
    OBPickAndExecuteDataSource = 'OBPickAndExecuteDataSource',
    OBViewDataSource = 'OBViewDataSource',
  }

  export interface DataSourceRequestProperties {
    params: FluffyParams;
  }

  export interface FluffyParams {
    _className: ClassName;
    _extraProperties?: string;
    Constants_FIELDSEPARATOR: ConstantsFIELDSEPARATOR;
    Constants_IDENTIFIER: DisplayField;
    tableId?: string;
  }

  export interface FluffyField {
    colSpan?: number;
    columnName?: string;
    datasource?: FluffyDatasource;
    datatouce?: DatatouceClass;
    datosource?: DatatouceClass;
    defaultPopupFilterField?: string;
    defaultValue?: string;
    disabled?: boolean;
    displayField?: DisplayField;
    extraSearchFields?: string[];
    firstFocusedField?: boolean;
    gridProps?: GridProps;
    hasDefaultValue?: boolean;
    id?: string;
    inFields?: InField[];
    inpColumnName?: string;
    itemIds?: ItemID[];
    length?: number;
    name: string;
    onChangeFunction?: string;
    outFields?: unknown[] | PurpleOutFields;
    outHiddenInputPrefix?: string;
    overflow?: string;
    personalizable?: boolean;
    pickListFields?: Field[];
    popupTextMatchStyle?: string;
    refColumnName?: string;
    required?: boolean;
    searchUrl?: string;
    selectorDefinitionId?: string;
    selectorGridFields?: Field[];
    sessionProperty?: boolean;
    showSelectorGrid?: boolean;
    targetEntity?: string;
    textMatchStyle?: string;
    title?: string;
    type: string;
    updatable?: boolean;
    validationFn?: string;
    valueField?: string;
    width?: number;
  }

  export interface FluffyDatasource {
    createClassName: string;
    dataURL: string;
    fields: TentacledField[];
    requestProperties: DatatouceRequestProperties;
  }

  export interface TentacledField {
    additional?: boolean;
    name: string;
    primaryKey?: boolean;
    type?: string;
    valueMap?: FluffyValueMap;
  }

  export interface FluffyValueMap {
    '1'?: string;
    '2'?: string;
    '3'?: string;
    '4'?: string;
    '5'?: string;
    AC?: string;
    B?: string;
    C?: string;
    K?: string;
    LI?: string;
    MO?: string;
    N?: string;
    OC?: string;
    OP?: string;
    OR?: string;
    P?: string;
    PE?: string;
    PR?: string;
    PU?: string;
    R?: string;
    RE?: string;
    RO?: string;
    S?: string;
    TE?: string;
    TI?: string;
    W?: string;
    WA?: string;
    Y?: string;
    YE?: string;
  }

  export interface DatatouceRequestProperties {
    params: TentacledParams;
  }

  export interface TentacledParams {
    _extraProperties?: string;
    adTabId: string;
    columnName: string;
    Constants_FIELDSEPARATOR: ConstantsFIELDSEPARATOR;
    Constants_IDENTIFIER: DisplayField;
    IsSelectorItem: string;
    targetProperty: string;
  }

  export interface DatatouceClass {
    createClassName: string;
    dataURL: string;
    fields: DataSourceField[];
    requestProperties: DatatouceRequestProperties;
  }

  export interface GridProps {
    autoExpand?: boolean;
    autoFitWidth?: boolean;
    canFilter: boolean;
    canGroupBy?: boolean;
    canSort: boolean;
    cellAlign?: CellAlign;
    criteriaDisplayField?: OrderByClause;
    criteriaField?: string;
    displaylength?: number;
    displayProperty?: OrderByClause;
    editorProps?: EditorProps;
    editorType?: string;
    filterEditorProperties?: GridPropsFilterEditorProperties;
    filterOnKeypress?: boolean;
    fkField?: boolean;
    length?: number;
    selectOnClick?: boolean;
    showHover: boolean;
    showIf?: string;
    sort: number;
    width?: Width;
    yesNo?: boolean;
  }

  export enum CellAlign {
    Left = 'left',
  }

  export enum OrderByClause {
    DocumentNo = 'documentNo',
    LineNo = 'lineNo',
    Name = 'name',
  }

  export interface EditorProps {
    displayField?: DisplayField;
    showLabel?: boolean;
    showTitle?: boolean;
    valueField?: KeyProperty;
  }

  export interface GridPropsFilterEditorProperties {
    keyProperty: KeyProperty;
  }

  export enum Width {
    Empty = '*',
    The50 = '50%',
  }

  export interface InField {
    columnName: string;
    parameterName: string;
  }

  export enum ItemID {
    CreatedBy = 'createdBy',
    CreationDate = 'creationDate',
    Updated = 'updated',
    UpdatedBy = 'updatedBy',
  }

  export interface PurpleOutFields {
    currency?: NetListPrice;
    netListPrice?: NetListPrice;
    priceLimit?: NetListPrice;
    standardPrice?: NetListPrice;
    uOM?: NetListPrice;
  }

  export interface NetListPrice {
    fieldName: string;
    formatType: string;
    suffix: string;
  }

  export interface GridProperties {
    alias: string;
    allowSummaryFunctions: boolean;
    filterClause: boolean;
    filterName?: string;
    orderByClause?: string;
    sortField?: string;
  }

  export interface StandardProperties {
    inpkeyColumnId?: string;
    inpKeyName?: string;
    inpTabId: string;
    inpTableId: string;
    inpwindowId: string;
    keyColumnName?: string;
    keyProperty?: KeyProperty;
    keyPropertyType?: KeyPropertyType;
  }

  export enum KeyPropertyType {
    ID13 = '_id_13',
  }

  export interface Window {
    multiDocumentEnabled: boolean;
    viewProperties: WindowViewProperties;
    windowId: string;
  }

  export interface WindowViewProperties {
    actionToolbarButtons: ActionToolbarButton[];
    askToCloneChildren: boolean;
    buttonsHaveSessionLogic: boolean;
    createViewStructure: ViewPropertiesCreateViewStructure[];
    dataSource: DataSource;
    entity: string;
    fields: IndecentField[];
    hasChildTabs: boolean;
    iconToolbarButtons: IconToolbarButton[];
    initialPropertyToColumns: InitialPropertyToColumn[];
    isDeleteableTable: boolean;
    mapping250: string;
    moduleId: string;
    notesDataSource: NotesDataSource;
    showCloneButton: boolean;
    showParentButtons: boolean;
    standardProperties: StandardProperties;
    statusBarFields: string[];
    tabId: string;
    tabTitle: string;
    viewGrid: ViewGrid;
    windowId: string;
  }

  export interface ActionToolbarButton {
    autosave: boolean;
    command: string;
    id: string;
    labelValue?: LabelValue;
    modal?: boolean;
    multiRecord?: boolean;
    newDefinition?: boolean;
    obManualURL: string;
    processId: string;
    property: string;
    title: string;
    uiPattern?: string;
    windowId?: string;
  }

  export interface LabelValue {
    '--': string;
    AP: string;
    CL: string;
    CO: string;
    PO: string;
    PR: string;
    RA: string;
    RC: string;
    RE: string;
    RJ: string;
    TR: string;
    VO: string;
    XL: string;
  }

  export interface ViewPropertiesCreateViewStructure {
    actionToolbarButtons: ActionToolbarButton[];
    askToCloneChildren: boolean;
    buttonsHaveSessionLogic: boolean;
    createViewStructure?: CreateViewStructureCreateViewStructure[];
    dataSource: PurpleDataSource;
    entity: string;
    fields: IndigoField[];
    hasChildTabs?: boolean;
    iconToolbarButtons: unknown[];
    initialPropertyToColumns: InitialPropertyToColumn[];
    isDeleteableTable: boolean;
    mapping250: string;
    moduleId: string;
    notesDataSource: NotesDataSource;
    parentProperty: string;
    showCloneButton: boolean;
    showParentButtons: boolean;
    standardProperties: StandardProperties;
    statusBarFields: string[];
    tabId: string;
    tabTitle: string;
    viewForm?: ViewForm;
    viewGrid: ViewGrid;
  }

  export interface CreateViewStructureCreateViewStructure {
    actionToolbarButtons: unknown[];
    askToCloneChildren: boolean;
    buttonsHaveSessionLogic: boolean;
    dataSource: DataSource;
    entity: string;
    fields: StickyField[];
    iconToolbarButtons: unknown[];
    initialPropertyToColumns: InitialPropertyToColumn[];
    isDeleteableTable: boolean;
    mapping250: string;
    moduleId: string;
    notesDataSource: NotesDataSource;
    parentProperty: string;
    sessionAttributesNames?: string[];
    showCloneButton: boolean;
    showParentButtons: boolean;
    standardProperties: StandardProperties;
    statusBarFields: unknown[];
    tabId: string;
    tabTitle: string;
    viewGrid: ViewGrid;
  }

  export interface StickyField {
    columnName?: string;
    datasource?: DatatouceClass;
    defaultPopupFilterField?: DisplayField;
    defaultValue?: string;
    disabled?: boolean;
    displayed?: boolean;
    displayField?: DisplayField;
    extraSearchFields?: string[];
    gridProps?: GridProps;
    hasDefaultValue?: boolean;
    id?: string;
    inFields?: InField[];
    inpColumnName?: string;
    itemIds?: ItemID[];
    length?: number;
    name: string;
    optionDataSource?: DatatouceClass;
    outFields?: unknown[] | FluffyOutFields;
    outHiddenInputPrefix?: string;
    overflow?: string;
    personalizable?: boolean;
    pickListFields?: Field[];
    popupTextMatchStyle?: string;
    refColumnName?: string;
    required?: boolean;
    searchUrl?: string;
    selectorDefinitionId?: string;
    selectorGridFields?: PurpleSelectorGridField[];
    sessionProperty?: boolean;
    showSelectorGrid?: boolean;
    startRow?: boolean;
    targetEntity?: string;
    textMatchStyle?: string;
    title?: string;
    type: string;
    updatable?: boolean;
    valueField?: string;
    width?: number;
  }

  export interface FluffyOutFields {
    netListPrice?: NetListPrice;
    priceLimit?: NetListPrice;
    product$uOM$id?: NetListPrice;
    productPrice$priceListVersion$priceList$currency$id?: NetListPrice;
    standardPrice?: NetListPrice;
  }

  export interface PurpleSelectorGridField {
    canFilter?: boolean;
    displayField?: string;
    filterEditorProperties?: SelectorGridFieldFilterEditorProperties;
    filterEditorType?: string;
    filterOnKeypress?: boolean;
    name: string;
    required?: boolean;
    showHover: boolean;
    title: string;
    type: string;
    valueMap?: SelectorGridFieldValueMap;
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
    dbColumn: string;
    inpColumn: string;
    property: string;
    sessionProperty?: boolean;
    type: string;
  }

  export interface NotesDataSource {
    createClassName: string;
    dataURL: string;
    fields: DataSourceField[];
    potentiallyShared?: boolean;
    requestProperties: NotesDataSourceRequestProperties;
  }

  export interface NotesDataSourceRequestProperties {
    params: StickyParams;
  }

  export interface StickyParams {
    Constants_FIELDSEPARATOR: ConstantsFIELDSEPARATOR;
    Constants_IDENTIFIER: DisplayField;
  }

  export interface ViewGrid {
    allowSummaryFunctions: boolean;
    filterClause: boolean;
    filterName?: string;
    orderByClause?: OrderByClause;
    requiredGridProperties: string[];
    sortField?: string;
    uiPattern: UIPattern;
  }

  export enum UIPattern {
    Ro = 'RO',
    Std = 'STD',
  }

  export interface PurpleDataSource {
    createClassName: ClassName;
    dataURL: string;
    fields: DataSourceField[];
    potentiallyShared?: boolean;
    requestProperties: DataSourceRequestProperties;
  }

  export interface IndigoField {
    colSpan?: number;
    columnName?: string;
    datasource?: DatatouceClass;
    defaultPopupFilterField?: string;
    defaultValue?: string;
    disabled?: boolean;
    displayed?: boolean;
    displayField?: DisplayField;
    extraSearchFields?: string[];
    firstFocusedField?: boolean;
    gridProps?: GridProps;
    hasDefaultValue?: boolean;
    id?: string;
    inFields?: InField[];
    inpColumnName?: string;
    itemIds?: string[];
    length?: number;
    name: string;
    outFields?: unknown[] | FluffyOutFields;
    outHiddenInputPrefix?: string;
    overflow?: string;
    personalizable?: boolean;
    pickListFields?: Field[];
    popupTextMatchStyle?: string;
    redrawOnChange?: boolean;
    refColumnName?: string;
    required?: boolean;
    rowSpan?: number;
    searchUrl?: string;
    sectionExpanded?: boolean;
    selectorDefinitionId?: string;
    selectorGridFields?: PurpleSelectorGridField[];
    sessionProperty?: boolean;
    showSelectorGrid?: boolean;
    targetEntity?: string;
    textMatchStyle?: string;
    title?: string;
    type: string;
    updatable?: boolean;
    valueField?: string;
    width?: number;
  }

  export interface ViewForm {
    clone?: string;
  }

  export interface IndecentField {
    description: unknown;
    clientClass?: string;
    columnName?: string;
    defaultPopupFilterField?: string;
    defaultValue?: string;
    disabled?: boolean;
    displayed?: boolean;
    displayField?: DisplayField;
    editorType?: string;
    extraSearchFields?: string[];
    firstFocusedField?: boolean;
    gridProps?: GridProps;
    hasDefaultValue?: boolean;
    id?: string;
    inFields?: InField[];
    inpColumnName?: string;
    isComputedColumn?: boolean;
    itemIds?: string[];
    length?: number;
    name: string;
    outFields?: unknown[] | DynamicColumns;
    outHiddenInputPrefix?: string;
    overflow?: string;
    personalizable?: boolean;
    pickListFields?: Field[];
    popupTextMatchStyle?: string;
    redrawOnChange?: boolean;
    refColumnName?: string;
    required?: boolean;
    searchUrl?: string;
    sectionExpanded?: boolean;
    selectorDefinitionId?: string;
    selectorGridFields?: FluffySelectorGridField[];
    sessionProperty?: boolean;
    showSelectorGrid?: boolean;
    targetEntity?: string;
    textMatchStyle?: string;
    title?: string;
    type: string;
    updatable?: boolean;
    valueField?: string;
    width?: number;
  }

  export interface FluffySelectorGridField {
    displayField?: string;
    filterOnKeypress?: boolean;
    name: string;
    showHover: boolean;
    title: string;
    type: string;
    valueMap?: SelectorGridFieldValueMap;
  }

  export interface IconToolbarButton {
    buttonType: string;
    isProcessDefinition: boolean;
    prompt: string;
  }
}
