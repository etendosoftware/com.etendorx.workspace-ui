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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, type SetValueConfig, useForm } from "react-hook-form";
import { useTheme } from "@mui/material";
import InfoIcon from "@workspaceui/componentlibrary/src/assets/icons/file-text.svg";
import FileIcon from "@workspaceui/componentlibrary/src/assets/icons/file.svg";
import FolderIcon from "@workspaceui/componentlibrary/src/assets/icons/folder.svg";
import Info from "@workspaceui/componentlibrary/src/assets/icons/info.svg";
import LinkIcon from "@workspaceui/componentlibrary/src/assets/icons/link.svg";
import NoteIcon from "@workspaceui/componentlibrary/src/assets/icons/note.svg";
import AttachmentIcon from "@workspaceui/componentlibrary/src/assets/icons/paperclip.svg";
import {
  FormMode,
  type Tab,
  type EntityData,
  type EntityValue,
  UIPattern,
} from "@workspaceui/api-client/src/api/types";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import useFormFields from "@/hooks/useFormFields";
import { useFormInitialState } from "@/hooks/useFormInitialState";
import { useFormInitialization } from "@/hooks/useFormInitialization";
import { useSelected } from "@/hooks/useSelected";
import { NEW_RECORD_ID } from "@/utils/url/constants";
import { FormInitializationProvider } from "@/contexts/FormInitializationContext";
import { globalCalloutManager } from "@/services/callouts";
import { useFormAction } from "@/hooks/useFormAction";
import { logger } from "@/utils/logger";
import type { FormViewProps } from "./types";
import { FormViewContext, type FormViewContextValue } from "./contexts/FormViewContext";
import { FormHeader } from "./FormHeader";
import { FormFields } from "./FormFieldsContent";
import { FormActions } from "./FormActions";
import { useStatusModal } from "@/hooks/Toolbar/useStatusModal";
import { useTabContext } from "@/contexts/tab";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import type { SaveOptions } from "@/contexts/ToolbarContext";
import { useDatasourceContext } from "@/contexts/datasourceContext";
import { useRecordNavigation } from "@/hooks/useRecordNavigation";
import { useFormViewNavigation } from "@/hooks/useFormViewNavigation";
import { useWindowContext } from "@/contexts/window";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { REFRESH_TYPES } from "@/utils/toolbar/constants";

const iconMap: Record<string, React.ReactElement> = {
  "Main Section": <FileIcon data-testid="FileIcon__1a0853" />,
  "More Information": <InfoIcon data-testid="InfoIcon__1a0853" />,
  Dimensions: <FolderIcon data-testid="FolderIcon__1a0853" />,
  "Linked Items": <LinkIcon data-testid="LinkIcon__1a0853" />,
  Notes: <NoteIcon data-testid="NoteIcon__1a0853" />,
  Attachments: <AttachmentIcon data-testid="AttachmentIcon__1a0853" />,
};

/**
 * Processes form data by replacing undefined values with empty strings.
 * This ensures form fields have consistent string values instead of undefined,
 * preventing controlled/uncontrolled component issues in React forms.
 *
 * @param data - Raw form data with potential undefined values
 * @returns Processed form data with undefined values converted to empty strings
 */
const processFormData = (
  data: Record<string, EntityValue>,
  fields?: Record<string, any>
): Record<string, EntityValue> => {
  const processedData = { ...data };

  // Ensure all undefined values in data are set to empty string
  for (const key of Object.keys(processedData)) {
    const value = processedData[key];
    if (typeof value === "undefined") {
      processedData[key] = "";
    }
  }

  // If fields definition is provided, ensure all fields are present with at least empty string
  // This forces controlled inputs to clear visually when resetting the form
  if (fields) {
    for (const field of Object.values(fields)) {
      // Use hqlName if available (standard for form fields), fallback to other identifiers
      const key = field.hqlName || field.columnName || field.name;

      // If key is hqlName but data has columnName, map it
      if (key && processedData[key] === undefined) {
        if (field.columnName && processedData[field.columnName] !== undefined) {
          processedData[key] = processedData[field.columnName];
        } else {
          processedData[key] = "";
        }
      }
    }
  }

  return processedData;
};

