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
import { useCallback, useEffect, useState, useRef } from "react";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useSelected } from "@/hooks/useSelected";
import { NEW_RECORD_ID, FORM_MODES, TAB_MODES, type TabFormState } from "@/utils/url/constants";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { getNewTabFormState, isFormView } from "@/utils/window/utils";
import { useWindowContext } from "@/contexts/window";

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
  } = useWindowContext();
  const { registerActions, onRefresh } = useToolbarContext();
  const { graph } = useSelected();
  const { registerRefresh, unregisterRefresh } = useTabRefreshContext();
  const [toggle, setToggle] = useState(false);
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

  /**
   * Builds field metadata array matching SmartClient format
   */
  const buildFieldsArray = useCallback(
    (orderedFieldNames: string[], visibility: Record<string, boolean>, fields: Record<string, unknown> | undefined) => {
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
    (fieldsArray: Array<Record<string, unknown>>, sorting: Array<{ id: string; desc: boolean }>) => {
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
   * Builds export request parameters matching Classic datasource format
   */
  const buildExportParams = useCallback(
    (
      entityName: string,
      tabId: string,
      fieldsArray: Array<Record<string, unknown>>,
      sorting: Array<{ id: string; desc: boolean }>,
      filters: unknown[],
      isImplicitFilterApplied: boolean,
      tabFields: Record<string, unknown> | undefined
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

      // Add all entity fields as @Entity.fieldName@=undefined (Classic format)
      // Skip UI-specific columns that are not entity fields
      const skipColumns = new Set(["_editLink", "mrt-row-select", "actions"]);
      if (tabFields) {
        for (const fieldName of Object.keys(tabFields)) {
          if (!skipColumns.has(fieldName)) {
            params[`@${entityName}.${fieldName}@`] = "undefined";
          }
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
  const downloadCSVFile = useCallback((csvContent: string, entityName: string) => {
    if (!csvContent.trim()) {
      throw new Error("No data to export");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${entityName}-export-${new Date().toISOString().split("T")[0]}-${Date.now()}.csv`);
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
  const validateExportData = useCallback(() => {
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

      const respObj = response as unknown as Record<string, unknown>;

      // Try response.data as string
      if (typeof respObj.data === "string") {
        return { csvContent: respObj.data as string, backendError: null };
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

  const handleExportCSV = useCallback(async () => {
    try {
      validateExportData();

      const { datasource } = await import("@workspaceui/api-client/src/api/datasource");

      // Get table state
      const tableState = getTableState(windowIdentifier!, tab.id) || {};
      const {
        filters: tableColumnFilters = [],
        visibility: tableColumnVisibility = {},
        sorting: tableColumnSorting = [],
        isImplicitFilterApplied: stateIsImplicitFilterApplied = false,
      } = tableState;

      // Get field names from tab.fields (not display names from table column order)
      // Filter out the 'id' field and any UI-specific columns
      const skipColumns = new Set(["id", "_editLink", "mrt-row-select", "actions"]);
      const orderedFieldNames = Object.keys(tab.fields!).filter((key) => !skipColumns.has(key));

      // Build field metadata
      const fieldsArray = buildFieldsArray(orderedFieldNames, tableColumnVisibility, tab.fields);

      // Build request parameters
      const params = buildExportParams(
        tab.entityName!,
        tab.id,
        fieldsArray,
        tableColumnSorting,
        tableColumnFilters,
        stateIsImplicitFilterApplied,
        tab.fields
      );

      console.log("Export params keys:", Object.keys(params));
      console.log("Export exportAs:", params.exportAs);
      console.log("Export exportToFile:", params.exportToFile);
      console.log("Export viewState (first 200 chars):", String(params.viewState).substring(0, 200));

      // Make API request
      const response = await datasource.get(tab.entityName!, params);

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
      downloadCSVFile(csvContent, tab.entityName!);
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
    buildExportParams,
    downloadCSVFile,
    validateExportData,
    extractCSVContent,
  ]);

  useEffect(() => {
    // Register this tab's refresh callback
    registerRefresh(tab.tabLevel, onRefresh);

    return () => {
      // Cleanup on unmount
      unregisterRefresh(tab.tabLevel);
    };
  }, [tab.tabLevel, onRefresh, registerRefresh, unregisterRefresh]);

  useEffect(() => {
    const actions = {
      new: handleNew,
      back: handleBack,
      treeView: handleTreeView,
      exportCSV: handleExportCSV,
    };

    registerActions(actions);
  }, [registerActions, handleNew, handleBack, handleTreeView, handleExportCSV, tab.id]);

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
      className={`bg-(linear-gradient(180deg, #C6CFFF 0%, #FCFCFD 55.65%)) flex gap-2 max-w-auto overflow-hidden flex-col min-h-0 shadow-lg ${
        collapsed ? "hidden" : "flex-1 h-full"
      }`}>
      <Toolbar
        windowId={windowIdentifier || tab.window}
        tabId={tab.id}
        isFormView={shouldShowForm}
        data-testid="Toolbar__5893c8"
      />
      {shouldShowForm ? (
        <FormView
          mode={formMode}
          tab={tab}
          window={window}
          recordId={currentRecordId}
          setRecordId={handleSetRecordId}
          data-testid="FormView__5893c8"
        />
      ) : (
        <AttachmentProvider data-testid="AttachmentProvider__5893c8">
          <DynamicTable
            isTreeMode={toggle}
            setRecordId={handleSetRecordId}
            onRecordSelection={handleRecordSelection}
            data-testid="DynamicTable__5893c8"
          />
        </AttachmentProvider>
      )}
    </div>
  );
}

export default Tab;
