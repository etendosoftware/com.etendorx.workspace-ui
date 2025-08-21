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
import useFormFields from "@/hooks/useFormFields";
import { useFormInitialState } from "@/hooks/useFormInitialState";
import { useFormInitialization } from "@/hooks/useFormInitialization";
import { useSelected } from "@/hooks/useSelected";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { NEW_RECORD_ID } from "@/utils/url/constants";
import { FormInitializationProvider } from "@/contexts/FormInitializationContext";
import { useFormAction } from "@/hooks/useFormAction";
import type { FormViewProps } from "./types";
import { FormViewContext, type FormViewContextValue } from "./contexts/FormViewContext";
import { FormHeader } from "./FormHeader";
import { FormFields } from "./FormFieldsContent";
import { FormActions } from "./FormActions";
import { useStatusModal } from "@/hooks/Toolbar/useStatusModal";
import { useTabContext } from "@/contexts/tab";

const iconMap: Record<string, React.ReactElement> = {
  "Main Section": <FileIcon />,
  "More Information": <InfoIcon />,
  Dimensions: <FolderIcon />,
};

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
  const { activeWindow, getSelectedRecord, setSelectedRecord } = useMultiWindowURL();
  const { statusModal, hideStatusModal, showSuccessModal, showErrorModal } = useStatusModal();
  const { resetFormChanges } = useTabContext();

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

  const defaultIcon = useMemo(
    () => <Info fill={theme.palette.baselineColor.neutral[80]} />,
    [theme.palette.baselineColor.neutral]
  );

  const getIconForGroup = useCallback(
    (identifier: string) => {
      return iconMap[identifier] || defaultIcon;
    },
    [defaultIcon]
  );

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

  const availableFormData = useMemo(() => {
    return { ...record, ...initialState };
  }, [record, initialState]);

  const { fields, groups } = useFormFields(tab, mode, false, availableFormData);

  const formMethods = useForm({ values: availableFormData as EntityData });
  const { reset, setValue, formState, ...form } = formMethods;

  const resetRef = useRef(reset);
  resetRef.current = reset;

  const stableReset = useCallback((data: EntityData) => {
    resetRef.current(data);
  }, []);

  useEffect(() => {
    if (recordId) {
      refetch();
    }
  }, [recordId, refetch, mode]);

  useEffect(() => {
    if (!availableFormData) return;

    setIsFormInitializing(true);
    const processedData = processFormData(availableFormData);
    stableReset(processedData);

    setTimeout(() => {
      setIsFormInitializing(false);
    }, 50);
  }, [availableFormData, tab.id, stableReset]);

  const handleSetValue = useCallback(
    (name: string, value: EntityValue, options?: SetValueConfig) => {
      const { shouldDirty = true, ...rest } = options || {};
      setValue(name, value, { shouldDirty, ...rest });
    },
    [setValue]
  );

  const handleTabChange = useCallback((newTabId: string) => {
    setSelectedTab(newTabId);
    setExpandedSections((prev) => {
      if (!prev.includes(newTabId)) {
        return [...prev, newTabId];
      }
      return prev;
    });
  }, []);

  const handleSectionRef = useCallback(
    (sectionId: string | null) => (el: HTMLElement | null) => {
      const id = String(sectionId || "_main");
      sectionRefs.current[id] = el;
    },
    []
  );

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

  const isSectionExpanded = useCallback(
    (sectionId: string | null) => {
      const id = String(sectionId);
      return expandedSections.includes(id);
    },
    [expandedSections]
  );

  const onSuccess = useCallback(
    async (data: EntityData, showModal: boolean) => {
      // Prevent callouts while applying server-updated values
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
    ]
  );

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

  const handleSave = useCallback(
    async (showModal: boolean) => {
      await save(showModal);
    },
    [save]
  );

  const isLoading = loading || loadingFormInitialization;

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
    <FormInitializationProvider value={{ isFormInitializing }}>
      <FormViewContext.Provider value={contextValue}>
        <FormProvider setValue={handleSetValue} reset={reset} formState={formState} {...form}>
          <form
            className={`flex h-full max-h-full w-full flex-col gap-2 overflow-hidden transition duration-300 ${
              loading ? "cursor-progress cursor-to-children select-none opacity-50" : ""
            }`}>
            <FormHeader
              statusBarFields={fields.statusBarFields}
              groups={groups}
              statusModal={statusModal}
              hideStatusModal={hideStatusModal}
            />

            <FormFields tab={tab} mode={mode} groups={groups} loading={isLoading} />

            <FormActions
              tab={tab}
              setRecordId={setRecordId}
              refetch={refetch}
              onSave={handleSave}
              showErrorModal={showErrorModal}
            />
          </form>
        </FormProvider>
      </FormViewContext.Provider>
    </FormInitializationProvider>
  );
}

export default FormView;
