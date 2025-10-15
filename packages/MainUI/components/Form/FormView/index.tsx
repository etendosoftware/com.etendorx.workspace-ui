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
import { FormMode, type EntityData, type EntityValue } from "@workspaceui/api-client/src/api/types";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import useFormFields from "@/hooks/useFormFields";
import { useFormInitialState } from "@/hooks/useFormInitialState";
import { useFormInitialization } from "@/hooks/useFormInitialization";
import { useSelected } from "@/hooks/useSelected";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
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
import { useDatasourceContext } from "@/contexts/datasourceContext";
import { useRecordNavigation } from "@/hooks/useRecordNavigation";
import { useFormViewNavigation } from "@/hooks/useFormViewNavigation";

const iconMap: Record<string, React.ReactElement> = {
  "Main Section": <FileIcon data-testid="FileIcon__1a0853" />,
  "More Information": <InfoIcon data-testid="InfoIcon__1a0853" />,
  Dimensions: <FolderIcon data-testid="FolderIcon__1a0853" />,
};

/**
 * Processes form data by replacing undefined values with empty strings.
 * This ensures form fields have consistent string values instead of undefined,
 * preventing controlled/uncontrolled component issues in React forms.
 *
 * @param data - Raw form data with potential undefined values
 * @returns Processed form data with undefined values converted to empty strings
 */
const processFormData = (data: Record<string, EntityValue>): Record<string, EntityValue> => {
  const processedData = { ...data };

  for (const key of Object.keys(processedData)) {
    const value = processedData[key];
    if (typeof value === "undefined") {
      processedData[key] = "";
    }
  }

  return processedData;
};

