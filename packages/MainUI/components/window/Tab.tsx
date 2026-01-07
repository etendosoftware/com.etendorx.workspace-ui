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

"use client";

import { Toolbar } from "../Toolbar/Toolbar";
import DynamicTable from "../Table";
import { useMetadataContext } from "../../hooks/useMetadataContext";
import { FormView } from "@/components/Form/FormView";
import { FormMode } from "@workspaceui/api-client/src/api/types";
import { AttachmentProvider } from "@/contexts/AttachmentContext";
import type { TabLevelProps } from "@/components/window/types";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useSelected } from "@/hooks/useSelected";
import { NEW_RECORD_ID, FORM_MODES, TAB_MODES, type TabFormState } from "@/utils/url/constants";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { getNewTabFormState, isFormView } from "@/utils/window/utils";
import { useWindowContext } from "@/contexts/window";
import { useUserContext } from "@/hooks/useUserContext";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { TableFilter } from "@workspaceui/componentlibrary/src/components/AdvancedFiltersModal";
import { useColumnFilterData } from "@workspaceui/api-client/src/hooks/useColumnFilterData";
import { loadSelectFilterOptions, loadTableDirFilterOptions } from "@/utils/columnFilterHelpers";
import { parseColumns } from "@/utils/tableColumns";
import { ColumnFilterUtils, type FilterOption } from "@workspaceui/api-client/src/utils/column-filter-utils";
import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Validates if a child tab can open FormView based on parent selection in context
 */
const validateParentSelectionForFormView = (
  tab: TabLevelProps["tab"],
  graph: ReturnType<typeof useSelected>["graph"],
  windowId: string,
  getSelectedRecord: (windowId: string, tabId: string) => string | undefined
): boolean => {
  const parentTab = graph.getParent(tab);
  if (!parentTab) {
    return true; // No parent, validation passes
  }

  const parentSelectedInContext = getSelectedRecord(windowId, parentTab.id);
  return !!parentSelectedInContext;
};

/**
 * Handles setting tab form state for new record
 */
const handleNewRecordFormState = (
  windowId: string,
  tabId: string,
  recordId: string,
  setTabFormState: (windowId: string, tabId: string, formState: TabFormState) => void
): void => {
  const newTabFormState = getNewTabFormState(recordId, TAB_MODES.FORM, FORM_MODES.NEW);
  setTabFormState(windowId, tabId, newTabFormState);
};

/**
 * Handles setting tab form state for editing existing record
 */
const handleEditRecordFormState = (
  windowId: string,
  tabId: string,
  newValue: string,
  selectedRecordId: string | undefined,
  setSelectedRecord: (windowId: string, tabId: string, recordId: string) => void,
  setTabFormState: (windowId: string, tabId: string, formState: TabFormState) => void
): void => {
  const formMode = FORM_MODES.EDIT;
  const newTabFormState = getNewTabFormState(newValue, TAB_MODES.FORM, formMode);

  if (selectedRecordId !== newValue) {
    // Record selection changed - update selection first, then form state
    setSelectedRecord(windowId, tabId, newValue);
    setTimeout(() => {
      setTabFormState(windowId, tabId, newTabFormState);
    }, 50);
  } else {
    // Same record - just open form
    setTabFormState(windowId, tabId, newTabFormState);
  }
};

