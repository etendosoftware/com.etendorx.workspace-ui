import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useStatusModal } from "@/hooks/Toolbar/useStatusModal";
import { useFormAction } from "@/hooks/useFormAction";
import useFormFields from "@/hooks/useFormFields";
import { useFormInitialState } from "@/hooks/useFormInitialState";
import { useFormInitialization } from "@/hooks/useFormInitialization";
import { useSelected } from "@/hooks/useSelected";
import { useTheme } from "@mui/material";
import InfoIcon from "@workspaceui/componentlibrary/src/assets/icons/file-text.svg";
import FileIcon from "@workspaceui/componentlibrary/src/assets/icons/file.svg";
import FolderIcon from "@workspaceui/componentlibrary/src/assets/icons/folder.svg";
import Info from "@workspaceui/componentlibrary/src/assets/icons/info.svg";
import PrimaryTabs from "@workspaceui/componentlibrary/src/components/PrimaryTab";
import type { TabItem } from "@workspaceui/componentlibrary/src/components/PrimaryTab/types";
import Spinner from "@workspaceui/componentlibrary/src/components/Spinner";
import StatusModal from "@workspaceui/componentlibrary/src/components/StatusModal";
import { type EntityData, type EntityValue, FormMode } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import Collapsible from "../Collapsible";
import StatusBar from "./StatusBar";
import { BaseSelector, compileExpression } from "./selectors/BaseSelector";
import type { FormViewProps } from "./types";
import { useUserContext } from "@/hooks/useUserContext";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { NEW_RECORD_ID } from "@/utils/url/constants";
import { globalCalloutManager } from "@/services/callouts";
import { isEmptyObject } from "@/utils/commons";
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
  const [isSucessfullEdit, setIsSucessfullEdit] = useState(false);

  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const initialValuesWithCalloutsRef = useRef({});

  const { graph } = useSelected();
  const { session } = useUserContext();
  const { activeWindow, getSelectedRecord, clearTabFormState, setSelectedRecord } = useMultiWindowURL();
  const { statusModal, showSuccessModal, showErrorModal, hideStatusModal } = useStatusModal();
  const { registerActions } = useToolbarContext();
  const { markFormAsChanged, resetFormChanges } = useTabContext();
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
  const { reset, setValue, control, ...form } = formMethods;

  const tabs: TabItem[] = useMemo(() => {
    return groups.map(([id, group]) => ({
      id: String(id || "_main"),
      icon: getIconForGroup(group.identifier),
      label: group.identifier,
      fill: theme.palette.baselineColor.neutral[80],
      hoverFill: theme.palette.baselineColor.neutral[0],
      showInTab: true,
    }));
  }, [groups, getIconForGroup, theme.palette.baselineColor.neutral]);

  const formValues = useWatch({
    control,
    defaultValue: availableFormData,
  });

  useEffect(() => {
    const hasCalloutFinished = globalCalloutManager.arePendingCalloutsEmpty();
    const { id, ...formValuesWithoutId } = formValues;
    if (
      hasCalloutFinished &&
      !isEmptyObject(formValuesWithoutId) &&
      isEmptyObject(initialValuesWithCalloutsRef.current)
    ) {
      initialValuesWithCalloutsRef.current = formValues;
    }
  }, [formValues]);

  useEffect(() => {
    if (
      !isEmptyObject(initialValuesWithCalloutsRef.current) &&
      JSON.stringify(formValues) !== JSON.stringify(initialValuesWithCalloutsRef.current)
    ) {
      markFormAsChanged();
      initialValuesWithCalloutsRef.current = formValues;
    }

    return () => {
      resetFormChanges();
    };
  }, [formValues, markFormAsChanged, resetFormChanges]);

  useEffect(() => {
    if (selectedTab && containerRef.current) {
      const sectionElement = sectionRefs.current[selectedTab];
      if (sectionElement) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const sectionRect = sectionElement.getBoundingClientRect();

        const sectionTop = sectionRect.top - containerRect.top + containerRef.current.scrollTop;

        containerRef.current.scrollTo({
          top: Math.max(0, sectionTop - 20),
          behavior: "smooth",
        });
      }
    }
  }, [selectedTab, expandedSections]);

  useEffect(() => {
    if (recordId || isSucessfullEdit) {
      refetch();
      setIsSucessfullEdit(false);
    }

    return () => {
      setIsSucessfullEdit(false);
    };
  }, [recordId, isSucessfullEdit, refetch, mode]);

  useEffect(() => {
    if (!availableFormData) return;

    const processedData = processFormData(availableFormData);
    reset(processedData);
  }, [availableFormData, reset, tab.id]);

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

  const onSuccess = useCallback(
    async (data: EntityData) => {
      if (mode === FormMode.EDIT) {
        reset({ ...initialState, ...data });
      } else {
        setRecordId(String(data.id));
      }

      graph.setSelected(tab, data);
      graph.setSelectedMultiple(tab, [data]);

      const windowId = activeWindow?.windowId;
      if (windowId) {
        setSelectedRecord(windowId, tab.id, String(data.id));
      }

      showSuccessModal("Saved");
      setIsSucessfullEdit(true);
    },
    [mode, graph, tab, activeWindow?.windowId, showSuccessModal, reset, initialState, setRecordId, setSelectedRecord]
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

  const isSectionExpanded = useCallback(
    (sectionId: string | null) => {
      const id = String(sectionId);
      return expandedSections.includes(id);
    },
    [expandedSections]
  );

  // NOTE: toolbar actions
  const handleSave = useCallback(async () => {
    await save();
    resetFormChanges();
    initialValuesWithCalloutsRef.current = {};
  }, [save, resetFormChanges]);

  const onReset = useCallback(async () => {
    await refetch();
    resetFormChanges();
    initialValuesWithCalloutsRef.current = {};
  }, [refetch, resetFormChanges]);

  const handleBack = useCallback(() => {
    const windowId = activeWindow?.windowId;
    if (windowId) {
      clearTabFormState(windowId, tab.id);
    }
    graph.clear(tab);
    graph.clearSelected(tab);
    resetFormChanges();
    initialValuesWithCalloutsRef.current = {};
  }, [activeWindow?.windowId, clearTabFormState, graph, tab, resetFormChanges]);

  const handleNew = useCallback(() => {
    setRecordId(NEW_RECORD_ID);
    resetFormChanges();
    initialValuesWithCalloutsRef.current = {};
  }, [setRecordId, resetFormChanges]);

  useEffect(() => {
    const actions = {
      save: handleSave,
      refresh: onReset,
      back: handleBack,
      new: handleNew,
    };

    registerActions(actions);
  }, [registerActions, handleSave, onReset, handleBack, handleNew, tab.id]);

  const isLoading = loading || loadingFormInitialization;

  return (
    <FormProvider setValue={setValue} reset={reset} control={control} {...form}>
      <form
        className={`flex h-full max-h-full w-full flex-col overflow-hidden transition duration-300 ${
          loading ? "cursor-progress cursor-to-children select-none opacity-50" : ""
        }`}
        onSubmit={handleSave}>
        <div className="flex-shrink-0 pl-2 pr-2">
          <div className="mb-2">
            {statusModal.open && (
              <StatusModal
                statusType={statusModal.statusType}
                statusText={statusModal.statusText}
                errorMessage={statusModal.errorMessage}
                saveLabel={statusModal.saveLabel}
                secondaryButtonLabel={statusModal.secondaryButtonLabel}
                onClose={hideStatusModal}
                isDeleteSuccess={statusModal.isDeleteSuccess}
              />
            )}
          </div>
          <StatusBar fields={fields.statusBarFields} />
          <div className="mt-2">
            <PrimaryTabs tabs={tabs} onChange={handleTabChange} selectedTab={selectedTab} icon={defaultIcon} />
          </div>
        </div>
        {isLoading ? (
          <Spinner />
        ) : (
          <div className="flex-grow space-y-2 overflow-auto p-2" ref={containerRef}>
            {groups.map(([id, group]) => {
              const sectionId = String(id || "_main");

              const hasVisibleFields = Object.values(group.fields).some((field) => {
                if (!field.displayed) return false;
                if (!field.displayLogicExpression) return true;

                const compiledExpr = compileExpression(field.displayLogicExpression);
                try {
                  return compiledExpr(session, form.watch());
                } catch (error) {
                  console.warn("Error executing expression:", field.displayLogicExpression, error);
                  return true;
                }
              });

              if (!hasVisibleFields) {
                return null;
              }

              return (
                <div key={sectionId} ref={handleSectionRef(id)}>
                  <Collapsible
                    title={group.identifier}
                    isExpanded={isSectionExpanded(id)}
                    sectionId={sectionId}
                    icon={getIconForGroup(group.identifier)}
                    onToggle={(isOpen: boolean) => handleAccordionChange(id, isOpen)}>
                    <div className="grid auto-rows-auto grid-cols-3 gap-4">
                      {Object.entries(group.fields).map(([hqlName, field]) => (
                        <BaseSelector field={field} key={hqlName} formMode={mode} />
                      ))}
                    </div>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        )}
      </form>
    </FormProvider>
  );
}

export default FormView;
