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

import {
  MaterialReactTable,
  type MRT_Row,
  useMaterialReactTable,
  type MRT_TableBodyRowProps,
  type MRT_TableInstance,
  type MRT_VisibilityState,
  type MRT_Cell,
  type MRT_Column,
} from "material-react-table";
import type { ColumnFiltersState, SortingState, ExpandedState, Updater } from "@tanstack/react-table";
import { useStyle } from "./styles";
import "./styles/rowDragOver.css";
import type {
  EntityData,
  GridProps,
  Column,
  Field,
  FormInitializationResponse,
  RefListField,
} from "@workspaceui/api-client/src/api/types";
import { FieldType } from "@workspaceui/api-client/src/api/types";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ColumnVisibilityMenu from "../Toolbar/Menus/ColumnVisibilityMenu";
import { useDatasourceContext } from "@/contexts/datasourceContext";
import EmptyState from "./EmptyState";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import useTableSelection from "@/hooks/useTableSelection";
import { ErrorDisplay } from "../ErrorDisplay";
import { useTranslation } from "@/hooks/useTranslation";
import { useTabContext } from "@/contexts/tab";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { REFRESH_TYPES } from "@/utils/toolbar/constants";
import { useSelected } from "@/hooks/useSelected";
import { useWindowContext } from "@/contexts/window";
import { NEW_RECORD_ID } from "@/utils/url/constants";
import { logger } from "@/utils/logger";
import PlusFolderFilledIcon from "../../../ComponentLibrary/src/assets/icons/folder-plus-filled.svg";
import MinusFolderIcon from "../../../ComponentLibrary/src/assets/icons/folder-minus.svg";
import CircleFilledIcon from "../../../ComponentLibrary/src/assets/icons/circle-filled.svg";
import ChevronUp from "../../../ComponentLibrary/src/assets/icons/chevron-up.svg";
import ChevronDown from "../../../ComponentLibrary/src/assets/icons/chevron-down.svg";
import CheckIcon from "../../../ComponentLibrary/src/assets/icons/check.svg";
import { AddAttachmentModal } from "../Form/FormView/Sections/AddAttachmentModal";
import { createAttachment } from "@workspaceui/api-client/src/api/attachments";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import { useTableData } from "@/hooks/table/useTableData";
import { isEmptyObject } from "@/utils/commons";
import { useUserContext } from "@/hooks/useUserContext";
import {
  getDisplayColumnDefOptions,
  getMUITableBodyCellProps,
  getCurrentRowCanExpand,
  getCellTitle,
} from "@/utils/table/utils";
import { processCalloutColumnValues } from "./utils/calloutUtils";
import { ACTION_FORM_INITIALIZATION, MODE_CHANGE } from "@/utils/hooks/useFormInitialization/constants";
import { COLUMN_NAMES } from "./constants";
import { useTableStatePersistenceTab } from "@/hooks/useTableStatePersistenceTab";
import { CellContextMenu } from "./CellContextMenu";
import { HeaderContextMenu, type SummaryType } from "./HeaderContextMenu";
import { RecordCounterBar } from "@workspaceui/componentlibrary/src/components";
import type {
  EditingRowsState,
  InlineEditingContextMenu,
  RowValidationResult,
  EditingRowStateUtils,
  EditingRowData,
  SaveResult,
  ValidationError,
} from "./types/inlineEditing";
import { createEditingRowStateUtils, getMergedRowData } from "./utils/editingRowUtils";
import { ActionsColumn } from "./ActionsColumn";
import { SummaryRow } from "./SummaryRow";
import { validateFieldRealTime } from "./utils/validationUtils";
import { getFieldReference, buildPayloadByInputName } from "@/utils";
import { useTableConfirmation } from "./hooks/useTableConfirmation";
import { useInlineTableDirOptions } from "./hooks/useInlineTableDirOptions";
import { useInlineEditInitialization } from "./hooks/useInlineEditInitialization";
import {
  canSortWithEditingRows,
  canFilterWithEditingRows,
  mergeOptimisticRecordsWithSort,
  canUseVirtualScrollingWithEditing,
} from "./utils/tableFeatureCompatibility";
import { createKeyboardNavigationManager, type KeyboardNavigationManager } from "./utils/keyboardNavigation";
import {
  useDebouncedCallback,
  useThrottledCallback,
  usePerformanceMonitor,
  useMemoryManager,
} from "./utils/performanceOptimizations";
import { useScreenReaderAnnouncer, generateAriaAttributes } from "./utils/accessibilityUtils";
import { useStatusModal } from "@/hooks/Toolbar/useStatusModal";
import StatusModal from "@workspaceui/componentlibrary/src/components/StatusModal";
import { globalCalloutManager } from "@/services/callouts";
import { getFieldsByColumnName } from "@workspaceui/api-client/src/utils/metadata";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import "./styles/inlineEditing.css";
import { compileExpression } from "../Form/FormView/selectors/BaseSelector";
import { useRowDropZone } from "@/hooks/table/useRowDropZone";
import { formatUTCTimeToLocal } from "@/utils/date/utils";

// Lazy load CellEditorFactory once at module level to avoid recreating on every render
const CellEditorFactory = React.lazy(() => import("./CellEditors/CellEditorFactory"));

type RowProps = (props: {
  isDetailPanel?: boolean;
  row: MRT_Row<EntityData>;
  table: MRT_TableInstance<EntityData>;
}) => Omit<MRT_TableBodyRowProps<EntityData>, "staticRowIndex">;

/**
 * Get field identifier from row values
 * Handles both inputName and hqlName based keys
 */
const getFieldIdentifier = (
  rowValues: Record<string, unknown>,
  fieldInputName: string,
  fieldHqlName: string
): unknown => {
  const identifierKeyFromInput = `${fieldInputName}$_identifier`;
  const identifierKeyFromHql = `${fieldHqlName}$_identifier`;
  return rowValues[identifierKeyFromInput] || rowValues[identifierKeyFromHql];
};

/**
 * Get field entries from row values
 * Handles both inputName and hqlName based keys
 */
const getFieldEntries = (rowValues: Record<string, unknown>, fieldInputName: string, fieldHqlName: string): unknown => {
  const entriesKeyFromInput = `${fieldInputName}$_entries`;
  const entriesKeyFromHql = `${fieldHqlName}$_entries`;
  return rowValues[entriesKeyFromInput] || rowValues[entriesKeyFromHql];
};

/**
 * Create field with augmented data (identifier and entries)
 */
const createFieldWithData = (
  field: Field,
  fieldInputName: string,
  fieldIdentifier: unknown,
  fieldEntries: unknown
): Field => {
  const identifierKeyFromInput = `${fieldInputName}$_identifier`;
  const entriesKeyFromInput = `${fieldInputName}$_entries`;

  return {
    ...field,
    ...(fieldIdentifier ? { [identifierKeyFromInput]: fieldIdentifier } : {}),
    ...(fieldEntries ? { [entriesKeyFromInput]: fieldEntries } : {}),
  };
};

/**
 * Shared props for cell editing context
 * Contains common editing-related dependencies used across cell components
 */
interface CellEditingContextProps {
  initialFocusCell: { rowId: string; columnName: string } | null;
  session: Record<string, unknown> | undefined;
  editingRowUtils: EditingRowStateUtils;
  keyboardNavigationManager: KeyboardNavigationManager | null;
  handleCellValueChange: (
    rowId: string,
    fieldKey: string,
    value: unknown,
    optionData?: Record<string, unknown>,
    field?: Field
  ) => void;
  validateFieldOnBlur: (rowId: string, fieldKey: string) => void;
  setInitialFocusCell: (cell: { rowId: string; columnName: string } | null) => void;
  loadTableDirOptions: (
    field: Field,
    searchQuery?: string,
    rowValues?: Record<string, unknown>
  ) => Promise<RefListField[]>;
  isLoadingTableDirOptions: (fieldName: string) => boolean;
}

/**
 * Props for EditableCellContent component
 * Extends CellEditingContextProps with cell-specific props
 */
interface EditableCellContentProps extends CellEditingContextProps {
  rowId: string;
  fieldKey: string;
  columnName: string;
  editingData: EditingRowData;
  fieldMapping: { fieldType: FieldType; field: Field };
}

/**
 * Editable cell content component
 * Extracted from inline Cell definition to reduce cognitive complexity
 */
const EditableCellContent: React.FC<EditableCellContentProps> = ({
  rowId,
  fieldKey,
  columnName,
  editingData,
  fieldMapping,
  initialFocusCell,
  session,
  editingRowUtils,
  keyboardNavigationManager,
  handleCellValueChange,
  validateFieldOnBlur,
  setInitialFocusCell,
  loadTableDirOptions,
  isLoadingTableDirOptions,
}) => {
  const currentValue =
    fieldKey in editingData.modifiedData ? editingData.modifiedData[fieldKey] : editingData.originalData[fieldKey];

  const shouldAutoFocus = initialFocusCell?.rowId === rowId && initialFocusCell?.columnName === columnName;
  const isNewRow = editingData.isNew || false;
  const rowValues = { ...editingData.originalData, ...editingData.modifiedData };
  const shouldBeReadOnly = isFieldReadOnly(fieldMapping.field, isNewRow, rowValues, session);

  const fieldInputName = fieldMapping.field.inputName || fieldMapping.field.hqlName || fieldKey;
  const fieldHqlName = fieldMapping.field.hqlName || fieldMapping.field.columnName || fieldKey;

  const fieldIdentifier = getFieldIdentifier(rowValues, fieldInputName, fieldHqlName);
  const fieldEntries = getFieldEntries(rowValues, fieldInputName, fieldHqlName);

  const fieldWithData = createFieldWithData(fieldMapping.field, fieldInputName, fieldIdentifier, fieldEntries);

  return (
    <div className="inline-edit-cell-container">
      <React.Suspense
        fallback={
          <div className="inline-edit-loading">
            <span className="text-gray-500 text-sm">Loading...</span>
          </div>
        }>
        <CellEditorFactory
          fieldType={fieldMapping.fieldType}
          value={currentValue}
          onChange={(value, optionData) =>
            handleCellValueChange(rowId, fieldKey, value, optionData, fieldMapping.field)
          }
          onBlur={() => {
            validateFieldOnBlur(rowId, fieldKey);
            if (shouldAutoFocus) {
              setInitialFocusCell(null);
            }
          }}
          field={fieldWithData}
          hasError={Boolean(editingData.validationErrors[fieldMapping.field.name || columnName])}
          disabled={editingData.isSaving || shouldBeReadOnly}
          rowId={rowId}
          columnId={fieldKey}
          keyboardNavigationManager={keyboardNavigationManager}
          shouldAutoFocus={shouldAutoFocus}
          loadOptions={async (_field, searchQuery) => {
            const freshEditingData = editingRowUtils.getEditingRowData(rowId);
            const freshRowValues = freshEditingData
              ? { ...freshEditingData.originalData, ...freshEditingData.modifiedData }
              : rowValues;
            return await loadTableDirOptions(fieldMapping.field, searchQuery, freshRowValues);
          }}
          isLoadingOptions={(fieldName) => isLoadingTableDirOptions(fieldName)}
          data-testid="CellEditorFactory__8ca888"
        />
      </React.Suspense>
    </div>
  );
};

/**
 * Props for ActionsColumnCell component
 */
interface ActionsColumnCellProps {
  row: MRT_Row<EntityData>;
  editingRowUtils: EditingRowStateUtils;
  handleEditRow: (row: MRT_Row<EntityData>) => void;
  handleSaveRow: (rowId: string) => void;
  handleCancelRow: (rowId: string) => void;
  setRecordId: (id: string) => void;
}

/**
 * Actions column cell component
 * Extracted from inline Cell definition
 */
const ActionsColumnCell: React.FC<ActionsColumnCellProps> = ({
  row,
  editingRowUtils,
  handleEditRow,
  handleSaveRow,
  handleCancelRow,
  setRecordId,
}) => {
  const rowId = String(row.original.id);
  const editingData = editingRowUtils.getEditingRowData(rowId);
  const isEditing = editingRowUtils.isRowEditing(rowId);
  const isSaving = editingData?.isSaving || false;
  const hasErrors = editingData ? Object.values(editingData.validationErrors).some((error) => error) : false;

  return (
    <ActionsColumn
      row={row}
      isEditing={isEditing}
      isSaving={isSaving}
      hasErrors={hasErrors}
      validationErrors={editingData?.validationErrors}
      onEdit={() => handleEditRow(row)}
      onSave={() => handleSaveRow(rowId)}
      onCancel={() => handleCancelRow(rowId)}
      onOpenForm={() => {
        // Navigate to form view - this will handle the URL update properly
        setRecordId(String(row.original.id));
      }}
      data-testid="ActionsColumn__8ca888"
    />
  );
};

/**
 * Props for DataColumnCell component
 * Handles both editing and display modes for data columns
 * Extends CellEditingContextProps with column-specific props
 */
interface DataColumnCellProps extends CellEditingContextProps {
  renderedCellValue: React.ReactNode;
  row: MRT_Row<EntityData>;
  table: MRT_TableInstance<EntityData>;
  col: Column;
  originalCell?: (props: {
    renderedCellValue: React.ReactNode;
    row: MRT_Row<EntityData>;
    table: MRT_TableInstance<EntityData>;
  }) => React.ReactNode;
  columnFieldMappings: Map<string, { fieldType: FieldType; field: Field }>;
}

/**
 * Data column cell component
 * Extracted from inline Cell definition to prevent component remounts
 * Handles both editing mode (with EditableCellContent) and display mode
 */