export function Tab({ tab, collapsed }: TabLevelProps) {
  const { config } = useRuntimeConfig();
  const { window } = useMetadataContext();
  const {
    activeWindow,
    clearSelectedRecord,
    getTabFormState,
    setSelectedRecord,
    getSelectedRecord,
    clearTabFormState,
    setTabFormState,
    clearChildrenSelections,
    getTableState,
    setTableAdvancedCriteria,
  } = useWindowContext();
  const { registerActions, setIsAdvancedFilterApplied } = useToolbarContext();
  const { graph } = useSelected();
  const { unregisterRefresh } = useTabRefreshContext();
  const { token } = useUserContext();
  const selectedRecords = useSelectedRecords(tab);
  const { fetchFilterOptions } = useColumnFilterData();
  const [columnOptions, setColumnOptions] = useState<Record<string, FilterOption[]>>({});
  const [toggle, setToggle] = useState(false);
  const [advancedFiltersAnchor, setAdvancedFiltersAnchor] = useState<HTMLElement | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<any[]>([]);
  const { t } = useTranslation();
  const lastParentSelectionRef = useRef<Map<string, string | undefined>>(new Map());

  const windowIdentifier = activeWindow?.windowIdentifier;

  const tabFormState = windowIdentifier ? getTabFormState(windowIdentifier, tab.id) : undefined;
  const selectedRecordId = windowIdentifier ? getSelectedRecord(windowIdentifier, tab.id) : undefined;

  const currentMode = tabFormState?.mode || TAB_MODES.TABLE;
  const currentRecordId = tabFormState?.recordId || "";
  const currentFormMode = tabFormState?.formMode;

  // For child tabs, verify parent has selection before showing FormView
  const parentTab = graph.getParent(tab);
  const parentSelectedRecordId =
    parentTab && windowIdentifier ? getSelectedRecord(windowIdentifier, parentTab.id) : undefined;
  const parentHasSelection = !parentTab || !!parentSelectedRecordId;

  const hasFormViewState = !!tabFormState && tabFormState.mode === TAB_MODES.FORM;
  const shouldShowForm =
    hasFormViewState || isFormView({ currentMode, recordId: currentRecordId, hasParentSelection: parentHasSelection });
  const formMode = currentFormMode === FORM_MODES.NEW ? FormMode.NEW : FormMode.EDIT;

  const handleSetRecordId = useCallback<React.Dispatch<React.SetStateAction<string>>>(
    (value) => {
      const newValue = typeof value === "function" ? value(currentRecordId) : value;

      if (!windowIdentifier) {
        return;
      }

      // Handle clearing form state (empty value)
      if (!newValue) {
        clearTabFormState(windowIdentifier, tab.id);
        return;
      }

      // Validate parent selection for child tabs
      if (!validateParentSelectionForFormView(tab, graph, windowIdentifier, getSelectedRecord)) {
        return; // Don't allow child to open form if parent has no selection
      }

      // Handle new record
      if (newValue === NEW_RECORD_ID) {
        handleNewRecordFormState(windowIdentifier, tab.id, newValue, setTabFormState);
        return;
      }

      // Handle editing existing record
      handleEditRecordFormState(
        windowIdentifier,
        tab.id,
        newValue,
        selectedRecordId,
        setSelectedRecord,
        setTabFormState
      );
    },
    [
      currentRecordId,
      windowIdentifier,
      setTabFormState,
      clearTabFormState,
      setSelectedRecord,
      selectedRecordId,
      getSelectedRecord,
      graph,
      tab,
    ]
  );

  const handleRecordSelection = useCallback(
    (recordId: string) => {
      if (windowIdentifier) {
        if (recordId) {
          setSelectedRecord(windowIdentifier, tab.id, recordId);
        } else {
          clearSelectedRecord(windowIdentifier, tab.id);

          // Clear children tabs when deselecting parent record
          const children = graph.getChildren(tab);
          if (children && children.length > 0) {
            const childIds = children.filter((c) => c.window === tab.window).map((c) => c.id);
            if (childIds.length > 0) {
              clearChildrenSelections(windowIdentifier, childIds);
            }
          }

          setTimeout(() => {
            graph.clearSelected(tab);
          }, 0);
        }
      }
    },
    [windowIdentifier, tab, setSelectedRecord, clearSelectedRecord, clearChildrenSelections, graph]
  );

  const handleNew = useCallback(() => {
    if (windowIdentifier) {
      const newTabFormState = getNewTabFormState(NEW_RECORD_ID, TAB_MODES.FORM, FORM_MODES.NEW);
      setTabFormState(windowIdentifier, tab.id, newTabFormState);
    }
  }, [windowIdentifier, tab, setTabFormState]);

  const handleBack = useCallback(() => {
    if (windowIdentifier) {
      const currentFormState = getTabFormState(windowIdentifier, tab.id);
      const isInFormView = currentFormState?.mode === TAB_MODES.FORM;

      if (isInFormView) {
        clearTabFormState(windowIdentifier, tab.id);
      } else {
        clearSelectedRecord(windowIdentifier, tab.id);

        // Also clear children if this tab has any
        const children = graph.getChildren(tab);
        if (children && children.length > 0) {
          const childIds = children.filter((c) => c.window === tab.window).map((c) => c.id);
          if (childIds.length > 0) {
            clearChildrenSelections(windowIdentifier, childIds);
          }
        }

        // Clear graph selection
        graph.clearSelected(tab);
      }
    }
  }, [windowIdentifier, clearTabFormState, tab, getTabFormState, clearSelectedRecord, clearChildrenSelections, graph]);

  const handleTreeView = useCallback(() => {
    if (windowIdentifier) {
      setToggle((prev) => !prev);
    }
  }, [windowIdentifier]);

  const handlePrintRecord = useCallback(async () => {
    try {
      // Validate prerequisites
      if (selectedRecords.length === 0) {
        console.warn("No records selected for printing");
        return;
      }

      if (!token) {
        throw new Error("Authorization token not found. Please log in again.");
      }

      const publicHost = config?.etendoClassicHost || "";
      const selectedIds = selectedRecords.map((r) => r.id);
      const endpoint = `${publicHost}/sws/com.etendoerp.etendorx.print`;

      console.log("handlePrintRecord called", {
        selectedRecordsCount: selectedRecords.length,
        selectedIds,
        publicHost: config?.etendoClassicHost,
      });

      // Always use POST with recordId as array
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tabId: tab.id,
          recordId: selectedIds,
        }),
      });

      if (!response.ok) {
        throw new Error(`Print request failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      // Try to get filename from content-disposition if available
      const contentDisposition = response.headers.get("content-disposition");
      let fileName = "document.pdf";
      if (contentDisposition && contentDisposition.indexOf("filename=") !== -1) {
        fileName = contentDisposition.split("filename=")[1].replace(/"/g, "");
      }
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Print Record Error:", errorMessage, error);
      throw new Error(`Print failed: ${errorMessage}`);
    }
  }, [selectedRecords, token, tab.id, config?.etendoClassicHost]);
  const handleAdvancedFilters = useCallback((anchorEl?: HTMLElement): void => {
    if (anchorEl) {
      setAdvancedFiltersAnchor(anchorEl);
    }
  }, []);

  const handleApplyFilters = useCallback(
    (filters: any[]): void => {
      // Helper to map operators
      const mapOperator = (op: string): string => {
        switch (op) {
          case "equals":
            return "equals";
          case "not_equals":
            return "notEqual";
          case "contains":
            return "iContains";
          case "not_contains":
            return "notContains";
          case "starts_with":
            return "startsWith";
          case "ends_with":
            return "endsWith";
          case "is_empty":
            return "isNull";
          case "is_not_empty":
            return "notNull";
          case "greater_than":
            return "greaterThan";
          case "less_than":
            return "lessThan";
          case "greater_or_equal":
            return "greaterOrEqual";
          case "less_or_equal":
            return "lessOrEqual";
          case "is_true":
            return "equals";
          case "is_false":
            return "equals";
          case "before":
            return "lessThan";
          case "after":
            return "greaterThan";
          default:
            return "iContains";
        }
      };

      // Helper to convert value
      const convertValue = (val: any, op: string): any => {
        if (op === "is_true") return true;
        if (op === "is_false") return false;
        return val;
      };

      // Recursive function to convert filter items to criteria
      const convertItem = (item: any): any => {
        if (item.type === "condition") {
          return {
            _constructor: "AdvancedCriteria",
            fieldName: item.column,
            operator: mapOperator(item.operator),
            value: convertValue(item.value, item.operator),
          };
        }
        if (item.type === "group") {
          return {
            _constructor: "AdvancedCriteria",
            operator: item.logicalOperator.toLowerCase(),
            criteria: item.conditions.map((c: any) => ({
              _constructor: "AdvancedCriteria",
              fieldName: c.column,
              operator: mapOperator(c.operator),
              value: convertValue(c.value, c.operator),
            })),
          };
        }
        return null;
      };

      const criteria = filters.map(convertItem).filter(Boolean);

      // Update table state with new criteria
      // We assume implicit AND for top-level items
      const advancedCriteria = {
        _constructor: "AdvancedCriteria",
        operator: "and",
        criteria,
      };

      if (windowIdentifier) {
        setTableAdvancedCriteria(windowIdentifier, tab.id, advancedCriteria);
      }

      setAdvancedFilters(filters);
      setIsAdvancedFilterApplied(filters.length > 0);
      setAdvancedFiltersAnchor(null);
    },
    [windowIdentifier, tab.id, setTableAdvancedCriteria, setIsAdvancedFilterApplied]
  );

  const handleSetFilterOptions = useCallback(
    (columnId: string, options: FilterOption[], _hasMore: boolean, append: boolean): void => {
      setColumnOptions((prev) => ({
        ...prev,
        [columnId]: append ? [...(prev[columnId] || []), ...options] : options,
      }));
    },
    []
  );

  const parsedColumns = useMemo(() => {
    if (!tab.fields) return [];
    // We need to cast to any because Tab.fields is Record<string, unknown> but parseColumns expects Field[]
    return parseColumns(Object.values(tab.fields) as any[]);
  }, [tab.fields]);

  const handleLoadOptions = useCallback(
    async (columnId: string, searchQuery: string): Promise<void> => {
      const column = parsedColumns.find((col) => col.id === columnId || col.columnName === columnId);
      if (!column) return;

      if (ColumnFilterUtils.isTableDirColumn(column)) {
        await loadTableDirFilterOptions({
          column,
          columnId,
          searchQuery,
          tabId: tab.id,
          entityName: tab.entityName,
          fetchFilterOptions,
          setFilterOptions: handleSetFilterOptions,
        });
      } else if (ColumnFilterUtils.supportsDropdownFilter(column)) {
        loadSelectFilterOptions(column, columnId, searchQuery, handleSetFilterOptions);
      }
    },
    [parsedColumns, tab.id, tab.entityName, fetchFilterOptions, handleSetFilterOptions]
  );

  const filterColumns = useMemo<any[]>(() => {
    if (!parsedColumns.length || !windowIdentifier) return [];

    const tableState = getTableState(windowIdentifier, tab.id) || {};
    const { visibility: tableColumnVisibility = {} } = tableState;

    return parsedColumns
      .filter((col) => {
        if (["_editLink", "mrt-row-select", "actions"].includes(col.id)) return false;

        // Determine visibility
        // 1. Default from metadata
        let isVisible = col.showInGridView !== false;

        // 2. User override from table state (uses header/label as key)
        if (col.header && tableColumnVisibility[col.header] !== undefined) {
          isVisible = tableColumnVisibility[col.header];
        }

        return isVisible;
      })
      .map((col) => {
        let type: "string" | "number" | "date" | "boolean" | "select" = "string";

        if (ColumnFilterUtils.supportsDropdownFilter(col)) {
          type = "select";
        } else {
          const fieldType = String(col.type);
          if (["number", "quantity", "integer", "amount"].includes(fieldType)) type = "number";
          else if (["date", "datetime"].includes(fieldType)) type = "date";
          else if (["boolean", "yesno"].includes(fieldType)) type = "boolean";
        }

        const id = col.columnName || col.id;
        return {
          id,
          label: col.header || col.id,
          type,
          options: columnOptions[id] || [],
        };
      });
  }, [parsedColumns, windowIdentifier, getTableState, tab.id, columnOptions]);

  /**
   * Builds field metadata array matching SmartClient format
   */
  const buildFieldsArray = useCallback(
    (
      orderedFieldNames: string[],
      visibility: Record<string, boolean>,
      fields: Record<string, unknown> | undefined
    ): Array<{
      name: string;
      visible?: boolean;
      frozen?: boolean;
      width?: number;
      autoFitWidth?: boolean;
    }> => {
      const fieldsArray: Array<{
        name: string;
        visible?: boolean;
        frozen?: boolean;
        width?: number;
        autoFitWidth?: boolean;
      }> = [];

      // Skip UI-specific columns that are not entity fields
      const skipColumns = new Set(["_editLink", "mrt-row-select", "actions"]);

      // Add all fields with their metadata, excluding UI-specific columns
      for (const fieldName of orderedFieldNames) {
        if (skipColumns.has(fieldName)) continue;

        const field = fields?.[fieldName] as Record<string, unknown> | undefined;
        const isVisible = visibility[fieldName] !== false;

        // Determine width based on field type
        let width = 200;
        const fieldType = field?.type as string | undefined;
        if (["boolean", "date", "datetime", "number", "quantity"].includes(fieldType || "")) {
          width = 100;
        }

        fieldsArray.push({
          name: fieldName,
          visible: isVisible,
          width: width,
          ...(fieldType === "boolean" ? { autoFitWidth: false } : {}),
        });
      }

      return fieldsArray;
    },
    []
  );

  /**
   * Builds viewState string matching SmartClient format for Classic datasource
   * Format: ({field:"[...]",sort:"(...))",hilite:null,group:{groupByFields:"",groupingModes:{}},filterClause:null,summaryFunctions:{}})
   */
  const buildViewState = useCallback(
    (fieldsArray: Array<Record<string, unknown>>, sorting: Array<{ id: string; desc: boolean }>): string => {
      const fieldJson = JSON.stringify(fieldsArray);

      let sortJson: string;
      if (sorting.length > 0) {
        const sortSpec = {
          fieldName: sorting[0].id,
          sortDir: sorting[0].desc ? "descending" : "ascending",
          sortSpecifiers: [
            {
              property: sorting[0].id,
              direction: sorting[0].desc ? "descending" : "ascending",
            },
          ],
        };
        sortJson = JSON.stringify(sortSpec);
      } else {
        sortJson = "null";
      }

      // Escape quotes properly for viewState parameter
      const escapedField = fieldJson.replace(/"/g, '\\"');
      const escapedSort = sortJson.replace(/"/g, '\\"');

      return `({field:"${escapedField}",sort:"(${escapedSort})",hilite:null,group:{groupByFields:"",groupingModes:{}},filterClause:null,summaryFunctions:{}})`;
    },
    []
  );

  /**
   * Builds implicit filter criteria for child tabs based on parent record selection
   * Matches parent link by comparing referencedEntity with parentTab.entityName
   */
  const buildImplicitFilterCriteria = useCallback(
    (parentTabArg: typeof tab | null | undefined, parentRecordId: string | undefined): Record<string, unknown>[] => {
      if (!parentTabArg || !parentRecordId) {
        return [];
      }

      // Find the field that links to the parent by matching referencedEntity with parentTab.entityName
      const parentLinkField = Object.entries(tab.fields || {}).find(([_, field]) => {
        const fieldData = field as unknown as Record<string, unknown>;
        return fieldData.referencedEntity === parentTabArg.entityName;
      });

      if (!parentLinkField) {
        return [];
      }

      const fieldName = parentLinkField[0];
      return [
        {
          fieldName,
          operator: "equals",
          value: parentRecordId,
          _constructor: "AdvancedCriteria",
        },
      ];
    },
    [tab]
  );

  /**
   * Builds export request parameters matching Classic datasource format
   */
  const buildExportParams = useCallback(
    (
      entityName: string,
      tabId: string,
      fieldsArray: Array<Record<string, unknown>>,
      sorting: Array<{ id: string; desc: boolean }>,
      filters: unknown[],
      isImplicitFilterApplied: boolean
    ): Record<string, unknown> => {
      const viewState = buildViewState(fieldsArray, sorting);

      const params: Record<string, unknown> = {
        _dataSource: "isc_OBViewDataSource_0",
        _operationType: "fetch",
        _noCount: true,
        exportAs: "csv",
        exportToFile: true,
        viewState: viewState,
        _extraProperties: "undefined",
        tabId: tabId,
        _textMatchStyle: "substring",
        _UTCOffsetMiliseconds: String(new Date().getTimezoneOffset() * -60000),
        operator: "and",
        _constructor: "AdvancedCriteria",
        criteria: filters.length > 0 ? filters : undefined,
        isImplicitFilterApplied: isImplicitFilterApplied,
        _startRow: 0,
        _endRow: 9999,
      };

      // Add only visible entity fields as @Entity.fieldName@=undefined (Classic format)
      // Only include fields that are visible (not hidden by user)
      for (const field of fieldsArray) {
        const fieldName = field.name as string;
        const isVisible = field.visible !== false; // Default to visible if not specified

        if (isVisible) {
          params[`@${entityName}.${fieldName}@`] = "undefined";
        }
      }

      // Add sorting parameter if present
      if (sorting.length > 0) {
        params._sortBy = sorting[0].id;
      }

      return params;
    },
    [buildViewState]
  );

  /**
   * Downloads CSV file to client
   */
  const downloadCSVFile = useCallback((csvContent: string): void => {
    if (!csvContent.trim()) {
      throw new Error("No data to export");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "ExportedData.csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }, []);

  /**
   * Validates export prerequisites
   */
  const validateExportData = useCallback((): void => {
    if (!tab?.entityName) {
      throw new Error("Entity name not found");
    }
    if (!windowIdentifier) {
      throw new Error("Window context not found");
    }
    if (!tab.fields || Object.keys(tab.fields).length === 0) {
      throw new Error("No fields available for export");
    }
  }, [tab, windowIdentifier]);

  /**
   * Builds field name visibility map by combining metadata defaults with user overrides
   */
  const buildFieldNameVisibility = useCallback(
    (
      orderedFieldNames: string[],
      tableColumnVisibility: Record<string, boolean>,
      tabFields: Record<string, unknown>
    ): Record<string, boolean> => {
      const fieldNameVisibility: Record<string, boolean> = {};

      for (const fieldName of orderedFieldNames) {
        const field = tabFields[fieldName] as Record<string, unknown> | undefined;

        // Check if field has showInGridView property (initial visibility from metadata)
        let isVisible = field?.showInGridView !== false; // Default to visible

        // If field has a label, check tableColumnVisibility for user-set visibility
        if (field?.label && typeof field.label === "string") {
          const displayName = field.label;
          // If the display name exists in tableColumnVisibility, use that value (user override)
          if (displayName in tableColumnVisibility) {
            isVisible = tableColumnVisibility[displayName] !== false;
          }
        }

        fieldNameVisibility[fieldName] = isVisible;
      }

      return fieldNameVisibility;
    },
    []
  );

  /**
   * Extracts error message from nested response structure
   */
  const extractErrorFromResponse = useCallback((respObj: Record<string, unknown>): string | null => {
    // Check nested path: response.data.response.error
    if (respObj.data && typeof respObj.data === "object") {
      const dataObj = respObj.data as unknown as Record<string, unknown>;
      if (dataObj.response && typeof dataObj.response === "object") {
        const respData = dataObj.response as unknown as Record<string, unknown>;
        if (respData.error && typeof respData.error === "object") {
          const errorObj = respData.error as unknown as Record<string, unknown>;
          return String(errorObj.message || "Unknown backend error");
        }
      }
    }

    // Check top-level path: response.error
    if (respObj.response && typeof respObj.response === "object") {
      const respData = respObj.response as unknown as Record<string, unknown>;
      if (respData.error && typeof respData.error === "object") {
        const errorObj = respData.error as unknown as Record<string, unknown>;
        return String(errorObj.message || "Unknown backend error");
      }
    }

    return null;
  }, []);

  /**
   * Attempts to extract CSV content from data object
   */
  const tryExtractCSVFromDataObject = useCallback((dataObj: Record<string, unknown>): string => {
    if (typeof dataObj.text === "string") return dataObj.text;
    if (typeof dataObj.data === "string") return dataObj.data;
    if (typeof dataObj.csv === "string") return dataObj.csv;
    return "";
  }, []);

  /**
   * Attempts to extract CSV content from top-level object
   */
  const tryExtractCSVFromTopLevel = useCallback((respObj: Record<string, unknown>): string => {
    if (typeof respObj.text === "string") return respObj.text;
    if (typeof respObj.csv === "string") return respObj.csv;
    return "";
  }, []);

  /**
   * Extracts CSV content from various response structures
   */
  const extractCSVContent = useCallback(
    (response: unknown): { csvContent: string; backendError: string | null } => {
      // Try direct string response
      if (typeof response === "string") {
        return { csvContent: response, backendError: null };
      }

      const respObj = response as Record<string, unknown>;

      // Try response.data as string
      if (typeof respObj.data === "string") {
        return { csvContent: respObj.data, backendError: null };
      }

      // Extract errors first
      const backendError = extractErrorFromResponse(respObj);

      // Try nested data object
      if (respObj.data && typeof respObj.data === "object") {
        const dataObj = respObj.data as unknown as Record<string, unknown>;
        const csvContent = tryExtractCSVFromDataObject(dataObj);
        if (csvContent) {
          return { csvContent, backendError };
        }
      }

      // Try top-level properties
      const csvContent = tryExtractCSVFromTopLevel(respObj);
      if (csvContent) {
        return { csvContent, backendError };
      }

      return { csvContent: "", backendError };
    },
    [extractErrorFromResponse, tryExtractCSVFromDataObject, tryExtractCSVFromTopLevel]
  );

  const handleExportCSV = useCallback(async (): Promise<void> => {
    try {
      validateExportData();

      if (!windowIdentifier) {
        throw new Error("Window context not found");
      }

      const { datasource } = await import("@workspaceui/api-client/src/api/datasource");

      // Get table state
      const tableState = getTableState(windowIdentifier, tab.id) || {};
      const {
        filters: tableColumnFilters = [],
        visibility: tableColumnVisibility = {},
        sorting: tableColumnSorting = [],
        isImplicitFilterApplied: stateIsImplicitFilterApplied = false,
      } = tableState;

      // Get field names from tab.fields (not display names from table column order)
      // Filter out the 'id' field and any UI-specific columns
      const skipColumns = new Set(["id", "_editLink", "mrt-row-select", "actions"]);
      const orderedFieldNames = Object.keys(tab.fields).filter((key) => !skipColumns.has(key));

      // Map field name visibility from display name visibility
      // tableColumnVisibility uses display names (e.g., "Gross Unit Price") as keys
      // We need to map to field names (e.g., "grossUnitPrice") for the export
      const fieldNameVisibility = buildFieldNameVisibility(orderedFieldNames, tableColumnVisibility, tab.fields);

      // Build field metadata
      const fieldsArray = buildFieldsArray(orderedFieldNames, fieldNameVisibility, tab.fields);

      // Build implicit filter criteria for child tabs
      const implicitFilterCriteria = buildImplicitFilterCriteria(parentTab, parentSelectedRecordId);

      // Combine implicit filter with table column filters
      const allFilters =
        implicitFilterCriteria.length > 0 ? [...implicitFilterCriteria, ...tableColumnFilters] : tableColumnFilters;

      // Build request parameters
      const params = buildExportParams(
        tab.entityName,
        tab.id,
        fieldsArray,
        tableColumnSorting,
        allFilters,
        stateIsImplicitFilterApplied
      );

      // Make API request
      const response = await datasource.get(tab.entityName, params);

      // Validate response
      if (!response) {
        throw new Error("No response from server");
      }

      console.log("CSV Export Response:", response);

      const respObj = response as unknown as Record<string, unknown>;
      if (respObj.__error) {
        throw new Error(`Export error: ${respObj.__error}`);
      }

      // Extract CSV content and check for errors
      const { csvContent, backendError } = extractCSVContent(response);

      if (backendError) {
        throw new Error(`CSV export backend error: ${backendError}`);
      }

      console.log("Final CSV content length:", csvContent.length);

      if (!csvContent || csvContent.trim().length === 0) {
        console.error(
          "Export returned empty data. Response structure (keys):",
          response && typeof response === "object" ? Object.keys(respObj) : typeof response
        );
        throw new Error("Export returned empty data - check browser console for response structure");
      }

      // Download file
      downloadCSVFile(csvContent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred during export";
      console.error("CSV Export Error:", errorMessage, error);

      // Re-throw to trigger error boundary or toast notification
      throw new Error(`CSV Export failed: ${errorMessage}`);
    }
  }, [
    tab,
    windowIdentifier,
    getTableState,
    buildFieldsArray,
    buildFieldNameVisibility,
    buildExportParams,
    downloadCSVFile,
    validateExportData,
    extractCSVContent,
    parentTab,
    parentSelectedRecordId,
    buildImplicitFilterCriteria,
  ]);

  useEffect(() => {
    // Cleanup all refresh callbacks for this level on unmount
    // Individual components (Table, FormView) register their own refresh with type
    return () => {
      unregisterRefresh(tab.tabLevel);
    };
  }, [tab.tabLevel, unregisterRefresh]);

  useEffect(() => {
    const actions = {
      new: handleNew,
      back: handleBack,
      treeView: handleTreeView,
      exportCSV: handleExportCSV,
      advancedFilters: handleAdvancedFilters,
      printRecord: handlePrintRecord,
    };

    registerActions(actions);
  }, [
    registerActions,
    handleNew,
    handleBack,
    handleTreeView,
    handleExportCSV,
    handleAdvancedFilters,
    handlePrintRecord,
    tab.id,
  ]);

  /**
   * Clear selection when creating a new record
   * This prevents issues when creating a new record from a selected record in the table
   * which could lead to inconsistent state.
   */
  useEffect(() => {
    if (currentRecordId === NEW_RECORD_ID) {
      graph.clearSelected(tab);
      graph.clearSelectedMultiple(tab);
    }
  }, [currentRecordId, graph, tab]);

  // Auto-close child FormView when parent selection changes
  useEffect(() => {
    if (!windowIdentifier) {
      return;
    }

    const parentTab = graph.getParent(tab);
    if (!parentTab) {
      return; // Only for child tabs
    }

    const parentSelectedId = getSelectedRecord(windowIdentifier, parentTab.id);
    const previousParentId = lastParentSelectionRef.current.get(windowIdentifier);

    // Only process if parent selection ID actually changed
    if (parentSelectedId === previousParentId) {
      return; // No change, skip processing
    }

    // Update ref BEFORE any early returns
    lastParentSelectionRef.current.set(windowIdentifier, parentSelectedId);

    // Skip closing if this is a NEW -> real ID transition (save operation)
    const isParentSaveTransition =
      previousParentId === NEW_RECORD_ID && parentSelectedId && parentSelectedId !== NEW_RECORD_ID;

    // Close child FormView only if:
    // 1. There was a previous parent selection (not initial render)
    // 2. Parent selection changed to something else (different ID or undefined)
    // 3. This is NOT a save transition (NEW -> real ID)
    // Note: We now close child FormView even if parent is in FormView (navigation between parent records should reset children)
    if (previousParentId !== undefined && !isParentSaveTransition) {
      clearTabFormState(windowIdentifier, tab.id);
      graph.clearSelected(tab);
    }
  }, [
    windowIdentifier,
    graph,
    tab,
    getSelectedRecord,
    clearTabFormState,
    getTabFormState,
    currentMode,
    tabFormState?.mode,
  ]);

  return (
    <div
      className={`relative bg-(linear-gradient(180deg, #C6CFFF 0%, #FCFCFD 55.65%)) flex gap-2 max-w-auto overflow-hidden flex-col min-h-0 shadow-lg ${
        collapsed ? "hidden" : "flex-1 h-full"
      }`}>
      <Toolbar
        windowId={windowIdentifier || tab.window}
        tabId={tab.id}
        isFormView={shouldShowForm}
        data-testid="Toolbar__5893c8"
      />
      {shouldShowForm && (
        <div className="flex-1 h-full min-h-0 relative z-10">
          <FormView
            mode={formMode}
            tab={tab}
            window={window}
            recordId={currentRecordId}
            setRecordId={handleSetRecordId}
            data-testid="FormView__5893c8"
          />
        </div>
      )}
      <div
        className={
          !shouldShowForm
            ? "flex-1 h-full min-h-0"
            : "absolute top-0 left-0 w-full h-full invisible opacity-0 z-[-1] pointer-events-none"
        }>
        <AttachmentProvider data-testid="AttachmentProvider__5893c8">
          <DynamicTable
            isTreeMode={toggle}
            setRecordId={handleSetRecordId}
            onRecordSelection={handleRecordSelection}
            isVisible={!shouldShowForm}
            areFiltersDisabled={advancedFilters.length > 0}
            data-testid="DynamicTable__5893c8"
          />
        </AttachmentProvider>
      </div>
      <Menu
        anchorEl={advancedFiltersAnchor}
        onClose={() => setAdvancedFiltersAnchor(null)}
        className="w-[800px] max-w-[90vw] max-h-[80vh] overflow-y-auto"
        offsetY={8}
        data-testid="Menu__5893c8">
        <TableFilter
          columns={filterColumns}
          onApplyFilters={handleApplyFilters}
          onLoadOptions={handleLoadOptions}
          initialFilters={advancedFilters}
          t={(k: string) => t(k as any)}
          data-testid="TableFilter__5893c8"
        />
      </Menu>
    </div>
  );
}

export default Tab;
