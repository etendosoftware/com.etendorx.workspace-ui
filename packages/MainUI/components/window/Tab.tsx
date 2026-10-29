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
 *
 * Note: Unused variables (registerRefresh, selectedRecord, iframeUrl) removed in ETP-3000
 *************************************************************************
 */

"use client";

import { Toolbar } from "../Toolbar/Toolbar";
import DynamicTable from "../Table";
import { useMetadataContext } from "../../hooks/useMetadataContext";
import { FormView } from "@/components/Form/FormView";
import { useFocusRegion } from "@/hooks/useFocusRegion";
import { useTabContext } from "@/contexts/tab";
import { FormMode, UIPattern } from "@workspaceui/api-client/src/api/types";
import { AttachmentProvider } from "@/contexts/AttachmentContext";
import type { TabLevelProps } from "@/components/window/types";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useToolbarCommands } from "@/contexts/ToolbarContext";
import { useSelected } from "@/hooks/useSelected";
import { NEW_RECORD_ID, FORM_MODES, TAB_MODES, type TabFormState } from "@/utils/url/constants";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { getNewTabFormState, isFormView, isSrOneToOneExtension } from "@/utils/window/utils";
import {
  DEFAULT_SPLIT_STATE,
  SPLIT_MAX_TABLE_WIDTH,
  SPLIT_MIN_TABLE_WIDTH,
  SPLIT_TABLE_WIDTH_CSS_VAR,
  SPLIT_PANES,
  SPLIT_PANE_TEST_IDS,
  TAB_VIEW_MODES,
  getFocusBorderColor,
  getFormPaneClassName,
  getGridPaneClassName,
  getGridPaneStyle,
  getPaneTabIndex,
  getPanesContainerClassName,
  getPanesContainerStyle,
  getTabViewMode,
  isDualPaneMode,
  isGridPaneExclusive,
  isGridPaneVisible,
  isPaneFocused,
  isSplitViewAvailable,
  resolveGuardedSplitTarget,
  resolveSplitViewFormRecord,
  shouldPromptSplitViewChange,
} from "@/utils/window/splitView";
import { useUnsavedChangesTabGuard } from "@/contexts/UnsavedChangesTabGuard";
import { isTabDirty } from "@/utils/window/dirtyState";
import { useSplitPaneFocus } from "@/hooks/useSplitPaneFocus";
import { useWindowStore, DEFAULT_TABLE_STATE } from "@/stores/windowStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { TOOLBAR_ACTION_OWNERS } from "@/utils/toolbar/actionOwnership";
import ResizeHandle from "@workspaceui/componentlibrary/src/components/ResizeHandle";
import { useUserStore } from "@/stores/userStore";
import { useCurrentWindowIdentifier } from "@/contexts/CurrentWindowContext";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { TableFilter } from "@workspaceui/componentlibrary/src/components/AdvancedFiltersModal";
import { useColumnFilterData } from "@workspaceui/api-client/src/hooks/useColumnFilterData";
import { loadSelectFilterOptions, loadTableDirFilterOptions } from "@/utils/columnFilterHelpers";
import { parseColumns } from "@/utils/tableColumns";
import { isGridRenderableColumn } from "@/utils/table/utils";
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
    // Record selection changed — call both synchronously so React 18 batches them into
    // a single state update. Previously setTabFormState was deferred 50ms via setTimeout,
    // which caused two separate renders and two router.replace() calls (= 2 RSC re-renders
    // per navigation). With automatic batching in React 18, calling both together produces
    // a single render and a single URL update.
    setSelectedRecord(windowId, tabId, newValue);
    setTabFormState(windowId, tabId, newTabFormState);
  } else {
    // Same record — just open form view (selection already set)
    setTabFormState(windowId, tabId, newTabFormState);
  }
};

const ADVANCED_CRITERIA_DEFAULT_OPERATOR = "and";
const ADVANCED_CRITERIA_CONSTRUCTOR = "AdvancedCriteria";