const DataColumnCell: React.FC<DataColumnCellProps> = ({
  renderedCellValue,
  row,
  table,
  col,
  originalCell,
  editingRowUtils,
  columnFieldMappings,
  initialFocusCell,
  session,
  keyboardNavigationManager,
  handleCellValueChange,
  validateFieldOnBlur,
  setInitialFocusCell,
  loadTableDirOptions,
  isLoadingTableDirOptions,
}) => {
  const rowId = String(row.original.id);
  const isEditing = editingRowUtils.isRowEditing(rowId);
  const fieldKey = col.columnName || col.name;

  // If this row is being edited, render the appropriate cell editor
  if (isEditing && col.name !== COLUMN_NAMES.ACTIONS) {
    const editingData = editingRowUtils.getEditingRowData(rowId);
    if (!editingData) return <>{renderedCellValue}</>;

    const fieldMapping = columnFieldMappings.get(col.name);
    if (!fieldMapping) return <>{renderedCellValue}</>;

    return (
      <EditableCellContent
        rowId={rowId}
        fieldKey={fieldKey}
        columnName={col.name}
        editingData={editingData}
        fieldMapping={fieldMapping}
        initialFocusCell={initialFocusCell}
        session={session}
        editingRowUtils={editingRowUtils}
        keyboardNavigationManager={keyboardNavigationManager}
        handleCellValueChange={handleCellValueChange}
        validateFieldOnBlur={validateFieldOnBlur}
        setInitialFocusCell={setInitialFocusCell}
        loadTableDirOptions={loadTableDirOptions}
        isLoadingTableDirOptions={isLoadingTableDirOptions}
        data-testid="EditableCellContent__8ca888"
      />
    );
  }

  // For non-editing cells, check if we should show identifier instead of UUID
  const identifierKey = `${fieldKey}$_identifier`;
  const identifier = row.original[identifierKey];

  // Format Time values from UTC to Local for display in the grid
  const fieldMapping = columnFieldMappings.get(col.name);
  if (fieldMapping?.fieldType === FieldType.TIME && typeof renderedCellValue === "string" && renderedCellValue) {
    const localTimeValue = formatUTCTimeToLocal(renderedCellValue);
    return <div className="table-cell-content">{localTimeValue}</div>;
  }

  if (identifier && typeof identifier === "string" && typeof renderedCellValue === "string") {
    if (originalCell && typeof originalCell === "function") {
      return <>{originalCell({ renderedCellValue: identifier, row, table })}</>;
    }
    return <div className="table-cell-content">{identifier}</div>;
  }

  // Preserve original rendering logic and formatting
  if (originalCell && typeof originalCell === "function") {
    return <>{originalCell({ renderedCellValue, row, table })}</>;
  }

  return <div className="table-cell-content">{renderedCellValue}</div>;
};

const getRowId = (row: EntityData) => String(row.id);

// Helper function to convert Column to FieldType using existing utilities
// Simple cache implementation with size limit
const fieldTypeCache = new Map<string, FieldType>();
const MAX_CACHE_SIZE = 100;

// Extended Column type with optional metadata properties
interface ExtendedColumn extends Column {
  column?: {
    reference?: string;
    referencedEntity?: string;
    readOnlyLogicExpression?: string;
  };
  readOnlyLogicExpression?: string;
  isReadOnly?: boolean;
  isUpdatable?: boolean;
}

// Helper function to determine if a field should be readonly in inline editing
const isFieldReadOnly = (
  field: Field,
  isNewRow = false,
  rowValues?: Record<string, unknown>,
  session?: Record<string, unknown>
): boolean => {
  // Field explicitly marked as readonly
  if (field.isReadOnly) return true;

  // Field not updatable (readonly except for new rows)
  if (!field.isUpdatable && !isNewRow) return true;

  // Evaluate readOnlyLogicExpression if present
  if (field.readOnlyLogicExpression && rowValues) {
    try {
      const compiledExpr = compileExpression(field.readOnlyLogicExpression);
      const result = compiledExpr(session || {}, rowValues);
      return Boolean(result);
    } catch (error) {
      logger.warn(`Error evaluating readOnlyLogicExpression for field ${field.name}:`, error);
      // On error, default to readonly for safety
      return true;
    }
  }

  return false;
};

const getFieldTypeFromColumn = (column: Column): FieldType => {
  // Create a cache key based on column properties that affect field type
  const cacheKey = `${column.name}-${column.type}-${column.column?.reference}-${column.displayType}`;

  const cached = fieldTypeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let fieldType: FieldType;

  // First, check if this is a TABLEDIR field based on referencedEntity
  // Fields with referencedEntity should be TABLEDIR, not SELECT
  const extColumn = column as ExtendedColumn;
  if (column.referencedEntity || extColumn.column?.referencedEntity) {
    fieldType = FieldType.TABLEDIR;
  } else if (column.type && Object.values(FieldType).includes(column.type as FieldType)) {
    fieldType = column.type as FieldType;
  } else {
    // Fallback to reference mapping if type is not set or invalid
    fieldType = getFieldReference(column.column?.reference);
  }

  // Note: Special case corrections are now handled in parseColumns

  // Field type detection completed - special cases handled in parseColumns

  // Limit cache size to prevent memory leaks
  if (fieldTypeCache.size >= MAX_CACHE_SIZE) {
    const firstKey = fieldTypeCache.keys().next().value;
    if (firstKey) {
      fieldTypeCache.delete(firstKey);
    }
  }

  fieldTypeCache.set(cacheKey, fieldType);
  return fieldType;
};

// Helper function to convert Column to Field for cell editors
// Simple cache implementation with size limit
const fieldCache = new Map<string, Field>();

const columnToFieldForEditor = (column: Column): Field => {
  // Extract readOnlyLogicExpression from column (now populated by parseColumns)
  const extColumn = column as ExtendedColumn;
  const readOnlyLogicExpression = extColumn.readOnlyLogicExpression || extColumn.column?.readOnlyLogicExpression;

  // Extract isReadOnly and isUpdatable from column
  const isReadOnly = extColumn.isReadOnly || false;
  const isUpdatable = extColumn.isUpdatable !== false; // Default to true if not specified

  // Create a cache key based on column properties that affect the Field conversion
  // Include a version marker to invalidate old cache entries when logic changes
  const cacheKey = `v3-${column.name}-${column.fieldId}-${column.isMandatory}-${column.type}-${!!readOnlyLogicExpression}`;

  const cachedField = fieldCache.get(cacheKey);
  if (cachedField) {
    return cachedField;
  }

  // Use the refList and referencedEntity from the column (set by parseColumns)
  const refList = Array.isArray(column.refList) ? column.refList : [];

  // Get the corrected field type using the same logic as getFieldTypeFromColumn
  const correctedFieldType = getFieldTypeFromColumn(column);

  // Create a minimal Field object with the data we need for cell editors
  const field: Field = {
    name: column.name,
    hqlName: column.name,
    inputName: column.name,
    columnName: column.columnName || column.name,
    process: "",
    shownInStatusBar: Boolean(column.shownInStatusBar),
    tab: "",
    displayed: column.displayed !== false,
    startnewline: false,
    showInGridView: column.showInGridView !== false,
    fieldGroup$_identifier: "",
    fieldGroup: "",
    isMandatory: column.isMandatory || false,
    column: column.column || {},
    id: column.fieldId || column.id,
    module: "",
    hasDefaultValue: false,
    refColumnName: column.column?.reference || "",
    targetEntity: String(column.referencedEntity || column.datasourceId || ""),
    gridProps: {} as GridProps,
    type: String(correctedFieldType),
    field: [],
    selector: column.selector,
    refList: refList,
    referencedEntity: String(column.referencedEntity || ""),
    referencedWindowId: column.referencedWindowId || "",
    referencedTabId: "",
    displayLogicExpression: undefined,
    readOnlyLogicExpression: readOnlyLogicExpression,
    isReadOnly: isReadOnly,
    isDisplayed: column.displayed !== false,
    sequenceNumber: Number(column.sequenceNumber || 0),
    isUpdatable: isUpdatable,
    description: column.header,
    helpComment: "",
    processDefinition: undefined,
    processAction: undefined,
    etmetaCustomjs: column.customJs || null,
    isActive: true,
    gridDisplayLogic: "",
  } as Field;

  // Limit cache size to prevent memory leaks
  if (fieldCache.size >= MAX_CACHE_SIZE) {
    const firstKey = fieldCache.keys().next().value;
    if (firstKey) {
      fieldCache.delete(firstKey);
    }
  }

  fieldCache.set(cacheKey, field);
  return field;
};

interface DynamicTableProps {
  setRecordId: React.Dispatch<React.SetStateAction<string>>;
  onRecordSelection?: (recordId: string) => void;
  isTreeMode?: boolean;
  isVisible?: boolean;
  areFiltersDisabled?: boolean;
}

const getExpandIcon = (canExpand: boolean, isExpanded: boolean) => {
  if (!canExpand) return null;
  return isExpanded ? (
    <ChevronUp height={12} width={12} fill={"#3F4A7E"} data-testid="ChevronUp__8ca888" />
  ) : (
    <ChevronDown height={12} width={12} fill={"#3F4A7E"} data-testid="ChevronDown__8ca888" />
  );
};

const getHierarchyIcon = (
  shouldUseTreeMode: boolean,
  eTMETAIcon: string | undefined,
  hasChildren: boolean,
  isExpanded: boolean
) => {
  if (!shouldUseTreeMode) return null;

  if (eTMETAIcon) {
    let svgContent = "";
    try {
      svgContent = atob(eTMETAIcon);
      // Replace black fill with primary blue color to match design system
      // Also handles specific case where fill is set to black or inherited
      svgContent = svgContent.replace(/fill="black"/g, 'fill="#004ACA"');
      // Add logic for paths that might not have fill attribute but rely on default black
      svgContent = svgContent.replace(/<path(?![^>]*fill=)/g, '<path fill="#004ACA"');
    } catch (e) {
      console.error("Error parsing eTMETAIcon SVG", e);
      svgContent = eTMETAIcon; // Fallback to original if decode fails
    }
    const encodedSvg = btoa(svgContent);

    return (
      <img
        src={`data:image/svg+xml;base64,${encodedSvg}`}
        alt=""
        className="min-w-5 min-h-5 w-5 h-5 object-contain"
        data-testid="eTMETAIcon__8ca888"
      />
    );
  }

  if (hasChildren) {
    const Icon = isExpanded ? MinusFolderIcon : PlusFolderFilledIcon;
    return <Icon className="min-w-5 min-h-5" fill={"#004ACA"} data-testid="HierarchyIcon__8ca888" />;
  }

  return <CircleFilledIcon className="min-w-5 min-h-5" fill={"#004ACA"} data-testid="HierarchyIcon__8ca888" />;
};