export function FormView({ window: windowMetadata, tab, mode, recordId, setRecordId, uIPattern }: FormViewProps) {
  const theme = useTheme();

  const computeInitialExpandedSections = useCallback(
    (currentGroups: ReturnType<typeof useFormFields>["groups"]): string[] => {
      return currentGroups
        .filter(([id, group]) => id === null || group.fieldGroupCollapsed === false)
        .map(([id]) => String(id ?? "null"));
    },
    []
  );

  const [expandedSections, setExpandedSections] = useState<string[]>(() =>
    computeInitialExpandedSections(
      [] // groups not yet computed; will be corrected by the tab.id useEffect below
    )
  );
  const [selectedTab, setSelectedTab] = useState<string>("");
  const [isFormInitializing, setIsFormInitializing] = useState(false);
  const [openAttachmentModal, setOpenAttachmentModal] = useState(false);
  const [currentMode, setCurrentMode] = useState<FormMode>(mode);
  const [currentRecordId, setCurrentRecordId] = useState<string | undefined>(recordId);
  const [waitingForRefetch, setWaitingForRefetch] = useState<string | null>(null);
  const [graphVersion, setGraphVersion] = useState(0);

  // Incremented only on explicit user navigation (not on post-save NEW→EDIT transition)
  // so the form element key does NOT change when saving a new record.
  const [formInstanceKey, setFormInstanceKey] = useState(0);

  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const lastSelectedRecordRef = useRef<string | null>(null);
  // Set to true in onSuccess when saving a NEW record so the first re-initialization
  // triggered by the NEW→EDIT transition is treated as a data refresh (uses setValue
  // instead of form.reset) rather than a full form reconstruction.
  const justSavedFromNewRef = useRef(false);

  const { graph } = useSelected();
  const { activeWindow, setSelectedRecord, getSelectedRecord, setSelectedRecordAndClearChildren } = useWindowContext();
  const { statusModal, hideStatusModal, showSuccessModal, showErrorModal } = useStatusModal();
  const { resetFormChanges, parentTab, setAuxiliaryInputs } = useTabContext();
  const { registerFormViewRefetch, registerAttachmentAction, shouldOpenAttachmentModal, setShouldOpenAttachmentModal } =
    useToolbarContext();
  const { refetchDatasource, registerRefetchFunction, updateRecordInDatasource, addRecordToDatasource } =
    useDatasourceContext();
  const { registerRefresh } = useTabRefreshContext();

  // Sync currentMode and currentRecordId with props when they change (e.g., navigating to a different record)
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  useEffect(() => {
    setCurrentRecordId(recordId);
  }, [recordId]);

  // Listen to graph selection changes to trigger a re-render when a process refreshes the record
  useEffect(() => {
    const handleSelected = (selectedTab: Tab, selectedRecord: EntityData) => {
      if (selectedTab.id === tab.id && String(selectedRecord.id) === currentRecordId) {
        const nextRecordString = JSON.stringify(selectedRecord);
        if (lastSelectedRecordRef.current !== nextRecordString) {
          lastSelectedRecordRef.current = nextRecordString;
          setGraphVersion((v) => v + 1);
        }
      }
    };
    graph.on("selected", handleSelected);
    return () => {
      graph.off("selected", handleSelected);
    };
  }, [graph, tab.id, currentRecordId]);

  const {
    formInitialization,
    refetch,
    loading: loadingFormInitialization,
  } = useFormInitialization({
    tab,
    mode: currentMode,
    recordId: currentRecordId,
  });
  const initialState = useFormInitialState(formInitialization) || undefined;

  // Determine read-only state from two sources:
  // 1. Tab-level uIPattern "RO" — the tab itself is defined as read-only
  // 2. Record-level _readOnly — the backend security layer (DAL) marks this specific
  //    record as read-only for the current role (e.g. system records with org='0'
  //    are not writable by non-system roles even if the window access is isreadwrite='Y')
  const isReadOnly = uIPattern === UIPattern.READ_ONLY || formInitialization?._readOnly === true;

  // Effect to detect when form initialization completes after save
  useEffect(() => {
    if (waitingForRefetch && !loadingFormInitialization && currentRecordId === waitingForRefetch) {
      // Form initialization has completed for the newly saved record
      setWaitingForRefetch(null);
      setIsFormInitializing(false);
    }
  }, [waitingForRefetch, loadingFormInitialization, currentRecordId]);

  // Sync auxiliary input values from form initialization into tab-scoped context
  useEffect(() => {
    if (!formInitialization?.auxiliaryInputValues) return;
    const aux: Record<string, string> = {};
    for (const [key, { value }] of Object.entries(formInitialization.auxiliaryInputValues)) {
      aux[key] = value;
    }
    setAuxiliaryInputs(aux);
  }, [formInitialization, setAuxiliaryInputs]);

  const refreshRecordAndSession = useCallback(async () => {
    if (!recordId || recordId === NEW_RECORD_ID) {
      await refetch();
      return;
    }

    try {
      const extraProperties = Object.values(tab.fields || {})
        .filter((f: any) => f.colorFieldName)
        .map((f: any) => `${f.hqlName || f.columnName}$${f.colorFieldName}`)
        .join(",");

      // Fetch the record first so the graph is updated before refetch() runs.
      // Running them in parallel caused a race: if refetch() completed first, the graph-sync
      // useEffect would compute availableFormData from the stale graph record and cache that
      // hash in lastGraphSyncDataRef. When datasource.get() then returned the updated record
      // the guard could block the final setSelectedMultiple call, leaving processButtons stale.
      const getResult = (await datasource.get(tab.entityName, {
        criteria: [{ fieldName: "id", operator: "equals", value: recordId }],
        windowId: tab.window,
        tabId: tab.id,
        pageSize: 1,
        startRow: 0,
        endRow: 1,
        ...(extraProperties ? { _extraProperties: extraProperties } : {}),
      })) as { data: { response?: { data?: EntityData[] } } };

      const currentlySelectedId = activeWindow?.windowIdentifier
        ? getSelectedRecord(activeWindow.windowIdentifier, tab.id)
        : null;

      if (currentlySelectedId && currentlySelectedId !== recordId) {
        // Stop right here if the user has navigated or cloned to another record while we fetched.
        return;
      }

      const responseData = getResult.data.response?.data;
      if (responseData && responseData.length > 0) {
        const updatedRecord = responseData[0];

        graph.setSelected(tab, updatedRecord);
        graph.setSelectedMultiple(tab, [updatedRecord]);

        // Also update the datasource's main records list so the Table component doesn't show old
        // values when navigating back from the form to the grid.
        updateRecordInDatasource(tab.id, updatedRecord);
      }

      // Run refetch() after the graph holds the fresh record so availableFormData (and thus
      // lastGraphSyncDataRef) is based on up-to-date data when form initialization returns.
      await refetch();
    } catch (error) {
      logger.warn("Error refreshing record and session:", error);
    }
  }, [recordId, tab, graph, refetch, updateRecordInDatasource, activeWindow?.windowIdentifier, getSelectedRecord]);

  useEffect(() => {
    if (registerFormViewRefetch) {
      registerFormViewRefetch(refreshRecordAndSession);
    }
    // Register refetch function in DatasourceContext so parent tabs can trigger refresh
    registerRefetchFunction(tab.id, refreshRecordAndSession);
  }, [registerFormViewRefetch, refreshRecordAndSession, registerRefetchFunction, tab.id]);

  // Register form's refresh function with TabRefreshContext
  // This allows the form refresh to be triggered alongside table refresh
  useEffect(() => {
    registerRefresh(tab.tabLevel, REFRESH_TYPES.FORM, refreshRecordAndSession);
  }, [tab.tabLevel, registerRefresh, refreshRecordAndSession]);

  // Register attachment action for toolbar button
  useEffect(() => {
    if (registerAttachmentAction) {
      registerAttachmentAction(() => {
        setOpenAttachmentModal(() => {
          return true;
        });
      });
    }

    return () => {
      if (registerAttachmentAction) {
        registerAttachmentAction(undefined);
      }
    };
  }, [registerAttachmentAction]);

  // Open attachment modal when flag is set (from table navigation)
  useEffect(() => {
    if (shouldOpenAttachmentModal) {
      setOpenAttachmentModal(() => {
        return true;
      });
      // Reset flag after using it
      setShouldOpenAttachmentModal(false);
    }
  }, [shouldOpenAttachmentModal, setShouldOpenAttachmentModal]);

  const defaultIcon = useMemo(
    () => <Info fill={theme.palette.baselineColor.neutral[80]} data-testid="Info__1a0853" />,
    [theme.palette.baselineColor.neutral]
  );

  /**
   * Retrieves the appropriate icon for a form field group/section.
   * Maps predefined section identifiers to their corresponding icons,
   * falls back to default info icon for unknown sections.
   *
   * @param identifier - String identifier of the form section
   * @returns React element representing the icon for the section
   */
  const getIconForGroup = useCallback(
    (identifier: string) => {
      return iconMap[identifier] || defaultIcon;
    },
    [defaultIcon]
  );

  const initialNoteCount = useMemo(() => {
    // Safely retrieve the noteCount, defaulting to 0 if not present
    return formInitialization?.noteCount || 0;
  }, [formInitialization]);

  const initialAttachmentCount = useMemo(() => {
    // Safely retrieve the attachmentCount, defaulting to 0 if not present
    return formInitialization?.attachmentCount || 0;
  }, [formInitialization]);

  /**
   * Computes the current record data from multiple sources with priority order:
   * 1. URL-based record selection (highest priority)
   * 2. Graph-based record selection
   * 3. Direct recordId parameter
   * 4. New record state
   *
   * Handles multi-window scenarios and maintains consistency between
   * URL state, graph state, and component props.
   *
   * @returns EntityData object representing current record or null if no record
   */
  const record = useMemo(() => {
    const windowIdentifier = activeWindow?.windowIdentifier;

    if (!windowIdentifier) return null;

    if (currentRecordId === NEW_RECORD_ID) {
      return null;
    }

    const selectedRecordId = getSelectedRecord(windowIdentifier, tab.id);
    if (selectedRecordId && selectedRecordId === currentRecordId) {
      // First try to get the currently selected active record.
      // After a process executes, refreshRecordAndSession assigns the fresh API response to graph.setSelected.
      const selectedNodeRecord = graph.getSelected(tab);
      if (selectedNodeRecord && String(selectedNodeRecord.id) === currentRecordId) {
        return selectedNodeRecord;
      }

      // Fallback to the grid records cache
      const graphRecord = graph.getRecord(tab, selectedRecordId);
      if (graphRecord && String(graphRecord.id) === currentRecordId) {
        return graphRecord;
      }
      return { id: selectedRecordId } as EntityData;
    }

    if (currentRecordId && currentRecordId !== NEW_RECORD_ID) {
      return { id: currentRecordId } as EntityData;
    }

    return null;
  }, [activeWindow?.windowIdentifier, getSelectedRecord, tab, currentRecordId, graph, graphVersion]);

  /**
   * Merges record data with form initialization data to create complete form state.
   * Combines existing record values with server-provided initial values,
   * giving priority to record data when available.
   *
   * @returns Combined form data object ready for form initialization
   */
  const availableFormData = useMemo(() => {
    // Explicitly handle NEW record case to avoid merging old record data
    if (currentRecordId === NEW_RECORD_ID) {
      return { ...initialState };
    }

    // Smart merge: start with initialState as base, then overlay record values
    // Only use record values that are not undefined/null (those are "no value")
    // This preserves initialState values (like dropdown entries) while prioritizing record data
    const formattedResult = { ...record };

    if (initialState) {
      for (const [key, value] of Object.entries(initialState)) {
        // If the record from the DB completely lacks this field (undefined),
        // only then we fallback to the default initialState value.
        // Null and "" are valid values from the database and MUST OVERRIDE initialState
        if (formattedResult[key] === undefined && value !== undefined) {
          formattedResult[key] = value;
        }
      }
    }

    return formattedResult;
  }, [record, initialState, currentRecordId]);

  const { fields, groups } = useFormFields(tab, currentRecordId, currentMode, true, availableFormData);

  // Reset expanded sections whenever the tab changes so each tab opens with the
  // correct collapsed/expanded state driven by fieldGroupCollapsed metadata.
  // We track the previous tab.id so we only reset on a genuine tab navigation,
  // not on every groups/availableFormData change within the same tab.
  const lastTabIdForSectionsRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastTabIdForSectionsRef.current === tab.id) return;
    lastTabIdForSectionsRef.current = tab.id;
    setExpandedSections(computeInitialExpandedSections(groups));
  }, [tab.id, computeInitialExpandedSections, groups]);

  const formMethods = useForm({ defaultValues: availableFormData as EntityData });
  const { reset, setValue, formState, ...form } = formMethods;

  const resetRef = useRef(reset);
  resetRef.current = reset;

  const dirtyFieldsRef = useRef(formState.dirtyFields);
  dirtyFieldsRef.current = formState.dirtyFields;

  /**
   * Creates a stable reference to the form reset function to prevent infinite loops.
   * The reset function from useForm can change on every render, so this wrapper
   * provides a stable callback that always calls the latest reset function.
   *
   * @param data - Form data to reset the form with
   * @param options - Reset options, defaults to keepDirty: false for initial load
   */
  const stableReset = useCallback((data: EntityData, options = { keepDirty: false }) => {
    resetRef.current(data, options);
  }, []);

  // Note: Form initialization is now handled automatically by useFormInitialization hook
  // No need for manual refetch here as the hook includes useEffect that triggers on param changes

  /**
   * useEffect: Initializes/resets form with processed form data.
   * Processes data to handle undefined values, resets the form,
   * and manages initialization state to prevent premature renders.
   * Uses queueMicrotask to ensure state update occurs after form reset.
   *
   * Dependencies: availableFormData, tab.id, stableReset
   */
  const lastInitializedDataRef = useRef<string>("");
  // Tracks the record+mode context of the last full reset, so data-only refreshes
  // for the same record can use setValue instead of reset (avoids full re-render).
  const lastInitializedContextRef = useRef<{ recordId: string | undefined; mode: FormMode } | null>(null);

  const applyDataRefresh = useCallback(
    (processedData: Record<string, EntityValue>) => {
      // For data-only refreshes, update changed fields immediately via setValue — even while
      // loadingFormInitialization is true (i.e. a background refetch is in progress).
      // This is key for fast parent-tab updates: datasource.get() completes quickly and
      // updates the graph (graphVersion → record → availableFormData), but a concurrent
      // refetch() would block this useEffect via the loadingFormInitialization guard and
      // delay the visual update by the full refetch round-trip (~1-3s).
      // Safety: we skip undefined values (fields absent from the intermediate availableFormData
      // while initialState is null/stale) and $_entries (dropdown lists) to avoid clearing
      // fields that come only from formInitialization and haven't been re-fetched yet.
      const currentValues = form.getValues();
      for (const [key, newValue] of Object.entries(processedData)) {
        // Skip dropdown option lists: they are very large arrays that don't change during a
        // record refresh (they are populated on initial load / callout execution only).
        if (key.endsWith("$_entries")) continue;

        // Skip fields absent from the current availableFormData (e.g. session attributes that
        // come only from formInitialization while it is being re-fetched). We'll pick those up
        // in the second pass once loadingFormInitialization becomes false.
        if (newValue === undefined) continue;

        const currentVal = currentValues[key];

        // Fast path for primitives (string/number/boolean/null/undefined): direct equality.
        // Only fall back to JSON.stringify for objects, avoiding serialising large structures.
        const hasChanged =
          newValue !== null && typeof newValue === "object"
            ? JSON.stringify(currentVal) !== JSON.stringify(newValue)
            : currentVal !== newValue;

        if (hasChanged) {
          setValue(key, newValue as EntityValue, { shouldDirty: false });
        }
      }
    },
    [form, setValue]
  );

  const applyFullInitialization = useCallback(
    (processedData: Record<string, EntityValue>) => {
      setIsFormInitializing(true);

      // Suppress callouts during initial value setting to prevent cascading changes
      globalCalloutManager.suppress();

      // Reset with keepDirty: false for initial load to prevent false dirty state
      stableReset(processedData, { keepDirty: false });

      queueMicrotask(() => {
        setIsFormInitializing(false);
        // Allow callouts after values have settled
        setTimeout(() => {
          globalCalloutManager.resume();
        }, 100); // Delay to allow all values to settle before enabling callouts
      });
    },
    [stableReset]
  );

  const hasDataChanged = useCallback((formData: any) => {
    // Prevent resetting if the data hasn't actually changed.
    // Exclude `$_entries` keys (dropdown option lists) from the comparison: they can be
    // very large arrays (100+ items per selector field) and they don't change on record
    // data refreshes — only on initial load or callout execution.
    const currentDataString = JSON.stringify(formData, (_key, value) =>
      _key.endsWith("$_entries") ? undefined : value
    );
    if (lastInitializedDataRef.current === currentDataString) {
      return false;
    }
    lastInitializedDataRef.current = currentDataString;
    return true;
  }, []);

  const checkIsDataRefresh = useCallback(() => {
    // Determine whether this is a navigation/initial load or a data-only refresh.
    // A data refresh happens when the same record in the same mode receives new data
    // (e.g. parent tab refreshing after a child tab save). In that case we update
    // only the changed fields via setValue to avoid re-rendering every input.
    //
    // We also treat the first re-initialization after a NEW→EDIT post-save transition
    // as a data refresh, because the server just confirmed the data we sent — only
    // server-computed deltas need to be applied, no full reconstruction needed.
    const isPostNewSave = justSavedFromNewRef.current;
    if (isPostNewSave) {
      justSavedFromNewRef.current = false;
    }
    const lastCtx = lastInitializedContextRef.current;
    return isPostNewSave || (lastCtx !== null && lastCtx.recordId === currentRecordId && lastCtx.mode === currentMode);
  }, [currentRecordId, currentMode]);

  useEffect(() => {
    // If we are in a "hidden" state (empty recordId and not NEW mode), just reset and return
    // This prevents unnecessary initialization logic and potential loops
    if (!currentRecordId && currentMode !== FormMode.NEW) {
      stableReset({}, { keepDirty: false });
      setIsFormInitializing(false);
      lastInitializedDataRef.current = "";
      lastInitializedContextRef.current = null;
      return;
    }

    if (!availableFormData) {
      return;
    }

    if (!hasDataChanged(availableFormData)) {
      return;
    }

    const processedData = processFormData(availableFormData, tab.fields);

    const isDataRefresh = checkIsDataRefresh();

    lastInitializedContextRef.current = { recordId: currentRecordId, mode: currentMode };

    if (isDataRefresh) {
      applyDataRefresh(processedData);
      return;
    }

    // If the user has already interacted with a NEW-mode form before the FIC response arrived,
    // use applyDataRefresh to avoid wiping dirty state with stableReset({ keepDirty: false }).
    if (currentMode === FormMode.NEW && Object.keys(dirtyFieldsRef.current).length > 0) {
      applyDataRefresh(processedData);
      return;
    }

    // For full resets (initial load, navigation to a different record) wait until form
    // initialization data is ready — premature resets with stale data would populate
    // dropdowns incorrectly and cause a double-reset flash.
    if (loadingFormInitialization) {
      return;
    }

    applyFullInitialization(processedData);
  }, [
    availableFormData,
    tab.id,
    tab.fields,
    loadingFormInitialization,
    currentRecordId,
    currentMode,
    applyDataRefresh,
    applyFullInitialization,
    hasDataChanged,
    checkIsDataRefresh,
    stableReset,
  ]);

  /**
   * Update graph selection when navigating to a different record.
   * This ensures child tabs and processButtons (useToolbar) see the correct record data.
   *
   * IMPORTANT: We guard with `currentRecordId === recordId` to avoid syncing the graph
   * while `currentRecordId` (useState) is still catching up with the new `recordId` prop.
   * If we update the graph before `currentRecordId` is in sync, `availableFormData` still
   * contains the previous record's data, which would poison `graph.setSelectedMultiple` and
   * cause `processButtons` to evaluate their displayLogic against the old record.
   */
  const lastGraphSyncDataRef = useRef<string>("");

  useEffect(() => {
    if (!recordId || recordId === NEW_RECORD_ID || !availableFormData) return;

    // Only sync graph when internal state has caught up with the new recordId prop.
    // During duplication, recordId prop changes one render before currentRecordId updates.
    if (currentRecordId !== recordId) return;

    // Prevent re-syncing the graph if the data hasn't actually changed.
    // This stops cascading updates (like child tab SETSESSION) when availableFormData
    // changes reference but not actual data content.
    const currentDataString = JSON.stringify(availableFormData, (_key, value) =>
      _key.endsWith("$_entries") ? undefined : value
    );
    if (lastGraphSyncDataRef.current === currentDataString) {
      return;
    }
    lastGraphSyncDataRef.current = currentDataString;

    // Update graph with current record data so child tabs can see the parent selection
    graph.setSelected(tab, availableFormData);
    graph.setSelectedMultiple(tab, [availableFormData]);
  }, [recordId, currentRecordId, tab, availableFormData, graph]);

  /**
   * Enhanced setValue function with controlled dirty state management.
   * Wraps react-hook-form's setValue to provide consistent behavior
   * for form field updates with proper dirty state tracking.
   *
   * When shouldTouch is not explicitly provided:
   * - During form initialization: shouldTouch = false (to avoid false touches)
   * - After form is ready: shouldTouch = true (user interactions should mark as touched)
   *
   * @param name - Field name to update
   * @param value - New field value
   * @param options - Additional options including shouldDirty and shouldTouch flags
   */
  const handleSetValue = useCallback(
    (name: string, value: EntityValue, options?: SetValueConfig) => {
      const { shouldDirty = true, shouldTouch, ...rest } = options || {};

      // If shouldTouch is explicitly provided, use it
      // Otherwise, only touch if form is not initializing (meaning it's a user interaction)
      const shouldTouchField = shouldTouch !== undefined ? shouldTouch : !isFormInitializing;

      setValue(name, value, { shouldDirty, shouldTouch: shouldTouchField, ...rest });
    },
    [setValue, isFormInitializing]
  );

  /**
   * Handles tab changes in multi-tab forms.
   * Updates selected tab and ensures the new tab section is expanded
   * for proper user navigation experience.
   *
   * @param newTabId - ID of the tab being switched to
   */
  const handleTabChange = useCallback((newTabId: string) => {
    setSelectedTab(newTabId);
    setExpandedSections((prev) => {
      if (!prev.includes(newTabId)) {
        return [...prev, newTabId];
      }
      return prev;
    });
  }, []);

  /**
   * Creates a ref callback function for form sections.
   * Provides a way to store DOM references for form sections,
   * handling null sectionId by converting it to "_main".
   *
   * @param sectionId - ID of the form section (null becomes "_main")
   * @returns Ref callback function that stores the element reference
   */
  const handleSectionRef = useCallback(
    (sectionId: string | null) => (el: HTMLElement | null) => {
      const id = String(sectionId || "_main");
      sectionRefs.current[id] = el;
    },
    []
  );

  /**
   * Handles accordion expand/collapse state changes.
   * Manages which form sections are expanded or collapsed,
   * and updates the selected tab when a section is expanded.
   *
   * @param sectionId - ID of the section being toggled (null becomes "_main")
   * @param isExpanded - Whether the section is being expanded (true) or collapsed (false)
   */
  const handleAccordionChange = useCallback((sectionId: string | null, isExpanded: boolean) => {
    const id = String(sectionId || "_main");

    setExpandedSections((prev) => {
      if (isExpanded) {
        return [...prev, id];
      }
      return prev.filter((existingId) => existingId !== id);
    });

    if (isExpanded) {
      setSelectedTab(id);
    }
  }, []);

  /**
   * Checks if a form section is currently expanded.
   * Used to determine the visual state of accordion sections
   * and manage their expand/collapse behavior.
   *
   * @param sectionId - ID of the section to check (null becomes "_main")
   * @returns Boolean indicating if the section is expanded
   */
  const isSectionExpanded = useCallback(
    (sectionId: string | null) => {
      const id = String(sectionId);
      return expandedSections.includes(id);
    },
    [expandedSections]
  );

  /**
   * Handles successful form save operations.
   * Updates form state, graph selection, URL state, and shows success feedback.
   * Differentiates behavior between EDIT mode (reset form) and CREATE mode (redirect to new record).
   * Also refreshes parent tab datasource if this is a child tab.
   *
   * @param data - Saved entity data returned from server
   * @param options - Save options including showModal and skipFormStateUpdate flags
   */
  const onSuccess = useCallback(
    async (data: EntityData, options: SaveOptions) => {
      const { showModal = false, skipFormStateUpdate = false } = options;

      // Clear only the cache for this specific entity to get fresh data
      // This is more targeted than clearing the entire cache
      datasource.clearCacheForEntity(tab.entityName);
      if (parentTab) {
        datasource.clearCacheForEntity(parentTab.entityName);
      }

      setIsFormInitializing(true);

      graph.setSelected(tab, data);
      graph.setSelectedMultiple(tab, [data]);

      const windowIdentifier = activeWindow?.windowIdentifier;
      if (windowIdentifier) {
        setSelectedRecord(windowIdentifier, tab.id, String(data.id));
      }

      const newRecordId = String(data.id);

      if (currentMode === FormMode.NEW) {
        // Mark that the next availableFormData change is a post-save update, not navigation.
        // This prevents the form from doing a full reset (and visual reconstruction) when
        // transitioning from NEW to EDIT mode after a successful save.
        justSavedFromNewRef.current = true;

        if (!skipFormStateUpdate) {
          // For new records, change to EDIT mode with the new record ID first
          setCurrentMode(FormMode.EDIT);
          setCurrentRecordId(newRecordId);
          setRecordId(newRecordId); // Also update parent state
        }

        // Set flag to wait for automatic refetch to complete
        setWaitingForRefetch(newRecordId);
        // The useEffect will clear waitingForRefetch and set isFormInitializing to false
        // when the refetch completes
      } else {
        // For EDIT mode, manually refetch to get updated calculated fields
        await refetch();
        setIsFormInitializing(false);
      }

      if (showModal) {
        showSuccessModal("Saved");
      }

      resetFormChanges();

      // Fetch the complete updated record with _extraProperties so the Table can correctly show formatted fields (colors/references).
      const extraProperties = Object.values(tab.fields || {})
        .filter((f: any) => f.colorFieldName)
        .map((f: any) => `${f.hqlName || f.columnName}$${f.colorFieldName}`)
        .join(",");

      let completeRecord = data;
      try {
        const fullRecordResult = (await datasource.get(tab.entityName, {
          criteria: [{ fieldName: "id", operator: "equals", value: data.id }],
          windowId: tab.window,
          tabId: tab.id,
          pageSize: 1,
          startRow: 0,
          endRow: 1,
          ...(extraProperties ? { _extraProperties: extraProperties } : {}),
        })) as { data: { response?: { data?: EntityData[] } } };

        if (fullRecordResult.data.response?.data?.[0]) {
          completeRecord = fullRecordResult.data.response.data[0];
          // Update the graph again just in case there are missing pieces in the partial save payload.
          // Also call setSelectedMultiple so useToolbar's processButtons re-evaluates displayLogic
          // against the complete record (the lastGraphSyncDataRef guard in the graph-sync useEffect
          // may block the indirect update when completeRecord content equals the save response).
          graph.setSelected(tab, completeRecord);
          graph.setSelectedMultiple(tab, [completeRecord]);
        }
      } catch (e) {
        console.error("Could not fetch full record after save to update table properties:", e);
      }

      // Update the record in the Table's datasource in-place
      // This ensures the table shows updated data without losing pagination state
      if (currentMode === FormMode.NEW) {
        addRecordToDatasource(tab.id, completeRecord);
      } else {
        updateRecordInDatasource(tab.id, completeRecord);
      }

      // Parent tab refresh is handled by wrappedOnSave in ToolbarContext
      // after a successful save, preventing a double refresh on success
      // and an incorrect refresh on failure.
    },
    [
      currentMode,
      graph,
      tab,
      activeWindow?.windowIdentifier,
      showSuccessModal,
      setRecordId,
      setSelectedRecord,
      resetFormChanges,
      updateRecordInDatasource,
      addRecordToDatasource,
      refetch,
    ]
  );

  /**
   * Handles form save errors.
   * Displays error message to user via modal notification.
   *
   * @param data - Error message string from server or validation
   */
  const onError = useCallback(
    (data: string) => {
      showErrorModal(data);
    },
    [showErrorModal]
  );

  const { save, loading } = useFormAction({
    windowMetadata,
    tab,
    mode: currentMode,
    onSuccess,
    onError,
    initialState,
    submit: form.handleSubmit,
  });

  /**
   * Wrapper function for form save operations.
   * Provides a consistent interface for save operations with options object.
   *
   * @param options - Save options including showModal and skipFormStateUpdate flags
   */
  const handleSave = useCallback(
    async (options: SaveOptions): Promise<boolean> => {
      if (!globalCalloutManager.arePendingCalloutsEmpty() || globalCalloutManager.isCalloutRunning()) {
        await globalCalloutManager.waitForIdle();
      }
      return await save(options);
    },
    [save]
  );

  const isLoading = loading || loadingFormInitialization;

  /**
   * Get navigation records from DatasourceContext
   * Records are only available if user has viewed the table first
   * This matches classic interface behavior and prevents infinite loops
   */
  const {
    records: navigationRecords,
    hasMoreRecords,
    fetchMore,
  } = useFormViewNavigation({
    tab,
  });

  /**
   * Handles navigation to a new record
   * Uses setSelectedRecordAndClearChildren to atomically update parent selection and clear all children
   * This ensures child tabs (including those in FormView) return to table view
   */
  const handleNavigateToRecord = useCallback(
    (newRecordId: string) => {
      // Force a fresh form mount so stale field state doesn't bleed into the new record.
      setFormInstanceKey((prev) => prev + 1);

      // Get child tabs that need to be cleared
      const children = graph.getChildren(tab);
      const childIds =
        children && children.length > 0 ? children.filter((c) => c.window === tab.window).map((c) => c.id) : [];

      // Use atomic update to change parent selection and clear all children in one operation
      // This forces children to return to table view even if they were in FormView
      if (activeWindow?.windowIdentifier && childIds.length > 0) {
        setSelectedRecordAndClearChildren(activeWindow.windowIdentifier, tab.id, newRecordId, childIds);

        // Also clear the graph selection for all children to ensure they reset completely
        for (const child of children ?? []) {
          graph.clearSelected(child);
        }
      }
      setRecordId(newRecordId);
    },
    [setRecordId, graph, tab, activeWindow, setSelectedRecordAndClearChildren]
  );

  /**
   * Record navigation integration
   * Provides next/previous navigation with autosave functionality
   */
  const { navigationState, navigateToNext, navigateToPrevious, isNavigating } = useRecordNavigation({
    currentRecordId: recordId,
    records: navigationRecords,
    onNavigate: handleNavigateToRecord,
    formState,
    handleSave,
    showErrorModal,
    hasMoreRecords,
    fetchMore,
  });

  const handleNewRecord = useCallback(() => {
    // Force a fresh form mount so the previous record's field state doesn't carry over.
    setFormInstanceKey((prev) => prev + 1);

    setCurrentMode(FormMode.NEW);
    setCurrentRecordId(NEW_RECORD_ID);
    setRecordId(NEW_RECORD_ID); // This prop update might be async/delayed

    if (activeWindow?.windowIdentifier) {
      setSelectedRecord(activeWindow.windowIdentifier, tab.id, NEW_RECORD_ID);
      graph.clearSelected(tab);
      graph.clearSelectedMultiple(tab);
    }
    resetFormChanges();
  }, [activeWindow?.windowIdentifier, graph, resetFormChanges, setRecordId, setSelectedRecord, tab]);

  /**
   * Context value object containing all form view state and handlers.
   * Provides centralized access to form view functionality for child components
   * through React Context API. Memoized to prevent unnecessary re-renders.
   *
   * @returns FormViewContextValue object with all form view functionality
   */
  const contextValue: FormViewContextValue = useMemo(
    () => ({
      window: windowMetadata,
      tab,
      mode: currentMode,
      recordId,
      setRecordId,
      expandedSections,
      setExpandedSections,
      selectedTab,
      setSelectedTab,
      isFormInitializing,
      setIsFormInitializing,
      handleSectionRef,
      handleAccordionChange,
      handleTabChange,
      isSectionExpanded,
      getIconForGroup,
    }),
    [
      windowMetadata,
      tab,
      currentMode,
      recordId,
      setRecordId,
      expandedSections,
      selectedTab,
      isFormInitializing,
      handleSectionRef,
      handleAccordionChange,
      handleTabChange,
      isSectionExpanded,
      getIconForGroup,
    ]
  );

  return (
    <FormInitializationProvider value={{ isFormInitializing }} data-testid="FormInitializationProvider__1a0853">
      <FormViewContext.Provider value={contextValue}>
        <FormProvider
          setValue={handleSetValue}
          reset={reset}
          formState={formState}
          {...form}
          data-testid="FormProvider__1a0853">
          <form
            key={`form-${tab.id}-${formInstanceKey}`}
            className={`flex h-full max-h-full w-full flex-col gap-2 overflow-hidden transition duration-300 ${
              loading ? "cursor-progress cursor-to-children select-none opacity-50" : ""
            }`}>
            <FormHeader
              statusBarFields={fields.statusBarFields}
              groups={groups}
              statusModal={statusModal}
              hideStatusModal={hideStatusModal}
              navigationState={navigationState}
              onNavigateNext={navigateToNext}
              onNavigatePrevious={navigateToPrevious}
              isNavigating={isNavigating}
              data-testid="FormHeader__1a0853"
            />

            <FormFields
              tab={tab}
              mode={currentMode}
              groups={groups}
              loading={loadingFormInitialization}
              recordId={recordId ?? ""}
              initialNoteCount={initialNoteCount}
              initialAttachmentCount={initialAttachmentCount}
              onNotesChange={refreshRecordAndSession}
              onAttachmentsChange={refreshRecordAndSession}
              showErrorModal={showErrorModal}
              openAttachmentModal={openAttachmentModal}
              onAttachmentModalClose={() => setOpenAttachmentModal(false)}
              isReadOnly={isReadOnly}
              data-testid="FormFields__1a0853"
            />

            <FormActions
              tab={tab}
              onNew={handleNewRecord}
              refetch={refreshRecordAndSession}
              onSave={handleSave}
              showErrorModal={showErrorModal}
              mode={currentMode}
              data-testid="FormActions__1a0853"
            />
          </form>
        </FormProvider>
      </FormViewContext.Provider>
    </FormInitializationProvider>
  );
}

export default FormView;