export function FormView({ window: windowMetadata, tab, mode, recordId, setRecordId }: FormViewProps) {
  const theme = useTheme();

  const [expandedSections, setExpandedSections] = useState<string[]>(["null"]);
  const [selectedTab, setSelectedTab] = useState<string>("");
  const [isFormInitializing, setIsFormInitializing] = useState(false);

  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const { graph } = useSelected();
  const { activeWindow, getSelectedRecord, setSelectedRecord, setSelectedRecordAndClearChildren } = useMultiWindowURL();
  const { statusModal, hideStatusModal, showSuccessModal, showErrorModal } = useStatusModal();
  const { resetFormChanges, parentTab } = useTabContext();
  const { registerFormViewRefetch } = useToolbarContext();
  const { refetchDatasource, registerRefetchFunction } = useDatasourceContext();

  const {
    formInitialization,
    refetch,
    loading: loadingFormInitialization,
  } = useFormInitialization({
    tab,
    mode: mode,
    recordId,
  });
  const initialState = useFormInitialState(formInitialization) || undefined;

  const refreshRecordAndSession = useCallback(async () => {
    if (!recordId || recordId === NEW_RECORD_ID) return;

    try {
      const result = await datasource.get(tab.entityName, {
        criteria: [{ fieldName: "id", operator: "equals", value: recordId }],
        windowId: tab.window,
        tabId: tab.id,
        pageSize: 1,
      });

      const responseData = result.data.response?.data;
      if (responseData?.length > 0) {
        const updatedRecord = responseData[0];

        graph.setSelected(tab, updatedRecord);
        graph.setSelectedMultiple(tab, [updatedRecord]);
      }
      await refetch();
    } catch (error) {
      logger.warn("Error refreshing record and session:", error);
    }
  }, [recordId, tab, graph, refetch]);

  useEffect(() => {
    if (registerFormViewRefetch) {
      registerFormViewRefetch(refreshRecordAndSession);
    }
    // Register refetch function in DatasourceContext so parent tabs can trigger refresh
    registerRefetchFunction(tab.id, refreshRecordAndSession);
  }, [registerFormViewRefetch, refreshRecordAndSession, registerRefetchFunction, tab.id]);

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
    const windowId = activeWindow?.windowId;
    if (!windowId) return null;

    if (recordId === NEW_RECORD_ID) return null;

    const selectedRecordId = getSelectedRecord(windowId, tab.id);
    if (selectedRecordId && selectedRecordId === recordId) {
      const graphRecord = graph.getSelected(tab);
      if (graphRecord && String(graphRecord.id) === recordId) {
        return graphRecord;
      }

      return { id: selectedRecordId } as EntityData;
    }

    if (recordId && recordId !== NEW_RECORD_ID) {
      return { id: recordId } as EntityData;
    }

    return null;
  }, [activeWindow?.windowId, getSelectedRecord, tab, recordId, graph]);

  /**
   * Merges record data with form initialization data to create complete form state.
   * Combines existing record values with server-provided initial values,
   * giving priority to record data when available.
   *
   * @returns Combined form data object ready for form initialization
   */
  const availableFormData = useMemo(() => {
    return { ...record, ...initialState };
  }, [record, initialState]);

  const { fields, groups } = useFormFields(tab, recordId, mode, true, availableFormData);

  const formMethods = useForm({ defaultValues: availableFormData as EntityData });
  const { reset, setValue, formState, ...form } = formMethods;

  const resetRef = useRef(reset);
  resetRef.current = reset;

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
  useEffect(() => {
    if (!availableFormData) return;

    setIsFormInitializing(true);
    const processedData = processFormData(availableFormData);

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
  }, [availableFormData, tab.id, stableReset]);

  /**
   * Update graph selection when navigating to a different record
   * This ensures child tabs know about the parent record change
   */
  useEffect(() => {
    if (!recordId || recordId === NEW_RECORD_ID || !availableFormData) return;

    // Update graph with current record data so child tabs can see the parent selection
    graph.setSelected(tab, availableFormData);
    graph.setSelectedMultiple(tab, [availableFormData]);
  }, [recordId, tab, availableFormData, graph]);

  /**
   * Enhanced setValue function with controlled dirty state management.
   * Wraps react-hook-form's setValue to provide consistent behavior
   * for form field updates with proper dirty state tracking.
   *
   * @param name - Field name to update
   * @param value - New field value
   * @param options - Additional options including shouldDirty flag (defaults to true)
   */
  const handleSetValue = useCallback(
    (name: string, value: EntityValue, options?: SetValueConfig) => {
      const { shouldDirty = true, ...rest } = options || {};
      setValue(name, value, { shouldDirty, ...rest });
    },
    [setValue]
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
   * @param showModal - Whether to display success modal to user
   */
  const onSuccess = useCallback(
    async (data: EntityData, showModal: boolean) => {
      setIsFormInitializing(true);
      if (mode === FormMode.EDIT) {
        reset({ ...initialState, ...data });
      } else {
        setRecordId(String(data.id));
      }
      setTimeout(() => setIsFormInitializing(false), 50);

      graph.setSelected(tab, data);
      graph.setSelectedMultiple(tab, [data]);

      const windowId = activeWindow?.windowId;
      if (windowId) {
        setSelectedRecord(windowId, tab.id, String(data.id));
      }
      if (showModal) {
        showSuccessModal("Saved");
      }

      resetFormChanges();

      // Refresh parent tab datasource if this is a child tab
      if (parentTab) {
        refetchDatasource(parentTab.id);
      }
    },
    [
      mode,
      graph,
      tab,
      activeWindow?.windowId,
      showSuccessModal,
      reset,
      initialState,
      setRecordId,
      setSelectedRecord,
      resetFormChanges,
      parentTab,
      refetchDatasource,
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
    mode,
    onSuccess,
    onError,
    initialState,
    submit: form.handleSubmit,
  });

  /**
   * Wrapper function for form save operations.
   * Provides a consistent interface for save operations with modal control.
   *
   * @param showModal - Whether to show success modal after successful save
   */
  const handleSave = useCallback(
    async (showModal: boolean) => {
      await save(showModal);
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
      // Get child tabs that need to be cleared
      const children = graph.getChildren(tab);
      const childIds =
        children && children.length > 0 ? children.filter((c) => c.window === tab.window).map((c) => c.id) : [];

      // Use atomic update to change parent selection and clear all children in one operation
      // This forces children to return to table view even if they were in FormView
      if (activeWindow?.windowId && childIds.length > 0) {
        setSelectedRecordAndClearChildren(activeWindow.windowId, tab.id, newRecordId, childIds);

        // Also clear the graph selection for all children to ensure they reset completely
        for (const child of children) {
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
      mode,
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
      mode,
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
            key={`form-${tab.id}-${recordId}`}
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
              mode={mode}
              groups={groups}
              loading={isLoading}
              recordId={recordId}
              data-testid="FormFields__1a0853"
            />

            <FormActions
              tab={tab}
              setRecordId={setRecordId}
              refetch={refetch}
              onSave={handleSave}
              showErrorModal={showErrorModal}
              data-testid="FormActions__1a0853"
            />
          </form>
        </FormProvider>
      </FormViewContext.Provider>
    </FormInitializationProvider>
  );
}

export default FormView;