const DynamicTable = ({
  setRecordId,
  onRecordSelection,
  isTreeMode = true,
  isVisible = true,
  areFiltersDisabled = false,
}: DynamicTableProps) => {
  const { sx } = useStyle();
  const { t } = useTranslation();
  const { graph } = useSelected();
  const { user, session } = useUserContext();

  const savedScrollTop = useRef<number>(0);
  const isRestoringScroll = useRef<boolean>(false);
  const isManualSelection = useRef<boolean>(false);

  // Restore scroll position when table becomes visible
  useEffect(() => {
    if (isVisible && tableContainerRef.current && savedScrollTop.current > 0) {
      // Use requestAnimationFrame to ensure layout is complete
      requestAnimationFrame(() => {
        if (!tableContainerRef.current) return;

        // If scroll is already correct, do nothing to avoid triggering scroll events
        if (Math.abs(tableContainerRef.current.scrollTop - savedScrollTop.current) <= 1) {
          return;
        }

        isRestoringScroll.current = true;
        tableContainerRef.current.scrollTop = savedScrollTop.current;

        // Reset restoration flag after a short delay to allow scroll events to settle
        setTimeout(() => {
          isRestoringScroll.current = false;
        }, 100);
      });
    }
  }, [isVisible]);

  // Save scroll position when scrolling
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    // Don't save scroll position while we are restoring it
    if (isRestoringScroll.current) return;

    const target = event.target as HTMLDivElement;
    if (target) {
      savedScrollTop.current = target.scrollTop;
    }
  }, []);

  // Confirmation dialog hook for user confirmations
  const { confirmationState, confirmDiscardChanges, confirmSaveWithErrors } = useTableConfirmation();

  // Status modal for showing save errors and success messages
  const { statusModal, hideStatusModal, showErrorModal, showSuccessModal } = useStatusModal();

  const {
    registerDatasource,
    unregisterDatasource,
    registerRefetchFunction,
    registerRecordsGetter,
    registerHasMoreRecordsGetter,
    registerFetchMore,
    registerUpdateRecord,
    registerAddRecord,
  } = useDatasourceContext();
  const { registerActions, registerAttachmentAction, setShouldOpenAttachmentModal } = useToolbarContext();
  const { activeWindow, getSelectedRecord, getTabFormState } = useWindowContext();
  const { tab, parentTab, parentRecord } = useTabContext();
  const { registerRefresh } = useTabRefreshContext();

  // Hook for fetching form initialization data when entering edit mode
  const { fetchInitialData } = useInlineEditInitialization({ tab });

  // Hook for loading TABLEDIR options for inline editing
  const { loadOptions: loadTableDirOptions, isLoading: isLoadingTableDirOptions } = useInlineTableDirOptions({
    tabId: tab.id,
    windowId: tab.window,
    tab: tab,
  });

  const { tableColumnFilters, tableColumnVisibility, tableColumnSorting, tableColumnOrder } =
    useTableStatePersistenceTab({
      windowIdentifier: activeWindow?.windowIdentifier || "",
      tabId: tab.id,
      tabLevel: tab.tabLevel,
    });
  const tabId = tab.id;
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Hook for drag & drop file attachments on table rows
  const handleFileDrop = useCallback((files: File[], record: EntityData) => {
    if (files.length > 0) {
      setDropUploadState({
        isOpen: true,
        file: files[0],
        recordId: String(record.id),
        recordIdentifier: record._identifier as string | undefined,
      });
    }
  }, []);

  // Debug: Compare baseColumns with rawColumns from parseColumns

  const clickTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const hasScrolledToSelection = useRef<boolean>(false);
  const previousURLSelection = useRef<string | null>(null);
  const hasRestoredSelection = useRef(false);

  // Use the table data hook
  const {
    displayRecords,
    records,
    columns: baseColumns,
    expanded,
    loading,
    error,
    shouldUseTreeMode,
    hasMoreRecords,
    handleMRTColumnFiltersChange,
    handleMRTColumnVisibilityChange,
    handleMRTSortingChange,
    handleMRTColumnOrderChange,
    handleMRTExpandChange,
    toggleImplicitFilters,
    fetchMore,
    refetch,
    removeRecordLocally,
    updateRecordLocally,
    addRecordLocally,
    applyQuickFilter,
    fetchSummary,
  } = useTableData({
    isTreeMode,
  });

  // Summary State
  const [summaryState, setSummaryState] = useState<Record<string, SummaryType>>({});
  const [summaryResult, setSummaryResult] = useState<Record<string, number | string>>({});
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [headerContextMenuAnchor, setHeaderContextMenuAnchor] = useState<HTMLElement | null>(null);
  const [headerContextMenuColumn, setHeaderContextMenuColumn] = useState<MRT_Column<EntityData> | null>(null);

  const [dropUploadState, setDropUploadState] = useState<{
    isOpen: boolean;
    file: File | null;
    recordId: string | null;
    recordIdentifier?: string;
  }>({
    isOpen: false,
    file: null,
    recordId: null,
    recordIdentifier: undefined,
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleHeaderContextMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>, column: MRT_Column<EntityData>) => {
      event.preventDefault();
      setHeaderContextMenuAnchor(event.currentTarget);
      setHeaderContextMenuColumn(column);
    },
    []
  );

  const handleCloseHeaderContextMenu = useCallback(() => {
    setHeaderContextMenuAnchor(null);
    setHeaderContextMenuColumn(null);
  }, []);

  const handleSetSummary = useCallback((columnId: string, type: SummaryType) => {
    setSummaryState((prev) => ({
      ...prev,
      [columnId]: type,
    }));
  }, []);

  const handleRemoveSummary = useCallback((columnId: string) => {
    setSummaryState((prev) => {
      const newState = { ...prev };
      delete newState[columnId];
      return newState;
    });
    setSummaryResult((prev) => {
      const newState = { ...prev };
      delete newState[columnId];
      return newState;
    });
  }, []);

  // Keep fetchSummary in a ref to use in effects without causing infinite loops
  const fetchSummaryRef = useRef(fetchSummary);
  useLayoutEffect(() => {
    fetchSummaryRef.current = fetchSummary;
  }, [fetchSummary]);

  // Load summary when state or filters change
  useEffect(() => {
    const loadSummary = async () => {
      if (Object.keys(summaryState).length === 0) {
        setSummaryResult({});
        return;
      }

      setIsSummaryLoading(true);
      try {
        const result = await fetchSummaryRef.current(summaryState);
        if (result) {
          setSummaryResult(result);
        } else {
          setSummaryResult({});
        }
      } catch (error) {
        logger.error("Error loading summary:", error);
        setSummaryResult({});
      } finally {
        setIsSummaryLoading(false);
      }
    };

    loadSummary();
  }, [summaryState]);

  const [columnMenuAnchor, setColumnMenuAnchor] = useState<HTMLElement | null>(null);
  const [hasInitialColumnVisibility, setHasInitialColumnVisibility] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{
    anchorEl: HTMLElement | null;
    cell: MRT_Cell<EntityData> | null;
    row: MRT_Row<EntityData> | null;
  }>({
    anchorEl: null,
    cell: null,
    row: null,
  });

  // Inline editing state management
  // This state tracks which rows are currently being edited, their original and modified data,
  // validation errors, and save status. The editingRowUtils provide helper functions to manage this state.
  const [editingRows, setEditingRows] = useState<EditingRowsState>({});
  const editingRowsRef = useRef<EditingRowsState>({});
  editingRowsRef.current = editingRows; // Keep ref in sync with state

  // Focus management for inline editing - tracks which cell should receive initial focus
  const [initialFocusCell, setInitialFocusCell] = useState<{ rowId: string; columnName: string } | null>(null);

  // Debug comparison completed - issue identified and resolved

  const [_inlineEditingContextMenu, _setInlineEditingContextMenu] = useState<InlineEditingContextMenu>({
    anchorEl: null,
    cell: null,
    row: null,
    showInlineOptions: false,
  });

  // Create editing row state utilities - memoize with stable ref to prevent recreating functions
  // Use ref instead of state in dependencies to avoid recreation on every state change
  const editingRowUtils = useMemo(
    () => createEditingRowStateUtils(editingRowsRef, setEditingRows),
    [] // Empty deps - only create once, functions use ref for current value
  );

  // State for drop zone overlay
  const [dropTargetState, setDropTargetState] = useState<{
    rect: DOMRect;
    recordId: string;
  } | null>(null);

  // State for pending selection after upload
  const [pendingSelectionId, setPendingSelectionId] = useState<string | null>(null);

  const handleTableUpload = async (file: File, description: string) => {
    if (!dropUploadState.recordId) return;

    setIsUploading(true);
    try {
      const orgId = session["#AD_Org_ID"] || session.adOrgId;

      if (!orgId) {
        throw new Error("Organization ID not found in session");
      }

      await createAttachment({
        recordId: dropUploadState.recordId,
        tabId: tabId,
        file: file,
        inpDocumentOrg: orgId as string,
        description: description,
      });

      // Fetch ONLY the updated record to avoid full table reload
      try {
        const response = (await datasource.get(tab.entityName, {
          windowId: tab.window,
          tabId: tabId,
          criteria: [{ fieldName: "id", value: dropUploadState.recordId, operator: "equals" }],
          pageSize: 1,
          _operationType: "fetch",
          _noCount: true,
        })) as { data: { response: { data: EntityData[] } } };

        if (response.data?.response?.data?.[0]) {
          const updatedRecord = response.data.response.data[0];
          // Patch the record into the view using optimistic updates
          setOptimisticRecords((prev) => {
            const filtered = prev.filter((r) => String(r.id) !== dropUploadState.recordId);
            return [...filtered, updatedRecord];
          });
        }
      } catch (fetchError) {
        console.error("[Table] Single record fetch failed:", fetchError);
        logger.warn("[Table] Failed to refresh single record, falling back to full refetch", fetchError);
        await refetch();
      }

      // Set pending selection to highlight the row
      setPendingSelectionId(dropUploadState.recordId);

      // Close modal and reset state
      setDropUploadState({
        isOpen: false,
        file: null,
        recordId: null,
        recordIdentifier: undefined,
      });

      // Show success message (optional)
      // showSuccessModal(t("forms.attachments.uploadSuccess"));
    } catch (error) {
      logger.error("[Table] Error uploading attachment:", error);
      showErrorModal(t("forms.attachments.errorAddingAttachment"));
    } finally {
      setIsUploading(false);
    }
  };

  const { getRowDropZoneProps } = useRowDropZone({
    onFileDrop: handleFileDrop,
    onDragStateChange: setDropTargetState,
  });

  // Optimistic updates state - tracks pending updates for immediate UI feedback
  const [optimisticRecords, setOptimisticRecords] = useState<EntityData[]>([]);

  // Keyboard navigation manager for inline editing
  const [keyboardNavigationManager, setKeyboardNavigationManager] = useState<KeyboardNavigationManager | null>(null);

  // Performance optimization utilities
  const performanceMonitor = usePerformanceMonitor();
  const memoryManager = useMemoryManager();

  // Accessibility utilities
  const screenReaderAnnouncer = useScreenReaderAnnouncer();

  /**
   * Transfer metadata from original field to editor field
   */
  const enrichFieldWithOriginalMetadata = useCallback(
    (field: Field, column: Column): Field => {
      const fieldKey = column.columnName || column.name;
      const originalField = tab.fields?.[fieldKey];

      if (!originalField) {
        return field;
      }

      // Transfer callout if present
      if (originalField.column?.callout) {
        field.column = {
          ...field.column,
          callout: originalField.column.callout,
        };
      }

      // Transfer selector configuration
      if (originalField.selector) {
        field.selector = originalField.selector;
      }

      // Use the correct inputName and hqlName from the original field
      field.inputName = originalField.inputName;
      field.hqlName = originalField.hqlName;

      return field;
    },
    [tab.fields]
  );

  /**
   * Store field mapping by both col.name and col.columnName
   */
  const storeFieldMapping = useCallback(
    (
      mappings: Map<string, { fieldType: FieldType; field: Field }>,
      column: Column,
      mapping: { fieldType: FieldType; field: Field }
    ): void => {
      mappings.set(column.name, mapping);
      if (column.columnName && column.columnName !== column.name) {
        mappings.set(column.columnName, mapping);
      }
    },
    []
  );

  /**
   * Create field mapping for a single column
   */
  const createColumnFieldMapping = useCallback(
    (column: Column): { fieldType: FieldType; field: Field } => {
      const field = columnToFieldForEditor(column);
      const enrichedField = enrichFieldWithOriginalMetadata(field, column);

      return {
        fieldType: getFieldTypeFromColumn(column),
        field: enrichedField,
      };
    },
    [enrichFieldWithOriginalMetadata]
  );

  // Memoize field conversions for all columns to avoid recalculation on every render
  const columnFieldMappings = useMemo(() => {
    const mappings = new Map<string, { fieldType: FieldType; field: Field }>();

    for (const col of baseColumns) {
      if (col.name === COLUMN_NAMES.ACTIONS) {
        continue;
      }

      const mapping = createColumnFieldMapping(col);
      storeFieldMapping(mappings, col, mapping);
    }

    return mappings;
  }, [baseColumns, createColumnFieldMapping, storeFieldMapping]);

  // Immediate validation function (no debounce)
  const validateFieldImmediate = useCallback(
    (rowId: string, fieldName: string, value: unknown) => {
      performanceMonitor.measure(`validate-field-immediate-${fieldName}`, () => {
        // Use memoized field mapping to avoid column lookup
        const fieldMapping = columnFieldMappings.get(fieldName);
        if (!fieldMapping) return;

        // Use real-time validation with lenient settings for typing
        const validationResult = validateFieldRealTime(fieldMapping.field, value, {
          allowEmpty: true,
          showTypingErrors: false,
        });

        // Use field.name as the validation key to match Save validation and Callout logic
        const validationKey = fieldMapping.field.name || fieldName;

        // Update validation errors in state
        const currentErrors = editingRows[rowId]?.validationErrors || {};
        editingRowUtils.setRowValidationErrors(rowId, {
          ...currentErrors,
          [validationKey]: validationResult.error,
        });
      });
    },
    [columnFieldMappings, editingRows, editingRowUtils]
  );

  // Create debounced validation function for real-time feedback with performance monitoring
  const debouncedValidateField = useDebouncedCallback((rowId: string, fieldName: string, value: unknown) => {
    validateFieldImmediate(rowId, fieldName, value);
  }, 300);

  // Function to cancel pending validations for specific fields
  const blurValidationTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const cancelPendingDebouncedValidations = useCallback(() => {
    // Cancel only the debounced validation, not blur validations
    // Blur validations read current state so they should be safe
    debouncedValidateField.cancel();
  }, [debouncedValidateField]);

  // Immediate validation function for blur events with performance monitoring
  const validateFieldOnBlur = useCallback(
    (rowId: string, fieldName: string) => {
      // Add a small delay to ensure throttled onChange has completed
      // handleCellValueChange is throttled to 50ms, so we wait 60ms to be safe
      const timerKey = `${rowId}-${fieldName}`;

      // Clear any existing timer for this field
      const existingTimer = blurValidationTimersRef.current.get(timerKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        // Remove from map when executed
        blurValidationTimersRef.current.delete(timerKey);
        performanceMonitor.measure(`validate-field-blur-${fieldName}`, () => {
          // Use memoized field mapping to avoid column lookup
          const fieldMapping = columnFieldMappings.get(fieldName);
          if (!fieldMapping) {
            return;
          }

          // Get the current value from the editing state (not from the closure)
          // This ensures we validate the most recent value after onChange
          const editingData = editingRowUtils.getEditingRowData(rowId);
          if (!editingData) {
            return;
          }

          const currentValue =
            fieldName in editingData.modifiedData
              ? editingData.modifiedData[fieldName]
              : editingData.originalData[fieldName];

          // Only enforce non-empty validation if the field is mandatory
          // Optional fields can be empty
          const validationResult = validateFieldRealTime(fieldMapping.field, currentValue, {
            allowEmpty: !fieldMapping.field.isMandatory,
            showTypingErrors: true,
          });

          // Use field.name as the validation key to match Save validation and Callout logic
          const validationKey = fieldMapping.field.name || fieldName;

          // Update validation errors in state
          const currentErrors = editingData.validationErrors || {};
          editingRowUtils.setRowValidationErrors(rowId, {
            ...currentErrors,
            [validationKey]: validationResult.error,
          });
        });
      }, 60); // Wait for throttled onChange to complete (50ms + 10ms buffer)

      // Store the timer so it can be cancelled if needed
      blurValidationTimersRef.current.set(timerKey, timer);
    },
    [columnFieldMappings, editingRowUtils, performanceMonitor]
  );

  // Helper function to get Field by name using the columnFieldMappings cache
  const getFieldByName = useCallback(
    (fieldName: string): Field | undefined => {
      return columnFieldMappings.get(fieldName)?.field;
    },
    [columnFieldMappings]
  );

  // Apply callout values to an editing row
  // Reuses calloutUtils for consistency with FormView's BaseSelector logic
  const applyCalloutValuesToRow = useCallback(
    (rowId: string, columnValues: FormInitializationResponse["columnValues"]) => {
      if (!columnValues) return;

      const editingData = editingRowUtils.getEditingRowData(rowId);
      if (!editingData) return;

      // Cancel pending debounced validations to prevent stale validations
      cancelPendingDebouncedValidations();

      // Process callout column values using shared utility
      const updates = processCalloutColumnValues(columnValues, tab);
      const fieldsByColumnName = getFieldsByColumnName(tab);

      // Apply each update to the editing row
      for (const [columnName, _columnValue] of Object.entries(columnValues)) {
        const targetField = fieldsByColumnName[columnName];
        if (!targetField) continue;

        const update = updates.find((u) => u.fieldName === (targetField.hqlName || columnName));
        if (!update) continue;

        const gridFieldName = update.fieldName; // Use hqlName from update
        const validationKey = targetField.name || gridFieldName;

        // Update field value
        // Pass validationKey to ensure the correct error is cleared
        editingRowUtils.updateCellValue(rowId, gridFieldName, update.value, validationKey);

        // Update identifier if present
        if (update.identifier && update.value && String(update.value) !== update.identifier) {
          editingRowUtils.updateCellValue(rowId, `${gridFieldName}$_identifier`, update.identifier);
        }

        // Update entries if present
        if (update.entries) {
          editingRowUtils.updateCellValue(rowId, `${gridFieldName}$_entries`, update.entries);
        }

        // NOTE: We don't trigger validation here because:
        // 1. updateCellValue already clears the error for this field
        // 2. Any pending blur validations will read the new value from state
        // 3. Triggering validation here can interfere with auto-selection logic
      }
    },
    [tab, editingRowUtils, cancelPendingDebouncedValidations]
  );

  // Type for product option data from datasource
  interface ProductOptionData {
    cCurrencyId?: string;
    currency?: string;
    currency$id?: string;
    product$currency$id?: string;
    cUomId?: string;
    uOM?: string;
    uOM$id?: string;
    product$uOM$id?: string;
    standardPrice?: number;
    netListPrice?: number;
    listPrice?: number;
    priceLimit?: number;
    limitPrice?: number;
  }

  // Execute inline callout for a field
  const executeInlineCallout = useCallback(
    async (rowId: string, field: Field, newValue: unknown, optionData?: Record<string, unknown>) => {
      // Don't execute if field doesn't have callout
      if (!field.column.callout) {
        logger.warn(`[InlineCallout] Field ${field.hqlName} has no callout configured`);
        return;
      }

      // Get current editing row data
      const editingData = editingRowUtils.getEditingRowData(rowId);
      if (!editingData) {
        logger.warn(`[InlineCallout] No editing data found for row ${rowId}`);
        return;
      }

      // Don't execute if we're applying callout values (prevent loops)
      if (editingData.isApplyingCalloutValues) {
        return;
      }

      try {
        // Build payload from current row data
        const fieldsByHqlName = tab?.fields || {};
        const fieldsByColumnName = getFieldsByColumnName(tab);
        const currentRowData = getMergedRowData(editingData);

        // Filter out fields that don't have metadata definitions
        // This removes display names like "Tax", "Alternate Taxable Amount", etc.
        // and grid-specific field names that aren't in the field definitions
        const validFieldNames = new Set([
          ...Object.keys(fieldsByHqlName),
          ...Object.values(fieldsByHqlName).map((f) => f.inputName),
          ...Object.values(fieldsByHqlName).map((f) => f.columnName),
        ]);

        const filteredRowData = Object.entries(currentRowData).reduce(
          (acc, [key, value]) => {
            // Keep the field if:
            // 1. It's a known field name (hqlName, inputName, or columnName)
            // 2. It's an identifier field (ends with $_identifier)
            // 3. It's an entries field (ends with $_entries)
            // 4. It's a data field (ends with _data)
            const baseFieldName = key.replace(/(\$_identifier|\$_entries|_data)$/, "");
            if (
              validFieldNames.has(key) ||
              validFieldNames.has(baseFieldName) ||
              key.endsWith("$_identifier") ||
              key.endsWith("$_entries") ||
              key.endsWith("_data")
            ) {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, unknown>
        );

        const payload = buildPayloadByInputName(filteredRowData, fieldsByHqlName);
        const entityKeyColumn = tab.fields.id.columnName;
        const calloutData = {
          ...session,
          ...payload,
          inpKeyName: fieldsByColumnName[entityKeyColumn].inputName,
          inpTabId: tab.id,
          inpTableId: tab.table,
          inpkeyColumnId: entityKeyColumn,
          keyColumnName: entityKeyColumn,
          _entityName: tab.entityName,
          inpwindowId: tab.window,
        } as Record<string, unknown>;

        // CRITICAL FIX: For product field, use the actual product ID, not the datasource compound ID
        // The datasource returns a compound ID (warehouse + product), but backend expects just the product ID
        calloutData[field.inputName] = newValue;

        if (field.inputName === "inpmProductId" && newValue && optionData) {
          // Cast to typed interfaces
          const productOption = optionData as ProductOptionData;
          const parentData = parentRecord;

          // CRITICAL: Add parent order ID to payload
          // The product callout needs this to query order data (date, isCashVAT, etc.) for tax calculation
          if (parentData?.id) {
            calloutData.inpcOrderId = String(parentData.id);
          }

          // Get priceList from parentRecord (order header)
          const priceListFromParent = parentData?.priceList || parentData?.mPricelistId;
          if (priceListFromParent) {
            calloutData.inpmPricelistId = priceListFromParent;
          }

          // Try multiple possible field names for currency (from datasource response)
          calloutData.inpmProductId_CURR =
            productOption.cCurrencyId ||
            productOption.currency ||
            productOption.currency$id ||
            productOption.product$currency$id ||
            parentData?.currency ||
            parentData?.cCurrencyId ||
            session.$C_Currency_ID;

          // Try multiple possible field names for UOM (from datasource response)
          calloutData.inpmProductId_UOM =
            productOption.cUomId ||
            productOption.uOM ||
            productOption.uOM$id ||
            productOption.product$uOM$id ||
            session["#C_UOM_ID"] ||
            "";

          // Try multiple possible field names for prices (from datasource response)
          calloutData.inpmProductId_PSTD = String(
            productOption.standardPrice || productOption.netListPrice || productOption.listPrice || 0
          );
          calloutData.inpmProductId_PLIST = String(productOption.netListPrice || productOption.listPrice || 0);
          calloutData.inpmProductId_PLIM = String(productOption.priceLimit || productOption.limitPrice || 0);

          // Add complete product_data object for backend callout (needed for tax calculation)
          calloutData.product_data = optionData;

          // Set default quantity if not present in current row data
          if (!calloutData.inpqtyordered) {
            calloutData.inpqtyordered = "1";
          }
        }

        // Execute through global manager

        await globalCalloutManager.executeCallout(field.hqlName, async () => {
          // For new records (rowId starts with "new_"), send ROW_ID=null
          const isNewRecord = rowId.startsWith("new_");
          const rowIdForBackend = isNewRecord ? "null" : rowId;

          // Always use MODE=CHANGE like form view does
          // The key is having auxiliary fields initialized (done below)
          const params = new URLSearchParams({
            _action: ACTION_FORM_INITIALIZATION,
            MODE: MODE_CHANGE,
            TAB_ID: tab.id,
            CHANGED_COLUMN: field.inputName,
            ROW_ID: rowIdForBackend,
            PARENT_ID: String(parentRecord?.id || "null"),
          });

          const response = await Metadata.kernelClient.post(`?${params}`, calloutData);

          if (response?.data?.columnValues || response?.data?.auxiliaryInputValues) {
            // Mark that we're applying callout values to prevent loops
            editingRowUtils.setCalloutApplying(rowId, true);

            // Suppress other callouts while applying values
            globalCalloutManager.suppress();

            try {
              // Apply column values (field values, identifiers, entries)
              if (response.data.columnValues) {
                applyCalloutValuesToRow(rowId, response.data.columnValues);
              }

              // Apply auxiliary input values (PRODUCTTYPE, isBOM, etc.)
              // These are needed for subsequent callouts to work correctly
              if (response.data.auxiliaryInputValues) {
                for (const [key, valueObj] of Object.entries(response.data.auxiliaryInputValues)) {
                  const { value } = valueObj as { value: unknown };
                  editingRowUtils.updateCellValue(rowId, key, value);
                }
              }
            } finally {
              setTimeout(() => {
                globalCalloutManager.resume();
                editingRowUtils.setCalloutApplying(rowId, false);
              }, 0);
            }
          } else {
            logger.warn(`[InlineCallout] No columnValues or auxiliaryInputValues in response for ${field.hqlName}`);
          }
        });
      } catch (error) {
        logger.error(`[InlineCallout] Error executing callout for ${field.hqlName}:`, error);
      }
    },
    [tab, session, parentRecord, editingRowUtils, applyCalloutValuesToRow]
  );

  const toggleColumnsDropdown = useCallback(
    (buttonRef?: HTMLElement | null) => {
      if (columnMenuAnchor) {
        setColumnMenuAnchor(null);
      } else {
        setColumnMenuAnchor(buttonRef || null);
      }
    },
    [columnMenuAnchor]
  );

  const handleCloseColumnMenu = useCallback(() => {
    setColumnMenuAnchor(null);
  }, []);

  const handleCellContextMenu = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>, cell: MRT_Cell<EntityData>, row: MRT_Row<EntityData>) => {
      event.preventDefault();

      setContextMenu({
        anchorEl: event.currentTarget,
        cell,
        row,
      });
    },
    []
  );

  const handleTableBodyContextMenu = useCallback((event: React.MouseEvent) => {
    // Check if the click is on an empty area (not on a row/cell)
    // We detect this by checking if the target is not a table cell or row
    const target = event.target as HTMLElement;
    const isClickOnEmptyArea = !target.closest("tr") && !target.closest("td") && !target.closest("th");

    if (isClickOnEmptyArea) {
      event.preventDefault();

      // Create a temporary anchor element at the mouse position
      // This ensures the menu appears exactly where the user clicked
      const anchorElement = document.createElement("div");
      anchorElement.style.position = "fixed";
      anchorElement.style.left = `${event.clientX}px`;
      anchorElement.style.top = `${event.clientY}px`;
      anchorElement.style.width = "0px";
      anchorElement.style.height = "0px";
      // Mark this as a temporary element so we know to remove it later
      anchorElement.setAttribute("data-context-menu-anchor", "true");
      document.body.appendChild(anchorElement);

      setContextMenu({
        anchorEl: anchorElement,
        cell: null,
        row: null,
      });
    }
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu((prev) => {
      // Only clean up temporary anchor elements that we created
      // IMPORTANT: Do NOT remove table cells that were used as anchors!
      if (prev.anchorEl?.hasAttribute("data-context-menu-anchor")) {
        try {
          // Check if the element is still in the DOM and has a parent before removing
          if (prev.anchorEl.parentNode && document.body.contains(prev.anchorEl)) {
            prev.anchorEl.parentNode.removeChild(prev.anchorEl);
          }
        } catch (error) {
          // Silently ignore if element was already removed
          // Performance: Debug log removed
        }
      }

      return {
        anchorEl: null,
        cell: null,
        row: null,
      };
    });
  }, []);

  const handleFilterByValue = useCallback(
    async (columnId: string, filterId: string, filterValue: string | number, filterLabel: string) => {
      await applyQuickFilter(columnId, filterId, filterValue, filterLabel);
    },
    [applyQuickFilter]
  );

  // Inline editing action handlers
  const handleEditRow = useCallback(
    async (row: MRT_Row<EntityData>) => {
      const rowId = String(row.original.id);

      // Add the row to editing state with original data immediately
      // This ensures the inputs show up right away
      editingRowUtils.addEditingRow(rowId, row.original, false);

      // Set focus to the first editable column (skip 'id' and 'actions')
      const firstEditableColumn = baseColumns.find(
        (col: Column) => col.name !== COLUMN_NAMES.ID && col.name !== COLUMN_NAMES.ACTIONS && col.displayed !== false
      );

      if (firstEditableColumn) {
        setInitialFocusCell({ rowId, columnName: firstEditableColumn.name });
      }

      // Announce editing state change to screen readers
      if (screenReaderAnnouncer) {
        const columnCount = baseColumns.filter((col: Column) => col.name !== COLUMN_NAMES.ACTIONS).length;
        screenReaderAnnouncer.announceEditingStateChange(rowId, true, columnCount);
      }

      // Fetch initialized data in background to get proper values for selectors and other fields
      try {
        const initializedData = await fetchInitialData(rowId, false);
        if (initializedData) {
          // Check if user hasn't made any modifications yet
          const editingData = editingRowUtils.getEditingRowData(rowId);
          if (editingData && Object.keys(editingData.modifiedData).length === 0) {
            // Merge initialized data with original data, prioritizing initialized values
            // This ensures selectors show correct values and identifiers
            const mergedData = {
              ...row.original,
              ...initializedData,
              // Always keep the original ID
              id: row.original.id,
            };

            // Check which column names match with initialized data
            const _columnNames = baseColumns.map((col: Column) => col.name);
            const _initializedFieldNames = Object.keys(initializedData);

            // Update the editing row with enriched data
            editingRowUtils.addEditingRow(rowId, mergedData, false);
          }
        }
      } catch (error) {
        logger.warn(`[InlineEditing] Failed to fetch initialized data for row ${rowId}:`, error);
        // Continue with original data if initialization fails
      }
    },
    [editingRowUtils, screenReaderAnnouncer, baseColumns, fetchInitialData]
  );

  const handleInsertRow = useCallback(async () => {
    // Import utility functions for new row creation
    const { generateNewRowId, createEmptyRowData, insertNewRowAtTop } = await import("./utils/editingRowUtils");

    // Generate a unique ID for the new row
    const newRowId = generateNewRowId();

    // Create empty row data with proper default values based on column metadata
    const emptyRowData = createEmptyRowData(newRowId, baseColumns);

    // Fetch initialized data for new row to get default values and proper field setup
    let finalRowData = emptyRowData;
    try {
      const initializedData = await fetchInitialData(newRowId, true);
      if (initializedData) {
        // Merge empty row data with initialized data, prioritizing initialized values
        finalRowData = {
          ...emptyRowData,
          ...initializedData,
          // Always keep the generated ID for new rows
          id: newRowId,
        };
      }
    } catch (error) {
      logger.warn(`[InlineEditing] Failed to fetch initialized data for new row ${newRowId}:`, error);
      // Continue with empty data if initialization fails
    }

    // Add the new row to editing state first - this automatically sets it to editing mode
    editingRowUtils.addEditingRow(newRowId, finalRowData, true);

    // Set focus to the first editable column for the new row
    const firstEditableColumn = baseColumns.find(
      (col: Column) => col.name !== COLUMN_NAMES.ID && col.name !== COLUMN_NAMES.ACTIONS && col.displayed !== false
    );

    if (firstEditableColumn) {
      setInitialFocusCell({ rowId: newRowId, columnName: firstEditableColumn.name });
    }

    // Add the new row to optimistic records at the top of the grid for immediate visual feedback
    const currentRecords = optimisticRecords.length > 0 ? optimisticRecords : displayRecords;
    const updatedRecords = insertNewRowAtTop(currentRecords, finalRowData);
    setOptimisticRecords(updatedRecords);

    // Announce row insertion to screen readers
    if (screenReaderAnnouncer) {
      screenReaderAnnouncer.announceRowInsertion(newRowId);
    }
  }, [editingRowUtils, optimisticRecords, displayRecords, baseColumns, screenReaderAnnouncer, fetchInitialData]);

  // Validate an entire row before saving
  const validateRow = useCallback(
    async (rowId: string): Promise<boolean> => {
      const editingRowData = editingRowUtils.getEditingRowData(rowId);
      if (!editingRowData) return false;

      // Import validation utilities
      const { validateNewRowForSave, validateExistingRowForSave, validationErrorsToRecord } = await import(
        "./utils/validationUtils"
      );

      // Get the current merged data for validation
      const currentData: EntityData = {
        ...editingRowData.originalData,
        ...editingRowData.modifiedData,
      } as EntityData;

      let validationResult: RowValidationResult;

      // Use tab.fields instead of baseColumns for validation
      // Fields have hqlName which matches how data is stored in rowData
      const fieldsArray = tab.fields ? Object.values(tab.fields) : [];

      if (editingRowData.isNew) {
        // Use stricter validation for new rows
        validationResult = validateNewRowForSave(fieldsArray, currentData);
      } else {
        // Use less strict validation for existing rows
        validationResult = validateExistingRowForSave(
          fieldsArray,
          currentData,
          editingRowData.originalData as EntityData
        );
      }

      // Convert validation errors to record format and update state
      const validationErrors = validationErrorsToRecord(validationResult.errors || []);
      editingRowUtils.setRowValidationErrors(rowId, validationErrors);

      return validationResult.isValid;
    },
    [editingRowUtils, tab.fields]
  );

  /**
   * Format validation errors for display
   */
  const formatValidationErrors = useCallback((validationErrors: Record<string, string | undefined>): string[] => {
    return Object.entries(validationErrors)
      .filter(([_, message]) => message)
      .map(([field, message]) => (field === "_general" ? message || "" : `${field}: ${message || ""}`));
  }, []);

  /**
   * Handle validation errors before save
   */
  const handleValidationErrors = useCallback(
    (rowId: string, editingRowData: EditingRowData) => {
      logger.warn(`[InlineEditing] Cannot save row ${rowId} due to validation errors`);
      const errorMessages = formatValidationErrors(editingRowData.validationErrors);

      if (errorMessages.length > 0) {
        confirmSaveWithErrors(errorMessages, () => {
          // User acknowledged the errors, focus on first error field
        });
      }
    },
    [formatValidationErrors, confirmSaveWithErrors]
  );

  /**
   * Preserve client-side identifiers when merging server data
   */
  const preserveClientSideIdentifiers = useCallback((record: EntityData): Record<string, unknown> => {
    const clientSideIdentifiers: Record<string, unknown> = {};
    for (const key of Object.keys(record)) {
      if (key.endsWith("$_identifier")) {
        clientSideIdentifiers[key] = record[key];
      }
    }
    return clientSideIdentifiers;
  }, []);

  /**
   * Handle successful save operation
   */
  const handleSaveSuccess = useCallback(
    (
      rowId: string,
      editingRowData: EditingRowData,
      saveResult: { data?: EntityData; errors?: unknown[] },
      updatedRecords: EntityData[]
    ) => {
      const finalRecords = updatedRecords.map((record) => {
        if (String(record.id) === rowId || (editingRowData.isNew && record.id === rowId)) {
          const clientSideIdentifiers = preserveClientSideIdentifiers(record);
          return { ...(saveResult.data || {}), ...clientSideIdentifiers };
        }
        return record;
      });
      setOptimisticRecords(finalRecords as EntityData[]);

      editingRowUtils.removeEditingRow(rowId);

      refetch().catch((error: unknown) => {
        logger.warn("[InlineEditing] Failed to refetch after save:", error);
      });

      const successMessage = editingRowData.isNew ? "Created" : "Saved";
      showSuccessModal(successMessage);

      if (screenReaderAnnouncer) {
        screenReaderAnnouncer.announceSaveOperation(rowId, true, editingRowData.isNew);
      }
    },
    [editingRowUtils, refetch, showSuccessModal, screenReaderAnnouncer, preserveClientSideIdentifiers]
  );

  /**
   * Rollback optimistic update
   */
  const rollbackOptimisticUpdate = useCallback(
    (rowId: string, editingRowData: EditingRowData, records: EntityData[]) => {
      if (editingRowData.isNew) {
        const rolledBackRecords = records.filter((record) => String(record.id) !== rowId);
        setOptimisticRecords(rolledBackRecords);
      } else {
        const rolledBackRecords = records.map((record) =>
          String(record.id) === rowId ? editingRowData.originalData : record
        );
        setOptimisticRecords(rolledBackRecords);
      }
    },
    []
  );

  /**
   * Handle save errors from server
   */
  const handleSaveErrors = useCallback(
    (
      rowId: string,
      editingRowData: EditingRowData,
      saveResult: SaveResult,
      updatedRecords: EntityData[],
      processSaveErrors: (errors: ValidationError[]) => Record<string, string | undefined>,
      getGeneralErrorMessage: (errors: ValidationError[]) => string | undefined
    ) => {
      rollbackOptimisticUpdate(rowId, editingRowData, updatedRecords);

      const fieldErrors = processSaveErrors(saveResult.errors ?? []);
      const generalError = getGeneralErrorMessage(saveResult.errors ?? []);

      editingRowUtils.setRowValidationErrors(rowId, fieldErrors);

      if (generalError) {
        logger.error(`[InlineEditing] Save failed with general error: ${generalError}`);
        showErrorModal(generalError);
      }

      editingRowUtils.setRowSaving(rowId, false);
      logger.warn(`[InlineEditing] Save failed for row ${rowId} due to server validation errors`);

      if (screenReaderAnnouncer) {
        screenReaderAnnouncer.announceSaveOperation(rowId, false, editingRowData.isNew);
      }
    },
    [editingRowUtils, showErrorModal, screenReaderAnnouncer, rollbackOptimisticUpdate]
  );

  /**
   * Handle unexpected errors during save
   */
  const handleSaveException = useCallback(
    (rowId: string, editingRowData: EditingRowData, error: unknown) => {
      const currentRecords = optimisticRecords.length > 0 ? optimisticRecords : displayRecords;
      rollbackOptimisticUpdate(rowId, editingRowData, currentRecords);

      logger.error(`[InlineEditing] Failed to save row ${rowId}:`, error);
      editingRowUtils.setRowSaving(rowId, false);

      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      editingRowUtils.setRowValidationErrors(rowId, {
        _general: errorMessage,
      });

      showErrorModal(errorMessage);

      if (screenReaderAnnouncer) {
        screenReaderAnnouncer.announceSaveOperation(rowId, false, editingRowData?.isNew || false);
      }
    },
    [
      editingRowUtils,
      showErrorModal,
      screenReaderAnnouncer,
      optimisticRecords,
      displayRecords,
      rollbackOptimisticUpdate,
    ]
  );

  const handleSaveRow = useCallback(
    async (rowId: string) => {
      const editingRowData = editingRowUtils.getEditingRowData(rowId);
      if (!editingRowData) return;

      const isValid = await validateRow(rowId);
      if (!isValid) {
        handleValidationErrors(rowId, editingRowData);
        return;
      }

      try {
        editingRowUtils.setRowSaving(rowId, true);

        const {
          saveRecordWithRetry,
          createSaveOperation,
          processSaveErrors,
          getGeneralErrorMessage,
          validateRecordBeforeSave,
        } = await import("./utils/saveOperations");
        const { createOptimisticUpdateManager } = await import("./utils/optimisticUpdates");

        const optimisticManager = createOptimisticUpdateManager();
        const saveOperation = createSaveOperation(rowId, editingRowData);

        const validationResult = validateRecordBeforeSave(saveOperation, baseColumns);
        if (!validationResult.canSave) {
          logger.warn(`[InlineEditing] Final validation failed for row ${rowId}:`, validationResult.errors);
          const fieldErrors = processSaveErrors(validationResult.errors);
          editingRowUtils.setRowValidationErrors(rowId, {
            ...editingRowData.validationErrors,
            ...fieldErrors,
          });
          editingRowUtils.setRowSaving(rowId, false);
          return;
        }

        const optimisticUpdate = editingRowData.isNew
          ? optimisticManager.createOptimisticCreate(rowId, editingRowData)
          : optimisticManager.createOptimisticUpdate(rowId, editingRowData);

        const currentRecords = optimisticRecords.length > 0 ? optimisticRecords : displayRecords;
        const updatedRecords = optimisticManager.applyOptimisticUpdate(currentRecords, optimisticUpdate);
        setOptimisticRecords(updatedRecords);

        const saveResult = await saveRecordWithRetry({
          saveOperation,
          tab,
          windowMetadata: undefined,
          userId: user?.id || "",
          maxRetries: 2,
        });

        if (saveResult.success && saveResult.data) {
          handleSaveSuccess(rowId, editingRowData, saveResult, updatedRecords);
        } else if (saveResult.errors) {
          handleSaveErrors(
            rowId,
            editingRowData,
            saveResult,
            updatedRecords,
            processSaveErrors,
            getGeneralErrorMessage
          );
        }
      } catch (error) {
        handleSaveException(rowId, editingRowData, error);
      }
    },
    [
      editingRowUtils,
      validateRow,
      handleValidationErrors,
      baseColumns,
      optimisticRecords,
      displayRecords,
      tab,
      user?.id,
      handleSaveSuccess,
      handleSaveErrors,
      handleSaveException,
    ]
  );

  const handleCancelRow = useCallback(
    async (rowId: string) => {
      const editingRowData = editingRowUtils.getEditingRowData(rowId);
      if (!editingRowData) return;

      // Check if there are unsaved changes
      const hasUnsavedChanges = editingRowData.hasUnsavedChanges;

      const performCancel = async () => {
        try {
          // Import cancel operations and utility functions dynamically
          const { handleCancelOperation } = await import("./utils/cancelOperations");
          const { removeNewRowFromRecords } = await import("./utils/editingRowUtils");

          await handleCancelOperation({
            rowId,
            editingRowData,
            removeEditingRow: editingRowUtils.removeEditingRow,
            showConfirmation: false, // We handle confirmation ourselves
            onConfirm: () => {
              // Remove from optimistic records when canceling
              const currentRecords = optimisticRecords.length > 0 ? optimisticRecords : displayRecords;
              if (editingRowData.isNew) {
                // For new rows, remove from optimistic records using utility function
                const updatedRecords = removeNewRowFromRecords(currentRecords, rowId);
                setOptimisticRecords(updatedRecords);
              } else {
                // For existing rows, restore original data if it was modified
                const hasOptimisticChanges = currentRecords.some(
                  (record: EntityData) => String(record.id) === rowId && record !== editingRowData.originalData
                );

                if (hasOptimisticChanges) {
                  const updatedRecords = currentRecords.map((record: EntityData) =>
                    String(record.id) === rowId ? editingRowData.originalData : record
                  );
                  setOptimisticRecords(updatedRecords);
                }
              }
            },
          });
        } catch (error) {
          // Error occurred during cancel operation
          logger.error(`[InlineEditing] Error during cancel operation for row ${rowId}:`, error);
        }
      };

      // Show confirmation dialog if there are unsaved changes
      confirmDiscardChanges(
        performCancel,
        () => {
          // User chose to keep editing
        },
        hasUnsavedChanges
      );
    },
    [editingRowUtils, optimisticRecords, displayRecords, confirmDiscardChanges]
  );

  // Throttled cell value change handler to prevent excessive updates
  const handleCellValueChange = useThrottledCallback(
    (rowId: string, fieldName: string, value: unknown, optionData?: Record<string, unknown>, field?: Field) => {
      performanceMonitor.measure(`cell-value-change-${fieldName}`, () => {
        // Log incoming parameters to debug

        // Determine the key used for validation (usually field.name/columnName)
        // If field is provided, use its name, otherwise fallback to fieldName (which is fieldKey)
        const validationKey = field?.name || fieldName;

        // Update the cell value immediately
        // Pass validationKey to ensure the correct error is cleared
        editingRowUtils.updateCellValue(rowId, fieldName, value, validationKey);

        // For TABLEDIR fields, also store the identifier and any nested field values
        // Note: We don't create synthetic entries here for user selections,
        // only for callout values, to avoid overwriting the full options list
        if (optionData && typeof optionData === "object") {
          const optionLabel = "label" in optionData ? optionData.label : undefined;
          if (optionLabel) {
            editingRowUtils.updateCellValue(rowId, `${fieldName}$_identifier`, optionLabel);
          }

          // Store any nested field values (like product$id for ProductByPriceAndWarehouse)
          // These are needed for proper payload construction
          for (const [key, val] of Object.entries(optionData)) {
            // Skip already saved fields and metadata fields
            if (key === "id" || key === "value" || key === "label" || key.startsWith("_")) continue;

            // Save nested fields that might be needed (like product$id, bpid, etc.)
            if (key.includes("$")) {
              editingRowUtils.updateCellValue(rowId, key, val);
            }
          }
        }

        // Trigger debounced validation for real-time feedback
        // Use fieldName (fieldKey) to lookup the field mapping in debouncedValidateField
        // The function will internally use field.name as the validation error key
        debouncedValidateField(rowId, fieldName, value);

        // Execute callout if field has one
        // Use the provided field object if available, otherwise try to find by name
        const fieldForCallout = field || getFieldByName(fieldName);

        if (fieldForCallout?.column.callout) {
          executeInlineCallout(rowId, fieldForCallout, value, optionData).catch((error) => {
            logger.error(`[InlineCallout] Error executing callout for ${fieldName}:`, error);
          });
        }
      });
    },
    50
  ); // Throttle to max 20 updates per second

  // Context menu action handlers
  const handleContextMenuEditRow = useCallback(() => {
    if (contextMenu.row) {
      handleEditRow(contextMenu.row);
    }
  }, [contextMenu.row, handleEditRow]);

  const handleContextMenuInsertRow = useCallback(() => {
    handleInsertRow();
  }, [handleInsertRow]);

  const handleContextMenuNewRecord = useCallback(() => {
    // Open form view in new mode
    setRecordId(NEW_RECORD_ID);
  }, [setRecordId]);

  const renderFirstColumnCell = useCallback(
    ({
      renderedCellValue,
      row,
      table,
      originalCell,
      shouldUseTreeMode,
    }: {
      renderedCellValue: React.ReactNode;
      row: MRT_Row<EntityData>;
      table: MRT_TableInstance<EntityData>;
      originalCell?: unknown;
      shouldUseTreeMode: boolean;
    }) => {
      const hasChildren = row.original.showDropIcon === true;
      const canExpand = shouldUseTreeMode && hasChildren;
      const isExpanded = row.getIsExpanded();
      const isSelected = row.getIsSelected();
      const eTMETAIcon = row.original.eTMETAIcon as string | undefined;
      const isSummary = row.original.summaryLevel === true;

      const expandIcon = getExpandIcon(canExpand, isExpanded);
      const HierarchyIcon = getHierarchyIcon(shouldUseTreeMode, eTMETAIcon, hasChildren, isExpanded);

      if (shouldUseTreeMode) {
        return (
          <div className="flex items-center gap-2 w-full">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (canExpand) {
                    row.toggleExpanded();
                  }
                }}
                className="bg-transparent border-0 cursor-pointer p-0.5 flex items-center justify-center min-w-5 min-h-5 rounded-full shadow-[0px_2.5px_6.25px_0px_rgba(0,3,13,0.1)]">
                {expandIcon}
              </button>
            ) : (
              <div className="w-5 h-5" />
            )}
            <div className="relative flex items-end">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  row.toggleSelected();
                }}
                className="min-w-4 min-h-4 cursor-pointer rounded border-[1.67px] border-[rgba(0,3,13,0.4)] appearance-none bg-white checked:bg-[#004ACA] checked:border-[#004ACA]"
              />
              {isSelected && (
                <CheckIcon
                  className="absolute top-0.5 left-0.5 w-3 h-3 pointer-events-none fill-white"
                  data-testid="CheckIcon__8ca888"
                />
              )}
            </div>
            {HierarchyIcon}
            <span className={`flex-1 ${isSummary ? "font-bold" : ""}`}>
              {originalCell && typeof originalCell === "function"
                ? originalCell({ renderedCellValue, row, table })
                : renderedCellValue}
            </span>
          </div>
        );
      }

      return (
        <span className={`flex-1 ${isSummary ? "font-bold" : ""}`}>
          {originalCell && typeof originalCell === "function"
            ? originalCell({ renderedCellValue, row, table })
            : renderedCellValue}
        </span>
      );
    },
    []
  );

  // Stable Cell renderer for actions column - extracted to prevent component remounts
  const renderActionsColumnCell = useCallback(
    ({ row }: { row: MRT_Row<EntityData> }) => (
      <ActionsColumnCell
        row={row}
        editingRowUtils={editingRowUtils}
        handleEditRow={handleEditRow}
        handleSaveRow={handleSaveRow}
        handleCancelRow={handleCancelRow}
        setRecordId={setRecordId}
        data-testid="ActionsColumnCell__8ca888"
      />
    ),
    [editingRowUtils, handleEditRow, handleSaveRow, handleCancelRow, setRecordId]
  );

  // Stable Cell renderer for data columns - reads column metadata from column object
  // This avoids creating new inline functions in the columns useMemo
  const renderDataColumnCell = useCallback(
    ({
      renderedCellValue,
      row,
      table,
      column,
    }: {
      renderedCellValue: React.ReactNode;
      row: MRT_Row<EntityData>;
      table: MRT_TableInstance<EntityData>;
      column: MRT_Column<EntityData>;
    }) => {
      // Access column metadata stored during column mapping
      // Cast through unknown first to satisfy TypeScript's overlap check
      const columnDef = column.columnDef as unknown as Column & {
        _originalCell?: (props: {
          renderedCellValue: React.ReactNode;
          row: MRT_Row<EntityData>;
          table: MRT_TableInstance<EntityData>;
        }) => React.ReactNode;
        _columnRef: Column;
        _shouldUseTreeMode?: boolean;
      };
      const col = columnDef._columnRef;
      const originalCell = columnDef._originalCell;
      const shouldUseTreeMode = columnDef._shouldUseTreeMode ?? false;

      // Create the base cell content using DataColumnCell
      const cellContent = (
        <DataColumnCell
          renderedCellValue={renderedCellValue}
          row={row}
          table={table}
          col={col}
          originalCell={originalCell}
          editingRowUtils={editingRowUtils}
          columnFieldMappings={columnFieldMappings}
          initialFocusCell={initialFocusCell}
          session={session}
          keyboardNavigationManager={keyboardNavigationManager}
          handleCellValueChange={handleCellValueChange}
          validateFieldOnBlur={validateFieldOnBlur}
          setInitialFocusCell={setInitialFocusCell}
          loadTableDirOptions={loadTableDirOptions}
          isLoadingTableDirOptions={isLoadingTableDirOptions}
          data-testid="DataColumnCell__8ca888"
        />
      );

      // For the first data column with tree mode, wrap content with tree view controls
      if (shouldUseTreeMode) {
        return renderFirstColumnCell({
          renderedCellValue: cellContent,
          row,
          table,
          originalCell: undefined, // Already handled by DataColumnCell
          shouldUseTreeMode,
        });
      }

      return cellContent;
    },
    [
      editingRowUtils,
      columnFieldMappings,
      initialFocusCell,
      session,
      keyboardNavigationManager,
      handleCellValueChange,
      validateFieldOnBlur,
      loadTableDirOptions,
      isLoadingTableDirOptions,
      renderFirstColumnCell,
    ]
  );

  // Use optimistic records if available, otherwise use display records
  // Merge optimistic updates with base records while preserving sort order and table features
  const effectiveRecords = useMemo(() => {
    if (optimisticRecords.length === 0) {
      return displayRecords;
    }

    // Use compatibility utility to merge records properly
    return mergeOptimisticRecordsWithSort(displayRecords, optimisticRecords, editingRows);
  }, [optimisticRecords, displayRecords, editingRows]);

  const columns = useMemo(() => {
    if (!baseColumns.length) {
      return baseColumns;
    }

    const modifiedColumns = baseColumns.map((col: Column) => {
      const column = { ...col };
      const originalCell = column.Cell as
        | ((props: {
            renderedCellValue: React.ReactNode;
            row: MRT_Row<EntityData>;
            table: MRT_TableInstance<EntityData>;
          }) => React.ReactNode)
        | undefined;

      // Store metadata on the column for the stable Cell renderer to access
      // This avoids creating new inline functions on each useMemo recalculation
      (column as Column & { _originalCell?: typeof originalCell; _columnRef: Column })._originalCell = originalCell;
      (column as Column & { _columnRef: Column })._columnRef = col;

      // Use stable callback reference instead of inline function
      column.Cell = renderDataColumnCell;

      return column;
    });

    // Add actions column as the first column
    const actionsColumn = {
      id: COLUMN_NAMES.ACTIONS,
      header: "Actions",
      accessorFn: () => "", // Actions column doesn't need data
      columnName: COLUMN_NAMES.ACTIONS,
      name: COLUMN_NAMES.ACTIONS,
      _identifier: COLUMN_NAMES.ACTIONS,
      size: 100,
      minSize: 80,
      maxSize: 120,
      enableSorting: false,
      enableColumnFilter: false,
      enableGlobalFilter: false,
      enableColumnActions: false,
      enableResizing: true,
      enablePinning: false, // Disable user pinning control
      columnDefType: "display" as const,
      referencedTabId: null,
      Cell: renderActionsColumnCell,
    };

    // Insert actions column at the very beginning
    modifiedColumns.unshift(actionsColumn);

    // Apply tree rendering to the first DISPLAYED data column
    // We search for the first column after the actions column (index 0) that is displayed
    const firstDisplayedDataColumnIndex = modifiedColumns.findIndex((col, index) => {
      if (index <= 0) return false;

      // Check column definition visibility
      if (col.displayed === false) return false;

      // Check current visibility state (if defined)
      // Check both id and name as they might be used as keys
      const id = col.id;
      const name = col.name;

      if (tableColumnVisibility) {
        if (name && tableColumnVisibility[name] === false) return false;
        if (id && tableColumnVisibility[id] === false) return false;
      }

      return true;
    });

    if (firstDisplayedDataColumnIndex !== -1) {
      const firstDataColumn = { ...modifiedColumns[firstDisplayedDataColumnIndex] };

      if (shouldUseTreeMode) {
        firstDataColumn.size = 300;
        firstDataColumn.minSize = 250;
        firstDataColumn.maxSize = 500;
      }

      // Store tree mode flag on the column for the stable renderer to access
      (firstDataColumn as Column & { _shouldUseTreeMode: boolean })._shouldUseTreeMode = shouldUseTreeMode;

      modifiedColumns[firstDisplayedDataColumnIndex] = firstDataColumn;
    }

    return modifiedColumns;
  }, [baseColumns, shouldUseTreeMode, renderActionsColumnCell, renderDataColumnCell, tableColumnVisibility]);

  // Helper function to check if a row is being edited

  // Get editing data for a specific row

  // Initialize row selection from URL parameters with proper validation and logging
  const urlBasedRowSelection = useMemo(() => {
    // Use proper URL state management instead of search params
    const windowId = activeWindow?.windowId;
    if (!windowId || windowId !== tab.window) {
      return {};
    }

    // Get the selected record from URL for this specific tab
    const urlSelectedId = getSelectedRecord(activeWindow.windowIdentifier, tab.id);
    if (!urlSelectedId) {
      return {};
    }

    // Validate that the record exists in current dataset
    const recordExists = records?.some((record: EntityData) => String(record.id) === urlSelectedId);
    if (recordExists) {
      return { [urlSelectedId]: true };
    }

    return {};
  }, [activeWindow, getSelectedRecord, tab.id, tab.window, records]);

  /** Track URL selection changes to detect direct navigation */
  useEffect(() => {
    const windowId = activeWindow?.windowId;
    const windowIdentifier = activeWindow?.windowIdentifier;
    if (!windowId || windowId !== tab.window || !windowIdentifier) {
      return;
    }

    const currentURLSelection = getSelectedRecord(windowIdentifier, tab.id);

    // Detect URL-driven navigation (direct links, browser back/forward)
    if (currentURLSelection !== previousURLSelection.current && currentURLSelection) {
      const recordExists = records?.some((record: EntityData) => String(record.id) === currentURLSelection);

      if (recordExists) {
        // Only reset scroll flag if this was NOT a manual selection
        // This prevents jumping when the user manually clicks a row
        if (!isManualSelection.current) {
          hasScrolledToSelection.current = false;
        } else {
          // Reset the manual selection flag for next time
          isManualSelection.current = false;
        }
      } else {
        logger.warn(`[URLNavigation] URL navigation to invalid record: ${currentURLSelection}`);
        // Always try to scroll if we navigated to a record that doesn't exist (might load later)
        hasScrolledToSelection.current = false;
      }
    }

    if (currentURLSelection) {
      previousURLSelection.current = currentURLSelection;
    }
  }, [activeWindow, getSelectedRecord, tab.id, tab.window, records]);

  const handleTableSelectionChange = useCallback(
    (recordId: string) => {
      if (recordId) {
      } else {
      }

      if (onRecordSelection) {
        onRecordSelection(recordId);
      }
    },
    [onRecordSelection, tab.id]
  );

  const rowProps = useCallback<RowProps>(
    ({ row, table }) => {
      const record = row.original as Record<string, never>;
      const isSelected = row.getIsSelected();
      const rowId = String(record.id);
      const editingData = editingRowUtils.getEditingRowData(rowId);
      const isEditing = editingRowUtils.isRowEditing(rowId);
      const hasErrors = editingData ? Object.values(editingData.validationErrors).some((error) => error) : false;
      const isSaving = editingData?.isSaving || false;

      // Determine row CSS classes for visual feedback
      let rowClassName = "";
      if (isEditing) {
        if (isSaving) {
          rowClassName = "table-row-saving";
        } else if (hasErrors) {
          rowClassName = "table-row-error";
        } else {
          rowClassName = "table-row-editing";
        }
      }

      return {
        onClick: (event) => {
          const target = event.target as HTMLElement;
          // Prevent row selection when clicking on input elements or buttons
          if (
            target.tagName === "INPUT" ||
            target.tagName === "BUTTON" ||
            target.closest("button") ||
            target.closest(".inline-edit-cell-container")
          ) {
            return;
          }

          // Don't allow row selection changes while editing (to prevent accidental data loss)
          if (isEditing) {
            return;
          }

          // Clear any existing timeout for this row
          const existingTimeout = clickTimeoutsRef.current.get(rowId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            clickTimeoutsRef.current.delete(rowId);
          }

          // Set a new timeout for single click action
          const timeout = setTimeout(() => {
            isManualSelection.current = true;
            if (event.ctrlKey || event.metaKey) {
              row.toggleSelected();
            } else {
              table.setRowSelection({});
              row.toggleSelected(true);
            }
            clickTimeoutsRef.current.delete(rowId);
          }, 250);

          clickTimeoutsRef.current.set(rowId, timeout);
        },

        onDoubleClick: (event) => {
          const target = event.target as HTMLElement;
          // Prevent form navigation when double-clicking on input elements or buttons
          if (
            target.tagName === "INPUT" ||
            target.tagName === "BUTTON" ||
            target.closest("button") ||
            target.closest(".inline-edit-cell-container")
          ) {
            return;
          }

          // Don't allow form navigation while editing (to prevent data loss)
          if (isEditing) {
            return;
          }

          event.stopPropagation();

          // Cancel ALL pending timeouts to prevent single click execution
          for (const timeout of clickTimeoutsRef.current.values()) {
            clearTimeout(timeout);
            clickTimeoutsRef.current.delete(rowId);
          }
          clickTimeoutsRef.current.clear();

          const parent = graph.getParent(tab);

          // For child tabs, prevent opening form if parent has no selection in URL
          if (parent) {
            const windowIdentifier = activeWindow?.windowIdentifier;
            const parentSelectedInURL = windowIdentifier ? getSelectedRecord(windowIdentifier, parent.id) : undefined;
            if (!parentSelectedInURL) {
              return;
            }
          }

          // Set graph selection for consistency
          const parentSelection = parent ? graph.getSelected(parent) : undefined;
          graph.setSelected(tab, row.original);
          graph.setSelectedMultiple(tab, [row.original]);

          if (parent && parentSelection) {
            setTimeout(() => graph.setSelected(parent, parentSelection), 10);
          }

          // Navigate to form view - this will handle the URL update properly
          setRecordId(record.id);
        },

        // Merge drag & drop handlers for file attachments
        ...getRowDropZoneProps(record as EntityData),

        sx: {
          ...(isSelected && {
            ...sx.rowSelected,
          }),
        },
        className: rowClassName,
        row,
        table,
      };
    },
    [graph, setRecordId, sx.rowSelected, tab, editingRowUtils, getRowDropZoneProps]
  );

  const renderEmptyRowsFallback = useCallback(
    ({ table }: { table: MRT_TableInstance<EntityData> }) => (
      <EmptyState
        table={table}
        onContextMenu={handleTableBodyContextMenu}
        onInsertRow={handleInsertRow}
        data-testid="EmptyState__8ca888"
      />
    ),
    [handleTableBodyContextMenu, handleInsertRow]
  );

  const fetchMoreOnBottomReached = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      handleScroll(event);
      const containerRefElement = event.target as HTMLDivElement;

      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        // Ensure the container has height (is visible) and has scrollable content before fetching more
        if (
          clientHeight > 0 &&
          scrollHeight > clientHeight &&
          scrollHeight - scrollTop - clientHeight < 10 &&
          !loading &&
          hasMoreRecords
        ) {
          fetchMore();
        }
      }
    },
    [fetchMore, hasMoreRecords, loading, handleScroll]
  );

  // Generate ARIA attributes for the table container
  const editingRowsCount = Object.keys(editingRows).length;
  const tableAriaAttributes = useMemo(
    () => generateAriaAttributes.tableContainer(effectiveRecords.length, editingRowsCount),
    [effectiveRecords.length, editingRowsCount]
  );

  const muiTablePaperProps = useMemo(
    () => ({
      sx: sx.tablePaper,
      ...tableAriaAttributes,
    }),
    [sx.tablePaper, tableAriaAttributes]
  );

  const muiTableHeadCellPropsWithContextMenu = useCallback(
    ({ column }: { column: MRT_Column<EntityData>; table: MRT_TableInstance<EntityData> }) => ({
      sx: {
        ...sx.tableHeadCell,
      },
      onContextMenu: (e: React.MouseEvent<HTMLElement>) => handleHeaderContextMenu(e, column),
    }),
    [sx.tableHeadCell, handleHeaderContextMenu]
  );

  const muiTableContainerProps = useMemo(
    () => ({
      ref: tableContainerRef,
      sx: { flex: 1, maxHeight: "100%" },
      onScroll: fetchMoreOnBottomReached,
    }),
    [fetchMoreOnBottomReached]
  );

  const muiSelectAllCheckboxProps = useMemo(() => {
    if (hasMoreRecords || editingRowsCount > 0) {
      return {
        disabled: true,
        sx: {
          "&.Mui-disabled": {
            pointerEvents: "auto",
            cursor: "not-allowed",
          },
        },
        title: editingRowsCount > 0 ? "Select All disabled during editing" : t("table.selectAll.disabledTooltip"),
      };
    }
    return {
      disabled: false,
      title: t("table.selectAll.enabledTooltip"),
    };
  }, [hasMoreRecords, editingRowsCount, t]);

  const handleColumnFiltersChange = useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      // Check if filtering is safe with current editing state - use ref to avoid dependency
      if (!canFilterWithEditingRows(editingRowsRef.current)) {
        logger.warn("[TableCompatibility] Filtering blocked due to unsaved changes");
        return;
      }
      handleMRTColumnFiltersChange(updaterOrValue);
    },
    [handleMRTColumnFiltersChange]
  );

  const handleColumnVisibilityChange = useCallback(
    (updaterOrValue: MRT_VisibilityState | ((prev: MRT_VisibilityState) => MRT_VisibilityState)) => {
      // Manage initial visibility to avoid overwriting saved state on first render
      if (!hasInitialColumnVisibility) {
        setHasInitialColumnVisibility(true);
        const isEmptyVisibility = isEmptyObject(tableColumnVisibility);
        if (!isEmptyVisibility) return;
      }
      handleMRTColumnVisibilityChange(updaterOrValue);
    },
    [hasInitialColumnVisibility, tableColumnVisibility, handleMRTColumnVisibilityChange]
  );

  const handleSortingChange = useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      // Check if sorting is safe with current editing state - use ref to avoid dependency
      if (!canSortWithEditingRows(editingRowsRef.current)) {
        logger.warn("[TableCompatibility] Sorting blocked due to unsaved changes");
        return;
      }
      handleMRTSortingChange(updaterOrValue);
    },
    [handleMRTSortingChange]
  );

  const handleExpandedChange = useCallback(
    (newExpanded: Updater<ExpandedState>) => {
      handleMRTExpandChange({ newExpanded });
    },
    [handleMRTExpandChange]
  );

  const handleGetRowCanExpand = useCallback(
    (row: unknown) => {
      return getCurrentRowCanExpand({ row: row as MRT_Row<EntityData>, shouldUseTreeMode });
    },
    [shouldUseTreeMode]
  );

  // Memoize the expanded state to avoid creating new empty objects
  const expandedState = useMemo(() => {
    return shouldUseTreeMode ? expanded : {};
  }, [shouldUseTreeMode, expanded]);

  // Memoize the entire state object to prevent unnecessary re-renders
  const tableState = useMemo(
    () => ({
      columnFilters: tableColumnFilters,
      columnVisibility: tableColumnVisibility,
      sorting: tableColumnSorting,
      columnOrder: tableColumnOrder,
      expanded: expandedState,
      showColumnFilters: true,
      showProgressBars: loading,
    }),
    [tableColumnFilters, tableColumnVisibility, tableColumnSorting, tableColumnOrder, expandedState, loading]
  );

  // Memoize initialState to avoid creating new objects
  const initialState = useMemo(
    () => ({
      density: "compact" as const,
      rowSelection: urlBasedRowSelection,
    }),
    [urlBasedRowSelection]
  );

  // Memoize muiTableBodyCellProps callback
  const muiTableBodyCellProps = useCallback(
    (props: { column: MRT_Column<EntityData>; row: MRT_Row<EntityData>; cell: MRT_Cell<EntityData> }) => {
      const currentValue = props.cell.getValue();
      const currentTitle = getCellTitle(currentValue);
      return {
        sx: getMUITableBodyCellProps({
          shouldUseTreeMode,
          sx,
          columns,
          column: props.column,
          row: props.row,
        }),
        onContextMenu: (event: React.MouseEvent<HTMLTableCellElement>) => {
          handleCellContextMenu(event, props.cell, props.row);
        },
        title: currentTitle,
      };
    },
    [shouldUseTreeMode, sx, columns, handleCellContextMenu]
  );

  // Memoize muiTableBodyProps
  const muiTableBodyProps = useMemo(() => ({ sx: sx.tableBody }), [sx.tableBody]);

  // Memoize displayColumnDefOptions
  const displayColumnDefOptions = useMemo(() => getDisplayColumnDefOptions({ shouldUseTreeMode }), [shouldUseTreeMode]);

  const table = useMaterialReactTable<EntityData>({
    muiTablePaperProps,
    muiTableHeadCellProps: muiTableHeadCellPropsWithContextMenu,
    muiTableBodyCellProps,
    defaultColumn: {
      minSize: 60,
    },
    displayColumnDefOptions,
    muiTableBodyProps,
    layoutMode: "semantic",
    enableGlobalFilter: false,
    columns,
    data: effectiveRecords,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    muiSelectAllCheckboxProps,
    positionToolbarAlertBanner: "none",
    muiTableBodyRowProps: rowProps,
    muiTableContainerProps,
    enablePagination: false,
    enableStickyHeader: true,
    enableStickyFooter: false,
    enableColumnVirtualization: true,
    enableRowVirtualization: canUseVirtualScrollingWithEditing(editingRows, effectiveRecords.length),
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enableExpanding: shouldUseTreeMode,
    paginateExpandedRows: false,
    getRowCanExpand: handleGetRowCanExpand,
    initialState: {
      ...initialState,
      columnPinning: { left: ["mrt-row-select", COLUMN_NAMES.ACTIONS] },
    },
    renderDetailPanel: undefined,
    onExpandedChange: handleExpandedChange,
    state: tableState,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onSortingChange: handleSortingChange,
    onColumnOrderChange: handleMRTColumnOrderChange,
    getRowId,
    enableColumnFilters: !areFiltersDisabled,
    enableSorting: true,
    enableColumnResizing: true,
    enableColumnActions: true,
    manualFiltering: true,
    manualSorting: true,
    enableColumnOrdering: true,
    enableColumnPinning: true,
    renderEmptyRowsFallback,
    enableTableFooter: false,
    // @ts-ignore
    autoResetRowSelection: false,
  });

  useTableSelection(tab, effectiveRecords, table.getState().rowSelection, handleTableSelectionChange);

  // Use ref for table to prevent infinite loop of registrations
  const tableRef = useRef(table);
  tableRef.current = table;

  // Register attachment action for toolbar to handle interactions from TableView
  useEffect(() => {
    if (registerAttachmentAction && isVisible) {
      registerAttachmentAction(() => {
        const currentSelection = tableRef.current.getState().rowSelection;
        // Filter keys where value is true to ensure valid selection
        const selectedIds = Object.keys(currentSelection).filter((key) => currentSelection[key]);

        if (selectedIds.length === 1) {
          const recordId = selectedIds[0];
          setShouldOpenAttachmentModal(true);
          setRecordId(recordId);
        } else if (selectedIds.length === 0) {
          showErrorModal(t("status.selectRecordError"));
        } else {
          showErrorModal(t("status.selectSingleRecordError"));
        }
      });
    }
  }, [registerAttachmentAction, setShouldOpenAttachmentModal, setRecordId, showErrorModal, t, isVisible]);

  // Initialize keyboard navigation manager - use a ref to avoid dependency issues
  const keyboardManagerRef = useRef<KeyboardNavigationManager | null>(null);

  useEffect(() => {
    if (!keyboardManagerRef.current && table) {
      const manager = createKeyboardNavigationManager({
        onSaveRow: handleSaveRow,
        onCancelRow: handleCancelRow,
        isRowEditing: editingRowUtils.isRowEditing,
        getEditingRowIds: editingRowUtils.getEditingRowIds,
        table: table,
      });
      keyboardManagerRef.current = manager;
      setKeyboardNavigationManager(manager);
    }
  }, [table]); // Only depend on table

  // Cleanup keyboard navigation manager on unmount
  useEffect(() => {
    return () => {
      if (keyboardManagerRef.current) {
        keyboardManagerRef.current.destroy();
        keyboardManagerRef.current = null;
      }
    };
  }, []);

  // Handle auto-scroll to selected record with virtualization support
  useLayoutEffect(() => {
    const windowId = activeWindow?.windowId;
    const windowIdentifier = activeWindow?.windowIdentifier;

    if (!windowId || windowId !== tab.window || !displayRecords || !windowIdentifier) {
      return;
    }

    const urlSelectedId = getSelectedRecord(windowIdentifier, tab.id);
    if (!urlSelectedId) {
      return;
    }

    const scrollToIndex = (index: number) => {
      if (!tableContainerRef.current) return;

      try {
        // Use the virtualizer to scroll to the index - this handles variable row heights and prevents drift
        // @ts-ignore - rowVirtualizer is available in the table instance but might be missing from types
        if (table.rowVirtualizer) {
          // @ts-ignore
          table.rowVirtualizer.scrollToIndex(index, { align: "center", behavior: "smooth" });
        } else {
          // Fallback for when virtualizer is not ready (should be rare)
          const containerElement = tableContainerRef.current;
          const estimatedRowHeight = 40; // Approximate row height
          const headerHeight = 75; // Approximate header height
          const scrollTop = index * estimatedRowHeight - containerElement.clientHeight / 2 + headerHeight;

          containerElement.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: "smooth",
          });
        }
      } catch (error) {
        logger.error(`[TableScroll] Error scrolling to selected record: ${error}`);
      }
    };

    // Always mark as scrolled after first attempt, regardless of whether scroll was needed
    if (!hasScrolledToSelection.current && displayRecords.length > 0) {
      hasScrolledToSelection.current = true;

      // Find the index of the selected record in the display records
      const selectedIndex = displayRecords.findIndex((record: EntityData) => String(record.id) === urlSelectedId);

      if (selectedIndex >= 0) {
        scrollToIndex(selectedIndex);
      }
    }
  }, [activeWindow, getSelectedRecord, tab.id, tab.window, displayRecords, table]);

  // Ensure URL selection is maintained when table data changes
  // Sync URL selection to table state
  useEffect(() => {
    const windowId = activeWindow?.windowId;
    const windowIdentifier = activeWindow?.windowIdentifier;
    if (!windowId || windowId !== tab.window || !records || !windowIdentifier) {
      return;
    }

    const urlSelectedId = getSelectedRecord(windowIdentifier, tab.id);
    if (!urlSelectedId) {
      return;
    }

    // Check if URL selection is still valid with current data
    const recordExists = records.some((record: EntityData) => String(record.id) === urlSelectedId);
    const currentSelection = table.getState().rowSelection;
    const isCurrentlySelected = currentSelection[urlSelectedId];

    if (recordExists && !isCurrentlySelected) {
      // Record exists but is not selected - restore URL selection visually
      table.setRowSelection({ [urlSelectedId]: true });
    }
    // We intentionally DO NOT clear the selection if the record doesn't exist in the current data.
    // This allows the selection to persist when filters change or pagination occurs,
    // ensuring that if the record reappears (or if we are just viewing other data),
    // the logical selection remains intact.
  }, [activeWindow, getSelectedRecord, tab.id, tab.window, records, graph, getTabFormState]);

  // Handle browser navigation and direct link access
  // NOTE: Disabled for tabs with children - their selection is handled atomically
  // by setSelectedRecordAndClearChildren in useTableSelection
  useEffect(() => {
    const windowId = activeWindow?.windowId;
    const windowIdentifier = activeWindow?.windowIdentifier;
    if (!windowId || windowId !== tab.window || !records || !windowIdentifier) {
      return;
    }

    // Skip URLNavigation for tabs with children to prevent race conditions
    // Their selection is already handled atomically by useTableSelection
    const children = graph.getChildren(tab);
    if (children && children.length > 0) {
      return;
    }

    const urlSelectedId = getSelectedRecord(windowIdentifier, tab.id);
    if (!urlSelectedId) {
      return;
    }

    const currentSelection = table.getState().rowSelection;
    const recordExists = records.some((record: EntityData) => String(record.id) === urlSelectedId);

    if (recordExists) {
      const isCurrentlySelected = currentSelection[urlSelectedId];

      if (!isCurrentlySelected) {
        // Add a small delay to avoid applying stale URL selections during transitions
        const timeoutId = setTimeout(() => {
          // Re-check if this is still the correct selection after the delay
          const latestUrlSelectedId = getSelectedRecord(windowIdentifier, tab.id);
          if (latestUrlSelectedId === urlSelectedId) {
            table.setRowSelection({ [urlSelectedId]: true });
          }
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [activeWindow, getSelectedRecord, tab.id, tab.window, records, graph]);

  /** Restore selection from URL on mount */
  useEffect(() => {
    const windowId = activeWindow?.windowId;
    const windowIdentifier = activeWindow?.windowIdentifier;
    if (!windowId || windowId !== tab.window || !records || hasRestoredSelection.current || !windowIdentifier) {
      return;
    }

    const urlSelectedId = getSelectedRecord(windowIdentifier, tab.id);
    if (!urlSelectedId) {
      return;
    }

    // Check if record exists and restore visual selection if needed
    const recordExists = records.some((record: EntityData) => String(record.id) === urlSelectedId);
    const currentSelection = table.getState().rowSelection;
    const isCurrentlySelected = currentSelection[urlSelectedId];

    if (recordExists && !isCurrentlySelected) {
      table.setRowSelection({ [urlSelectedId]: true });
      hasRestoredSelection.current = true;
    }
  }, [activeWindow, tab.window, records, getSelectedRecord, tab.id]);

  useEffect(() => {
    const handleGraphClear = (eventTab: typeof tab) => {
      if (eventTab.id === tabId) {
        table.setRowSelection({});
      }
    };

    graph.addListener("unselected", handleGraphClear);
    graph.addListener("unselectedMultiple", handleGraphClear);

    return () => {
      graph.removeListener("unselected", handleGraphClear);
      graph.removeListener("unselectedMultiple", handleGraphClear);
    };
  }, [graph, tabId, tab.id]);

  // Clear editing state and performance optimizations when records change or component unmounts
  useEffect(() => {
    return () => {
      // Clear all editing state on unmount
      editingRowUtils.clearAllEditingRows();
      // Clear optimistic records on unmount
      setOptimisticRecords([]);
      // Clear memory manager cache
      memoryManager.clear();
    };
  }, [editingRowUtils, memoryManager]);

  // Reset optimistic records when base display records change significantly
  useEffect(() => {
    // If we have optimistic records but the base records have changed significantly,
    // we should reset to avoid inconsistencies
    // Use a callback to get current optimistic records state to avoid dependency loop
    setOptimisticRecords((currentOptimistic) => {
      if (currentOptimistic.length === 0 || displayRecords.length === 0) {
        return currentOptimistic;
      }

      const baseRecordIds = new Set(displayRecords.map((record: EntityData) => String(record.id)));
      const optimisticRecordIds = new Set(currentOptimistic.map((record) => String(record.id)));

      // Check if there are significant differences (excluding new rows)
      const nonNewOptimisticIds = Array.from(optimisticRecordIds).filter((id) => !id.startsWith("new_"));
      const hasSignificantDifferences = nonNewOptimisticIds.some((id) => !baseRecordIds.has(id));

      if (hasSignificantDifferences) {
        return [];
      }

      return currentOptimistic;
    });
  }, [displayRecords]);

  // Clear editing state for rows that no longer exist in the data
  useEffect(() => {
    const currentEditingRowIds = editingRowUtils.getEditingRowIds();
    const existingRowIds = new Set(records?.map((record: EntityData) => String(record.id)) || []);

    for (const editingRowId of currentEditingRowIds) {
      // Skip new rows (they won't exist in records yet)
      if (editingRowId.startsWith("new_")) continue;

      if (!existingRowIds.has(editingRowId)) {
        editingRowUtils.removeEditingRow(editingRowId);
      }
    }
  }, [records, editingRowUtils]);

  // Add keyboard support for canceling edits with Escape key
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const editingRowIds = editingRowUtils.getEditingRowIds();

        // If there are editing rows, cancel the first one using handleCancelRow
        // This ensures we use the confirmation modal instead of window.confirm
        if (editingRowIds.length > 0) {
          const rowId = editingRowIds[0]; // Cancel the first editing row
          await handleCancelRow(rowId);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingRowUtils, handleCancelRow]);

  useEffect(() => {
    if (removeRecordLocally) {
      registerDatasource(tabId, removeRecordLocally);
    }

    registerRefetchFunction(tabId, refetch);

    // Register records getter for navigation
    registerRecordsGetter(tabId, () => records);

    // Register hasMoreRecords getter
    registerHasMoreRecordsGetter(tabId, () => hasMoreRecords);

    // Register fetchMore function
    if (fetchMore) {
      registerFetchMore(tabId, fetchMore);
    }

    // Register in-place record update functions for FormView save integration
    registerUpdateRecord(tabId, updateRecordLocally);
    registerAddRecord(tabId, addRecordLocally);

    return () => {
      unregisterDatasource(tabId);
    };
  }, [
    tabId,
    removeRecordLocally,
    registerDatasource,
    unregisterDatasource,
    registerRefetchFunction,
    registerRecordsGetter,
    registerHasMoreRecordsGetter,
    registerFetchMore,
    registerUpdateRecord,
    registerAddRecord,
    updateRecordLocally,
    addRecordLocally,
    refetch,
    records,
    hasMoreRecords,
    fetchMore,
  ]);

  useEffect(() => {
    registerActions({
      refresh: refetch,
      filter: toggleImplicitFilters,
      save: async () => {},
      columnFilters: toggleColumnsDropdown,
    });
  }, [refetch, registerActions, toggleImplicitFilters, toggleColumnsDropdown]);

  // Register table's refetch function with TabRefreshContext
  // This allows triggering table refresh after save operations in FormView
  useEffect(() => {
    registerRefresh(tab.tabLevel, REFRESH_TYPES.TABLE, refetch);
  }, [tab.tabLevel, registerRefresh, refetch]);

  // Register attachment action for toolbar to handle interactions from TableView
  useEffect(() => {
    logger.info("[Table] Attachment action effect triggered", { isVisible, hasRegisterFn: !!registerAttachmentAction });

    // Only register the attachment action when the table is visible
    if (registerAttachmentAction && isVisible) {
      logger.info("[Table] Registering attachment action");
      registerAttachmentAction(() => {
        logger.info("[Table] Attachment action triggered");
        const currentSelection = table.getState().rowSelection;
        const selectedIds = Object.keys(currentSelection);

        if (selectedIds.length === 1) {
          const recordId = selectedIds[0];
          logger.info("[Table] Navigating to FormView with recordId:", recordId);
          setShouldOpenAttachmentModal(true);
          setRecordId(recordId);
        } else if (selectedIds.length === 0) {
          showErrorModal(t("status.selectRecordError"));
        } else {
          showErrorModal(t("status.selectSingleRecordError"));
        }
      });
    }

    return () => {
      // Clean up the attachment action when table becomes invisible or unmounts
      logger.info("[Table] Cleanup attachment action", { isVisible });
      if (registerAttachmentAction && isVisible) {
        registerAttachmentAction(undefined);
      }
    };
  }, [registerAttachmentAction, table, setShouldOpenAttachmentModal, setRecordId, showErrorModal, t, isVisible]);

  // Apply pending selection after data refresh
  useEffect(() => {
    if (pendingSelectionId && table && !loading && !isUploading) {
      // Small timeout to ensure data is fully loaded in MRT
      const timer = setTimeout(() => {
        table.setRowSelection({ [pendingSelectionId]: true });
        setPendingSelectionId(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pendingSelectionId, table, loading, isUploading]);

  if (error) {
    return (
      <ErrorDisplay
        title={t("errors.tableError.title")}
        description={error?.message}
        showRetry
        onRetry={refetch}
        data-testid="ErrorDisplay__8ca888"
      />
    );
  }

  if (parentTab && !parentRecord) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-lg mb-2">{t("errors.selectionError.title")}</div>
          <div className="text-sm">{t("errors.selectionError.description")}</div>
        </div>
      </div>
    );
  }

  // Calculate counter values
  const selectedRecords = Object.keys(table.getState().rowSelection).filter((id) => table.getState().rowSelection[id]);
  const selectedCount = selectedRecords.length;
  const loadedRecords = displayRecords.length;
  const totalRecords = hasMoreRecords ? loadedRecords + 1 : loadedRecords; // Approximate total when more records available

  // Prepare labels for RecordCounterBar with translations
  const counterLabels = {
    showingRecords: t("table.counter.showingRecords"),
    showingPartialRecords: t("table.counter.showingPartialRecords"),
    selectedRecords: t("table.counter.selectedRecords"),
    recordsLoaded: t("table.counter.recordsLoaded"),
  };

  return (
    <div
      className={`h-full overflow-hidden rounded-3xl transition-opacity flex flex-col ${
        loading ? "opacity-60 cursor-progress cursor-to-children" : "opacity-100"
      }`}>
      <RecordCounterBar
        totalRecords={totalRecords}
        loadedRecords={loadedRecords}
        selectedCount={selectedCount}
        isLoading={loading}
        labels={counterLabels}
        data-testid="RecordCounterBar__8ca888"
      />
      <div className="flex-1 min-h-0" onContextMenu={handleTableBodyContextMenu}>
        <MaterialReactTable table={table} data-testid="MaterialReactTable__8ca888" />
      </div>
      <SummaryRow
        table={table}
        summaryState={summaryState}
        summaryResult={summaryResult}
        isSummaryLoading={isSummaryLoading}
        tableContainerRef={tableContainerRef as React.RefObject<HTMLDivElement>}
        data-testid="SummaryRow__8ca888"
      />
      <ColumnVisibilityMenu
        anchorEl={columnMenuAnchor}
        onClose={handleCloseColumnMenu}
        table={table}
        data-testid="ColumnVisibilityMenu__8ca888"
      />
      <CellContextMenu
        anchorEl={contextMenu.anchorEl}
        onClose={handleCloseContextMenu}
        cell={contextMenu.cell}
        row={contextMenu.row}
        onFilterByValue={handleFilterByValue}
        columns={baseColumns}
        onEditRow={handleContextMenuEditRow}
        onInsertRow={handleContextMenuInsertRow}
        onNewRecord={handleContextMenuNewRecord}
        canEdit={true}
        isRowEditing={contextMenu.row ? editingRowUtils.isRowEditing(String(contextMenu.row.original.id)) : false}
        areFiltersDisabled={areFiltersDisabled}
        data-testid="CellContextMenu__8ca888"
      />
      <StatusModal
        open={confirmationState.isOpen}
        statusType={confirmationState.statusType}
        statusText={
          confirmationState.statusType === "error"
            ? confirmationState.title
            : `${confirmationState.title}\n\n${confirmationState.message}`
        }
        errorMessage={confirmationState.statusType === "error" ? confirmationState.message : undefined}
        saveLabel={confirmationState.confirmText || "OK"}
        secondaryButtonLabel={confirmationState.showCancel ? confirmationState.cancelText : undefined}
        onSave={confirmationState.onConfirm}
        onCancel={confirmationState.onCancel}
        onClose={confirmationState.onCancel}
        isDeleteSuccess={false}
        data-testid="ConfirmationDialog__8ca888"
      />
      <StatusModal
        open={statusModal.open}
        statusType={statusModal.statusType}
        statusText={statusModal.statusText}
        onClose={hideStatusModal}
        onAfterClose={() => {
          if ("onAfterClose" in statusModal && typeof statusModal.onAfterClose === "function") {
            statusModal.onAfterClose();
          }
        }}
        saveLabel={statusModal.saveLabel}
        secondaryButtonLabel={statusModal.secondaryButtonLabel}
        errorMessage={statusModal.errorMessage}
        isDeleteSuccess={statusModal.isDeleteSuccess}
        data-testid="StatusModal__8ca888"
      />
      <HeaderContextMenu
        anchorEl={headerContextMenuAnchor}
        onClose={handleCloseHeaderContextMenu}
        column={headerContextMenuColumn}
        onSetSummary={handleSetSummary}
        onRemoveSummary={handleRemoveSummary}
        activeSummary={summaryState}
        data-testid="HeaderContextMenu__8ca888"
      />
      <AddAttachmentModal
        open={dropUploadState.isOpen}
        onClose={() =>
          setDropUploadState({
            isOpen: false,
            file: null,
            recordId: null,
            recordIdentifier: undefined,
          })
        }
        onUpload={handleTableUpload}
        initialFile={dropUploadState.file}
        isLoading={isUploading}
        recordIdentifier={dropUploadState.recordIdentifier}
        data-testid="AddAttachmentModal__8ca888"
      />
      {/* Visual Overlay for Drop Zone */}
      {dropTargetState && (
        <div
          className="drop-target-overlay"
          style={{
            position: "fixed",
            top: dropTargetState.rect.top,
            left: dropTargetState.rect.left,
            width: dropTargetState.rect.width,
            height: dropTargetState.rect.height,
            pointerEvents: "none", // Ensure drops fall through to the row
            zIndex: 9999,
          }}
        />
      )}
    </div>
  );
};

export default DynamicTable;
