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
import { type EntityData, FormMode } from "@workspaceui/etendohookbinder/src/api/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import Collapsible from "../Collapsible";
import StatusBar from "./StatusBar";
import { BaseSelector, compileExpression } from "./selectors/BaseSelector";
import type { FormViewProps } from "./types";
import { useUserContext } from "@/hooks/useUserContext";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";

const iconMap: Record<string, React.ReactElement> = {
  "Main Section": <FileIcon />,
  "More Information": <InfoIcon />,
  Dimensions: <FolderIcon />,
};

export function FormView({ window: windowMetadata, tab, mode, recordId, setRecordId }: FormViewProps) {
  const theme = useTheme();
  const [expandedSections, setExpandedSections] = useState<string[]>(["null"]);
  const [selectedTab, setSelectedTab] = useState<string>("");
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const { graph } = useSelected();
  const { session } = useUserContext();
  const { activeWindow, getSelectedRecord, clearTabFormState, setSelectedRecord } = useMultiWindowURL();

  const { statusModal, showSuccessModal, showErrorModal, hideStatusModal } = useStatusModal();

  // ✅ OBTENER RECORD DESDE URL + GRAPH HÍBRIDO
  const record = useMemo(() => {
    const windowId = activeWindow?.windowId;
    if (!windowId) return null;

    // Si estamos en modo NEW, no hay record
    if (recordId === "new") return null;

    // Intentar primero desde URL
    const selectedRecordId = getSelectedRecord(windowId, tab.id);
    if (selectedRecordId && selectedRecordId === recordId) {
      // Intentar obtener datos completos del graph
      const graphRecord = graph.getSelected(tab);
      if (graphRecord && String(graphRecord.id) === recordId) {
        console.log(`[FormView ${tab.id}] Using record from graph:`, graphRecord.id);
        return graphRecord;
      }

      // Fallback: crear objeto mínimo con ID
      console.log(`[FormView ${tab.id}] Using minimal record from URL:`, selectedRecordId);
      return { id: selectedRecordId } as EntityData;
    }

    // Si recordId no coincide con selección actual, podría ser navegación directa
    if (recordId && recordId !== "new") {
      console.log(`[FormView ${tab.id}] Using recordId directly:`, recordId);
      return { id: recordId } as EntityData;
    }

    return null;
  }, [activeWindow?.windowId, getSelectedRecord, tab, recordId, graph]);

  const {
    formInitialization,
    refetch,
    loading: loadingFormInitialization,
  } = useFormInitialization({
    tab,
    mode: mode,
    recordId,
  });
  const { registerActions } = useToolbarContext();

  const initialState = useFormInitialState(formInitialization) || undefined;

  const availableFormData = useMemo(() => {
    console.log(`[FormView ${tab.id}] Building form data:`, {
      recordId,
      mode,
      hasRecord: !!record,
      hasInitialState: !!initialState,
    });

    return { ...record, ...initialState };
  }, [record, initialState, recordId, mode, tab.id]);

  const { fields, groups } = useFormFields(tab, mode, false, availableFormData);

  const { reset, setValue, ...form } = useForm({ values: availableFormData as EntityData });

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

  const handleTabChange = useCallback((newTabId: string) => {
    setSelectedTab(newTabId);
    setExpandedSections((prev) => {
      if (!prev.includes(newTabId)) {
        return [...prev, newTabId];
      }
      return prev;
    });
  }, []);

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

  // ✅ ACCIONES ACTUALIZADAS PARA URL
  const onReset = useCallback(async () => {
    console.log(`[FormView ${tab.id}] REFRESH action triggered`);
    await refetch();
  }, [refetch, tab.id]);

  const onSuccess = useCallback(
    async (data: EntityData) => {
      console.log(`[FormView ${tab.id}] SAVE SUCCESS:`, { mode, savedData: data.id });

      if (mode === FormMode.EDIT) {
        reset({ ...initialState, ...data });
      } else {
        // ✅ En modo NEW, actualizar recordId y refrescar
        setRecordId(String(data.id));
        await refetch();
      }

      // ✅ Actualizar graph para compatibilidad
      graph.setSelected(tab, data);
      graph.setSelectedMultiple(tab, [data]);

      // ✅ TAMBIÉN actualizar URL si es necesario
      const windowId = activeWindow?.windowId;
      if (windowId) {
        setSelectedRecord(windowId, tab.id, String(data.id));
      }

      showSuccessModal("Saved");
    },
    [graph, initialState, mode, refetch, reset, setRecordId, showSuccessModal, tab, activeWindow?.windowId]
  );

  const onError = useCallback(
    (data: string) => {
      console.log(`[FormView ${tab.id}] SAVE ERROR:`, data);
      showErrorModal(data);
    },
    [showErrorModal, tab.id]
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

  // ✅ ACTUALIZAR FORM DATA CUANDO CAMBIE
  useEffect(() => {
    if (!availableFormData) return;

    const processedData = { ...availableFormData };
    for (const [key, value] of Object.entries(processedData)) {
      if (typeof value === "undefined") {
        processedData[key] = "";
      }
    }

    console.log(`[FormView ${tab.id}] Resetting form with data:`, Object.keys(processedData));
    reset(processedData);
  }, [availableFormData, reset, tab.id]);

  // ✅ REGISTRAR ACCIONES ESPECÍFICAS DEL FORMULARIO
  const handleSave = useCallback(async () => {
    console.log(`[FormView ${tab.id}] Form SAVE action triggered`);
    await save();
  }, [save, tab.id]);

  const handleBack = useCallback(() => {
    console.log(`[FormView ${tab.id}] Form BACK action triggered`);

    const windowId = activeWindow?.windowId;
    if (windowId) {
      // ✅ Limpiar estado de formulario y volver a tabla
      clearTabFormState(windowId, tab.id);
    }
  }, [activeWindow?.windowId, clearTabFormState, tab.id]);

  const handleNew = useCallback(() => {
    console.log(`[FormView ${tab.id}] Form NEW action triggered`);
    setRecordId("new");
  }, [setRecordId, tab.id]);

  useEffect(() => {
    const actions = {
      save: handleSave,
      refresh: onReset,
      back: handleBack,
      new: handleNew,
    };

    console.log(`[FormView ${tab.id}] Registering form actions:`, Object.keys(actions));
    registerActions(actions);
  }, [registerActions, handleSave, onReset, handleBack, handleNew, tab.id]);

  if (loading || loadingFormInitialization) {
    return <Spinner />;
  }

  console.log(`[FormView ${tab.id}] Rendering form:`, {
    mode,
    recordId,
    hasAvailableData: !!availableFormData,
    groupsCount: groups.length,
  });

  return (
    <FormProvider setValue={setValue} reset={reset} {...form}>
      <form
        className={`w-full h-full max-h-full overflow-hidden flex flex-col transition duration-300  ${
          loading ? "opacity-50 select-none cursor-progress cursor-to-children" : ""
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

        <div className="flex-grow overflow-auto p-2 space-y-2" ref={containerRef}>
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
                  <div className="grid grid-cols-3 auto-rows-auto gap-4">
                    {Object.entries(group.fields).map(([hqlName, field]) => (
                      <BaseSelector field={field} key={hqlName} formMode={mode} />
                    ))}
                  </div>
                </Collapsible>
              </div>
            );
          })}
        </div>
      </form>
    </FormProvider>
  );
}

export default FormView;