export function Tab({ tab, collapsed }: TabLevelProps) {
  const { config } = useRuntimeConfig();
  const { window } = useMetadataContext();
  const windowIdentifier = useCurrentWindowIdentifier();

  // Zustand store — stable action references
  const clearSelectedRecord = useWindowStore((s) => s.clearSelectedRecord);
  const setSelectedRecord = useWindowStore((s) => s.setSelectedRecord);
  const clearTabFormState = useWindowStore((s) => s.clearTabFormState);
  const setTabFormState = useWindowStore((s) => s.setTabFormState);
  const clearChildrenSelections = useWindowStore((s) => s.clearChildrenSelections);
  const setTableAdvancedCriteria = useWindowStore((s) => s.setTableAdvancedCriteria);
  const setAllWindowsInactive = useWindowStore((s) => s.setAllWindowsInactive);

  // Zustand store — imperative getters (for use in callbacks/effects, not render)
  const getTabFormState = useCallback((windowIdentifier: string, tabId: string) => {
    return useWindowStore.getState().windows[windowIdentifier]?.tabs[tabId]?.form;
  }, []);
  const getSelectedRecord = useCallback((windowIdentifier: string, tabId: string): string | undefined => {
    return useWindowStore.getState().windows[windowIdentifier]?.tabs[tabId]?.selectedRecord;
  }, []);
  const getTableState = useCallback((windowIdentifier: string, tabId: string) => {
    return useWindowStore.getState().windows[windowIdentifier]?.tabs[tabId]?.table ?? DEFAULT_TABLE_STATE;
  }, []);

  const { registerActions, setIsAdvancedFilterApplied, onRestoreSelection } = useToolbarCommands();
  const { hasFormChanges } = useTabContext();
  const { guardTransition } = useUnsavedChangesTabGuard();
  const { graph } = useSelected();

  // Zustand store — reactive subscriptions (re-render when these change)
  const reactiveTabFormState = useWindowStore((s) =>
    windowIdentifier ? s.windows[windowIdentifier]?.tabs[tab.id]?.form : undefined
  );
  const reactiveSelectedRecordId = useWindowStore((s) =>
    windowIdentifier ? s.windows[windowIdentifier]?.tabs[tab.id]?.selectedRecord : undefined
  );
  const parentTabId = graph?.getParent(tab)?.id;
  const reactiveParentSelectedRecordId = useWindowStore((s) => {
    if (!parentTabId || !windowIdentifier) return undefined;
    return s.windows[windowIdentifier]?.tabs[parentTabId]?.selectedRecord;
  });
  // Same source of truth as the guard itself: TabContext's `hasFormChanges` is also raised
  // for a pristine NEW record, which must not trigger the prompt.
  const dirtyWindows = useWindowStore((s) => s.dirtyWindows);
  const isCurrentTabDirty = isTabDirty(dirtyWindows, windowIdentifier, tab.id);
  const splitState = useWindowStore((s) => {
    if (!windowIdentifier) return DEFAULT_SPLIT_STATE;
    return s.windows[windowIdentifier]?.tabs[tab.id]?.split ?? DEFAULT_SPLIT_STATE;
  });
  const setTabSplitEnabled = useWindowStore((s) => s.setTabSplitEnabled);
  const setTabSplitTableWidth = useWindowStore((s) => s.setTabSplitTableWidth);
  const { unregisterRefresh } = useTabRefreshContext();
  const token = useUserStore((s) => s.token);
  const selectedRecords = useSelectedRecords(tab);
  const { fetchFilterOptions } = useColumnFilterData();
  const [columnOptions, setColumnOptions] = useState<Record<string, FilterOption[]>>({});
  // Tree view of the grid, kept in the window store so saved views can capture and restore it
  const isTreeView = useWindowStore((s) => s.windows[windowIdentifier]?.tabs[tab.id]?.table.treeView ?? false);
  const setTableTreeView = useWindowStore((s) => s.setTableTreeView);
  const [advancedFiltersAnchor, setAdvancedFiltersAnchor] = useState<HTMLElement | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<any[]>([]);
  const { t } = useTranslation();
  const lastParentSelectionRef = useRef<Map<string, string | undefined>>(new Map());
  // Tracks the parentSelectedRecordId for which the SR auto-open was last triggered.
  // This prevents re-opening the form view after the user explicitly closes it.
  const srAutoOpenedForParentRef = useRef<string | undefined>(undefined);
  // Record the split-view unsaved-changes prompt was last opened for, so holding an arrow
  // key in the grid raises one prompt instead of one per row.
  const promptedSplitRecordRef = useRef<string | undefined>(undefined);

  // No onBlur autosave: moving to another tab must never save on the user's behalf. The
  // tab keeps its pending edits (it stays mounted) and advertises them with the `*` marker.
  const { isFocused, acquire } = useFocusRegion(tab.id);

  // Level-0 tab (header) acquires focus on mount — sets initial focus for the window
  useEffect(() => {
    if (tab.tabLevel === 0) {
      acquire();
    }
  }, [tab.tabLevel, acquire]);

  const tabFormState = reactiveTabFormState;
  const selectedRecordId = reactiveSelectedRecordId;

  const currentMode = tabFormState?.mode || TAB_MODES.TABLE;
  const currentRecordId = tabFormState?.recordId || "";
  const currentFormMode = tabFormState?.formMode;

  // For child tabs, verify parent has selection before showing FormView
  const parentTab = graph.getParent(tab);
  const parentSelectedRecordId = reactiveParentSelectedRecordId;
  const parentHasSelection = !parentTab || !!parentSelectedRecordId;

  // SR (Single Record) tabs share the same entity/record as the parent.
  // They should show form view by default (like Classic) instead of loading a grid first.
  // Always use parentSelectedRecordId directly — since SR child.id === parent.id,
  // there's no need to fall back to currentRecordId (which may be stale during the
  // render cycle before the reset effect clears it).
  const isSrTab = tab.uIPattern === UIPattern.EDIT_ONLY && tab.defaultEditMode;
  const effectiveRecordId = isSrTab && parentSelectedRecordId ? parentSelectedRecordId : currentRecordId;

  // When the parent record changes, reset child tab state (exit form view, clear selection).
  // This replaces the implicit re-render that useWindowContext provided in the pre-Zustand architecture.
  // For SR tabs this clears stale form state so effectiveRecordId picks up the new parentId.
  const prevParentRecordRef = useRef<string | undefined>(parentSelectedRecordId);
  useEffect(() => {
    const prev = prevParentRecordRef.current;
    prevParentRecordRef.current = parentSelectedRecordId;

    // Skip initial mount — prev is always undefined on first render.
    // This prevents clearing the form state that auto-open or SR default just set.
    if (prev === undefined) return;
    if (prev === parentSelectedRecordId) return;
    if (!parentTab || !windowIdentifier) return;

    // Parent changed — clear this child tab's form state and selection
    clearTabFormState(windowIdentifier, tab.id);
    clearSelectedRecord(windowIdentifier, tab.id);
    graph.clearSelected(tab);
  }, [parentSelectedRecordId, parentTab, windowIdentifier, tab, clearTabFormState, clearSelectedRecord, graph]);

  const hasFormViewState = !!tabFormState && tabFormState.mode === TAB_MODES.FORM;
  const isSrDefaultForm = isSrTab && parentHasSelection;
  const shouldShowForm =
    isSrDefaultForm ||
    hasFormViewState ||
    isFormView({ currentMode, recordId: currentRecordId, hasParentSelection: parentHasSelection });
  const formMode = currentFormMode === FORM_MODES.NEW ? FormMode.NEW : FormMode.EDIT;

  // Split view: grid and form on screen at once. `isTreeView` drives the tree
  // side-by-side layout, which split takes precedence over.
  const panesRef = useRef<HTMLDivElement>(null);
  const isSplitEnabled = splitState.enabled && isSplitViewAvailable(tab);
  const isTreeSideBySide = isTreeView && shouldShowForm;
  const viewMode = getTabViewMode({ shouldShowForm, isSplitEnabled, isTreeSideBySide });
  const isSplitView = viewMode === TAB_VIEW_MODES.SPLIT;

  // With both panes on screen the keyboard belongs to one of them, so the focus
  // indicator narrows down from the tab to the pane holding the DOM focus.
  const { focusedPane, gridPaneRef, formPaneRef, handleGridPaneFocus, handleFormPaneFocus } = useSplitPaneFocus({
    isDualPane: isDualPaneMode(viewMode),
    shouldShowForm,
    isTabFocused: isFocused,
  });

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

          // Recursively collect ALL descendant tab IDs so deselection cascades through all levels
          const descendantIds: string[] = [];
          const collectDescendants = (parentTab: typeof tab) => {
            const children = graph.getChildren(parentTab);
            if (!children) return;
            for (const child of children) {
              if (child.window === tab.window) {
                descendantIds.push(child.id);
                collectDescendants(child);
              }
            }
          };
          collectDescendants(tab);
          if (descendantIds.length > 0) {
            clearChildrenSelections(windowIdentifier, descendantIds, true);
          }

          setTimeout(() => {
            graph.clearSelected(tab);
          }, 0);
        }
      }
    },
    [windowIdentifier, tab, setSelectedRecord, clearSelectedRecord, clearChildrenSelections, graph]
  );

  /**
   * Loads the record the user asked for once the guard has been answered.
   *
   * Saving re-selects the saved record in the grid, so the stored selection is only
   * followed while it points somewhere else than the record the form is showing; the
   * selection is then re-pointed at the target so grid and form never disagree.
   */
  const loadGuardedSplitRecord = useCallback(
    (promptedSelection: string) => {
      if (!windowIdentifier) return;
      const target = resolveGuardedSplitTarget({
        latestSelection: getSelectedRecord(windowIdentifier, tab.id),
        promptedSelection,
        formRecordId: getTabFormState(windowIdentifier, tab.id)?.recordId,
      });
      setSelectedRecord(windowIdentifier, tab.id, target);
      handleSetRecordId(target);
    },
    [windowIdentifier, tab.id, getSelectedRecord, getTabFormState, setSelectedRecord, handleSetRecordId]
  );

  /** Puts the grid highlight back on the record the form is still showing. */
  const restoreGridSelectionToForm = useCallback(() => {
    if (!currentRecordId) return;
    onRestoreSelection(currentRecordId);
  }, [currentRecordId, onRestoreSelection]);

  /**
   * In split view the form pane follows the grid selection, so a single click on
   * a row is enough to load that record — the same as Classic. The grid writes
   * its selection to the store, so reacting to the stored value covers row
   * clicks, keyboard navigation and programmatic selection alike.
   *
   * With pending edits the switch is not silent any more: the guard asks whether to
   * save or discard them, and backing out re-selects the form's record so the grid
   * highlight never contradicts what the form shows.
   */
  useEffect(() => {
    const recordToLoad = resolveSplitViewFormRecord({
      isSplitView,
      selectedRecordId,
      currentRecordId,
      hasFormChanges,
      isNewRecord: currentFormMode === FORM_MODES.NEW,
    });
    if (recordToLoad) {
      promptedSplitRecordRef.current = undefined;
      handleSetRecordId(recordToLoad);
      return;
    }

    const needsPrompt = shouldPromptSplitViewChange({
      isSplitView,
      selectedRecordId,
      currentRecordId,
      isDirty: isCurrentTabDirty,
    });
    if (!needsPrompt || !selectedRecordId) return;
    // Holding an arrow key in the grid must not stack one prompt per row.
    if (promptedSplitRecordRef.current === selectedRecordId) return;

    promptedSplitRecordRef.current = selectedRecordId;
    const promptedSelection = selectedRecordId;
    guardTransition(() => loadGuardedSplitRecord(promptedSelection), restoreGridSelectionToForm);
  }, [
    isSplitView,
    selectedRecordId,
    currentRecordId,
    hasFormChanges,
    currentFormMode,
    isCurrentTabDirty,
    handleSetRecordId,
    guardTransition,
    loadGuardedSplitRecord,
    restoreGridSelectionToForm,
  ]);

  const handleNew = useCallback(() => {
    if (windowIdentifier) {
      const newTabFormState = getNewTabFormState(NEW_RECORD_ID, TAB_MODES.FORM, FORM_MODES.NEW);
      setTabFormState(windowIdentifier, tab.id, newTabFormState);
    }
  }, [windowIdentifier, tab, setTabFormState]);

  const handleBack = useCallback(() => {
    if (!windowIdentifier) return;

    const currentFormState = getTabFormState(windowIdentifier, tab.id);
    const isInFormView = currentFormState?.mode === TAB_MODES.FORM;

    if (isInFormView) {
      clearTabFormState(windowIdentifier, tab.id);
      if (tab.uIPattern === UIPattern.EDIT_ONLY) {
        clearSelectedRecord(windowIdentifier, tab.id);
        graph.clearSelected(tab);
      }
      return;
    }

    if (tab.tabLevel === 0) {
      setAllWindowsInactive();
      return;
    }

    clearSelectedRecord(windowIdentifier, tab.id);

    const childIds =
      graph
        .getChildren(tab)
        ?.filter((c) => c.window === tab.window)
        .map((c) => c.id) ?? [];
    if (childIds.length > 0) {
      clearChildrenSelections(windowIdentifier, childIds);
    }

    graph.clearSelected(tab);
  }, [
    windowIdentifier,
    clearTabFormState,
    tab,
    getTabFormState,
    clearSelectedRecord,
    clearChildrenSelections,
    graph,
    setAllWindowsInactive,
  ]);

  const handleTreeView = useCallback(() => {
    if (windowIdentifier) {
      setTableTreeView(windowIdentifier, tab.id, !isTreeView, tab.tabLevel);
    }
  }, [windowIdentifier, tab.id, tab.tabLevel, isTreeView, setTableTreeView]);

  /**
   * Brings both panes on screen, never the other way round: Classic's
   * `showGridAndForm` only ever shows what is hidden, so pressing the button
   * again with the split already open is a no-op there too.
   *
   * From the grid it also opens the selected record, the way Classic follows up
   * with `grid.recordDoubleClick`.
   */
  const handleShowTableAndForm = useCallback(() => {
    if (!windowIdentifier || !isSplitViewAvailable(tab)) return;
    if (isSplitView) return;
    // Without a form open the split needs a record to show in the form pane.
    if (!shouldShowForm && !selectedRecordId) return;

    setTabSplitEnabled(windowIdentifier, tab.id, true, tab.tabLevel);

    if (!shouldShowForm && selectedRecordId) {
      handleSetRecordId(selectedRecordId);
    }
  }, [windowIdentifier, tab, isSplitView, shouldShowForm, selectedRecordId, setTabSplitEnabled, handleSetRecordId]);

  useKeyboardShortcuts({ "ctrl+m": { handler: handleShowTableAndForm, allowInInputs: true } }, isFocused);

  /**
   * Live drag writes the CSS variable directly: a React state update per
   * mousemove would re-render the whole table at pointer frequency.
   */
  const handleSplitDrag = useCallback((tableWidth: number) => {
    panesRef.current?.style.setProperty(SPLIT_TABLE_WIDTH_CSS_VAR, `${tableWidth}%`);
  }, []);

  const handleSplitDragEnd = useCallback(
    (tableWidth: number) => {
      if (!windowIdentifier) return;
      setTabSplitTableWidth(windowIdentifier, tab.id, tableWidth, tab.tabLevel);
    },
    [windowIdentifier, tab.id, tab.tabLevel, setTabSplitTableWidth]
  );

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

      // Always use POST with parameters array containing recordId objects
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tabId: tab.id,
          parameters: selectedIds.map((id) => ({ recordId: id })),
          docType: "PDF",
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

      // Build advancedCriteria using the logical operators from the filter items
      // The first item doesn't have a meaningful logicalOperator (it's "Where")
      // Subsequent items define how they connect to previous items
      let advancedCriteria: any;

      if (criteria.length === 0) {
        advancedCriteria = null;
      } else if (criteria.length === 1) {
        // Single criterion - wrap it in an AND group
        advancedCriteria = {
          _constructor: ADVANCED_CRITERIA_CONSTRUCTOR,
          operator: ADVANCED_CRITERIA_DEFAULT_OPERATOR,
          criteria,
        };
      } else {
        // Multiple criteria - check if we need to handle mixed operators
        // Get the logical operators from the original filter items (skip first which is "Where")
        const logicalOperators = filters
          .slice(1)
          .map((f) => f.logicalOperator?.toLowerCase() || ADVANCED_CRITERIA_DEFAULT_OPERATOR);
        const allSameOperator = logicalOperators.every((op) => op === logicalOperators[0]);

        if (allSameOperator && logicalOperators.length > 0) {
          // All conditions use the same operator
          advancedCriteria = {
            _constructor: ADVANCED_CRITERIA_CONSTRUCTOR,
            operator: logicalOperators[0],
            criteria,
          };
        } else {
          // Mixed operators - we need to group by precedence (AND has higher precedence than OR)
          // For now, use the operator from the second item as the top-level operator
          // This matches the intuitive left-to-right evaluation
          advancedCriteria = {
            _constructor: ADVANCED_CRITERIA_CONSTRUCTOR,
            operator: logicalOperators[0] || ADVANCED_CRITERIA_DEFAULT_OPERATOR,
            criteria,
          };
        }
      }

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
    // Image and button references never become grid columns, like Etendo Classic (ETP-4635).
    return parseColumns(Object.values(tab.fields) as any[]).filter(isGridRenderableColumn);
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
      showTableAndForm: handleShowTableAndForm,
      advancedFilters: handleAdvancedFilters,
      printRecord: handlePrintRecord,
    };

    registerActions(actions, TOOLBAR_ACTION_OWNERS.TAB);
  }, [
    registerActions,
    handleNew,
    handleBack,
    handleTreeView,
    handleShowTableAndForm,
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

  // Auto-open FormView for SR (Single Record) tabs when defaultEditMode is enabled.
  // This path only applies to the 1:1 ID-extension variant, where the child's PK column
  // is also its FK to the parent (e.g. AD_ClientInfo). In that case child.id === parent.id,
  // so reusing the parent-selected id to open the form is safe.
  // Logical SR relations (PK and FK are distinct columns, e.g. ETSG_Certificate.organization)
  // are auto-opened by DynamicTable after the child records are fetched.
  // A ref tracks the last parent ID for which auto-open fired, so closing the form
  // (shouldShowForm → false) does not trigger a re-open for the same parent.
  useEffect(() => {
    if (tab.uIPattern !== UIPattern.EDIT_ONLY || !tab.defaultEditMode) {
      return;
    }
    if (!isSrOneToOneExtension(tab)) {
      return;
    }
    if (!parentSelectedRecordId) {
      return;
    }
    // Only auto-open when the parent selection is different from the last time we
    // auto-opened. This lets the user close the form view and stay in grid mode.
    if (srAutoOpenedForParentRef.current === parentSelectedRecordId) {
      return;
    }
    srAutoOpenedForParentRef.current = parentSelectedRecordId;
    handleSetRecordId(parentSelectedRecordId);
  }, [tab, parentSelectedRecordId, handleSetRecordId]);

  const paneFocusInput = { mode: viewMode, isTabFocused: isFocused, focusedPane };
  const isGridPaneFocused = isPaneFocused({ ...paneFocusInput, pane: SPLIT_PANES.GRID });
  const isFormPaneFocused = isPaneFocused({ ...paneFocusInput, pane: SPLIT_PANES.FORM });
  const paneTabIndex = getPaneTabIndex(viewMode);

  return (
    <div
      className={`relative bg-(linear-gradient(180deg, #C6CFFF 0%, #FCFCFD 55.65%)) flex gap-2 max-w-auto overflow-hidden flex-col min-h-0 shadow-lg ${
        collapsed ? "hidden" : "flex-1 h-full"
      }`}
      data-testid={`Tab__${tab.id}`}>
      <Toolbar
        windowId={windowIdentifier || tab.window}
        tabId={tab.id}
        isFormView={shouldShowForm}
        isSplitView={isSplitView}
        isFocused={isFocused}
        data-testid="Toolbar__5893c8"
      />
      <div
        ref={panesRef}
        className={getPanesContainerClassName(viewMode)}
        style={getPanesContainerStyle(splitState.tableWidth)}>
        <div
          ref={gridPaneRef}
          tabIndex={paneTabIndex}
          onFocus={handleGridPaneFocus}
          className={getGridPaneClassName(viewMode, getFocusBorderColor(isGridPaneFocused))}
          style={getGridPaneStyle(viewMode)}
          data-testid={SPLIT_PANE_TEST_IDS.GRID}>
          <AttachmentProvider data-testid="AttachmentProvider__5893c8">
            <DynamicTable
              isTreeMode={isTreeView}
              setRecordId={handleSetRecordId}
              onRecordSelection={handleRecordSelection}
              isVisible={isGridPaneVisible(viewMode)}
              isPrimaryView={isGridPaneExclusive(viewMode)}
              isTabCollapsed={collapsed}
              areFiltersDisabled={advancedFilters.length > 0}
              uIPattern={tab.uIPattern}
              isFocused={isFocused}
              onFocusAcquire={acquire}
              data-testid="DynamicTable__5893c8"
            />
          </AttachmentProvider>
        </div>
        {isSplitView && (
          <ResizeHandle
            variant="divider"
            direction="horizontal"
            containerRef={panesRef}
            initialWidth={splitState.tableWidth}
            minWidth={SPLIT_MIN_TABLE_WIDTH}
            maxWidth={SPLIT_MAX_TABLE_WIDTH}
            maxOffsetRem={0}
            onWidthChange={handleSplitDrag}
            onWidthChangeEnd={handleSplitDragEnd}
            data-testid="SplitViewDivider__5893c8"
          />
        )}
        {shouldShowForm && (
          <div
            ref={formPaneRef}
            tabIndex={paneTabIndex}
            onFocus={handleFormPaneFocus}
            className={getFormPaneClassName(isFormPaneFocused)}
            data-testid={SPLIT_PANE_TEST_IDS.FORM}>
            <FormView
              key={isSrTab ? `sr-${effectiveRecordId}` : undefined}
              mode={formMode}
              tab={tab}
              window={window}
              recordId={effectiveRecordId}
              setRecordId={handleSetRecordId}
              uIPattern={tab.uIPattern}
              isFocused={isFocused}
              onFocusAcquire={acquire}
              canAutoFocus={isFormPaneFocused}
              data-testid="FormView__5893c8"
            />
          </div>
        )}
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
