import { useDatasourceContext } from "@/contexts/datasourceContext";
import { useTabContext } from "@/contexts/tab";
import type { ToolbarButtonMetadata } from "@/hooks/Toolbar/types";
import useFormFields from "@/hooks/useFormFields";
import { useSelected } from "@/hooks/useSelected";
import { useSelectedRecord } from "@/hooks/useSelectedRecord";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";
import { useUserContext } from "@/hooks/useUserContext";
import { EMPTY_ARRAY } from "@/utils/defaults";
import StatusModal from "@workspaceui/componentlibrary/src/components/StatusModal";
import ConfirmModal from "@workspaceui/componentlibrary/src/components/StatusModal/ConfirmModal";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { useProcessButton } from "../../hooks/Toolbar/useProcessButton";
import { useProcessExecution } from "../../hooks/Toolbar/useProcessExecution";
import { useToolbar } from "../../hooks/Toolbar/useToolbar";
import { useToolbarConfig } from "../../hooks/Toolbar/useToolbarConfig";
import { useTranslation } from "../../hooks/useTranslation";
import { compileExpression } from "../Form/FormView/selectors/BaseSelector";
import ProcessIframeModal from "../ProcessModal/Iframe";
import ProcessDefinitionModal from "../ProcessModal/ProcessDefinitionModal";
import {
  type ProcessButton,
  ProcessButtonType,
  type ProcessDefinitionButton,
  type ProcessResponse,
} from "../ProcessModal/types";
import ProcessMenu from "./ProcessMenu";
import SearchPortal from "./SearchPortal";
import TopToolbar from "./TopToolbar";
import {
  createButtonByType,
  createProcessMenuButton,
  getButtonStyles,
  organizeButtonsBySection,
} from "./buttonConfigs";
import type { ToolbarProps } from "./types";

const BaseSection = { display: "flex", alignItems: "center" };
const EmptyArray: ToolbarButtonMetadata[] = [];

const ToolbarCmp: React.FC<ToolbarProps> = ({ windowId, tabId, isFormView = false }) => {
  const [openModal, setOpenModal] = useState(false);
  const [showProcessDefinitionModal, setShowProcessDefinitionModal] = useState(false);
  const [processResponse, setProcessResponse] = useState<ProcessResponse | null>(null);
  const [selectedProcessActionButton, setSelectedProcessActionButton] = useState<ProcessButton | null>(null);
  const [selectedProcessDefinitionButton, setSelectedProcessDefinitionButton] =
    useState<ProcessDefinitionButton | null>(null);

  const [activeModal, setActiveModal] = useState<{
    button: ToolbarButtonMetadata;
    isOpen: boolean;
  } | null>(null);

  const { session } = useUserContext();
  const { toolbar, loading, refetch } = useToolbar(windowId, tabId);
  const { graph } = useSelected();
  const { executeProcess } = useProcessExecution();
  const { t } = useTranslation();
  const { refetchDatasource } = useDatasourceContext();
  const { tab, parentRecord } = useTabContext();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const buttons: ToolbarButtonMetadata[] = toolbar?.response.data ?? EmptyArray;
  const selectedRecord = useSelectedRecord(tab);
  const parentId = parentRecord?.id?.toString();

  const {
    handleAction,
    searchOpen,
    setSearchOpen,
    handleSearch,
    searchValue,
    setSearchValue,
    statusModal,
    confirmAction,
    handleConfirm,
    handleCancelConfirm,
    hideStatusModal,
  } = useToolbarConfig({ windowId, tabId, parentId, isFormView });

  const { handleProcessClick } = useProcessButton(executeProcess, refetch);
  const selectedItems = useSelectedRecords(tab);
  const {
    fields: { actionFields },
  } = useFormFields(tab);

  const processButtons = useMemo(() => {
    const buttons = Object.values(actionFields) || [];
    return buttons.filter((button) => {
      if (!button.displayed) return false;
      if (selectedItems?.length === 0) return false;
      if (selectedItems?.length > 1 && !button?.processDefinition?.isMultiRecord) return false;
      if (!button.displayLogicExpression) return true;

      const compiledExpr = compileExpression(button.displayLogicExpression);
      try {
        const checkRecord = (record: Record<string, unknown>) => compiledExpr(session, record);
        return button?.processDefinition?.isMultiRecord
          ? selectedItems.every(checkRecord)
          : selectedItems.some(checkRecord);
      } catch {
        return true;
      }
    }) as ProcessButton[];
  }, [actionFields, selectedItems, session]);

  const handleMenuToggle = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!anchorEl) {
        setAnchorEl(event.currentTarget);
      } else {
        setAnchorEl(null);
      }
    },
    [anchorEl]
  );

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleProcessMenuClick = useCallback(
    async (button: ProcessButton) => {
      if (!selectedRecord) return;

      if (ProcessButtonType.PROCESS_ACTION in button) {
        const response = await handleProcessClick(button, String(selectedRecord.id));
        setProcessResponse(response);
        setSelectedProcessActionButton(button);
      } else if (ProcessButtonType.PROCESS_DEFINITION in button) {
        setSelectedProcessDefinitionButton(button);
        setShowProcessDefinitionModal(true);
      } else {
        throw new Error("Unknown process type");
      }

      setOpenModal(true);
      handleMenuClose();
    },
    [handleMenuClose, handleProcessClick, selectedRecord]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      handleSearch(value);
    },
    [handleSearch, setSearchValue]
  );

  const handleProcessSuccess = useCallback(() => {
    refetchDatasource(tab.id);
    graph.clearSelected(tab);
  }, [graph, refetchDatasource, tab]);

  const handleCloseProcess = useCallback(() => {
    setOpenModal(false);
    setProcessResponse(null);
    setSelectedProcessActionButton(null);
  }, []);

  const handleCloseProcessDefinitionModal = useCallback(() => {
    setShowProcessDefinitionModal(false);
    setSelectedProcessDefinitionButton(null);
  }, []);

  const handleCompleteRefresh = useCallback(async () => {
    graph.clearSelected(tab);
    refetchDatasource(tab.id);
  }, [graph, refetchDatasource, tab]);

  const handleCloseSearch = useCallback(() => setSearchOpen(false), [setSearchOpen]);

  const handleCloseStatusModal = useCallback(() => setActiveModal(null), []);

  const toolbarConfig = useMemo(() => {
    const organizedButtons = organizeButtonsBySection(buttons, isFormView);
    const hasSelectedRecord = !!selectedRecord?.id;

    const createSectionButtons = (sectionButtons: ToolbarButtonMetadata[]) =>
      sectionButtons.map((button) => {
        const config = createButtonByType(button, handleAction, isFormView, hasSelectedRecord);

        const styles = getButtonStyles(button);
        if (styles) {
          config.className = config.className ? `${config.className} ${styles}` : styles;
        }

        return config;
      });

    const config = {
      leftSection: {
        buttons: createSectionButtons(organizedButtons.left),
        style: BaseSection,
      },
      centerSection: {
        buttons: createSectionButtons(organizedButtons.center),
        style: { ...BaseSection, gap: "0.25rem" },
      },
      rightSection: {
        buttons: createSectionButtons(organizedButtons.right),
        style: { ...BaseSection, gap: "0.25rem" },
      },
      isItemSelected: hasSelectedRecord,
    };

    if (processButtons.length > 0) {
      config.rightSection.buttons.push(
        createProcessMenuButton(processButtons.length, hasSelectedRecord, handleMenuToggle, t, anchorEl)
      );
    }

    return config;
  }, [buttons, isFormView, selectedRecord?.id, processButtons.length, handleAction, handleMenuToggle, t, anchorEl]);

  if (loading) return null;

  return (
    <>
      <TopToolbar {...toolbarConfig} />
      {activeModal && (
        <StatusModal
          open={activeModal.isOpen}
          statusText={`Modal para: ${activeModal.button.name}`}
          statusType="info"
          saveLabel="Cerrar"
          onClose={handleCloseStatusModal}
        />
      )}
      {statusModal.open && (
        <StatusModal
          open={statusModal.open}
          statusText={statusModal.statusText}
          statusType={statusModal.statusType}
          errorMessage={statusModal.errorMessage}
          saveLabel={statusModal.saveLabel || t("common.close")}
          secondaryButtonLabel={statusModal.secondaryButtonLabel}
          onClose={hideStatusModal}
        />
      )}
      {confirmAction && (
        <ConfirmModal
          open={!!confirmAction}
          confirmText={confirmAction.confirmText}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
          saveLabel={confirmAction.saveLabel || t("common.confirm")}
          secondaryButtonLabel={confirmAction.secondaryButtonLabel || t("common.cancel")}
        />
      )}
      {processButtons.length > 0 && (
        <ProcessMenu
          anchorEl={anchorEl}
          onClose={handleMenuClose}
          processButtons={processButtons}
          onProcessClick={handleProcessMenuClick}
          selectedRecord={selectedRecord}
        />
      )}
      {searchOpen && !isFormView && (
        <SearchPortal
          isOpen={searchOpen}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          onClose={handleCloseSearch}
          placeholder={t("table.placeholders.search")}
          autoCompleteTexts={EMPTY_ARRAY}
        />
      )}
      <ProcessIframeModal
        isOpen={openModal}
        onClose={handleCloseProcess}
        url={processResponse?.iframeUrl}
        title={selectedProcessActionButton?.name}
        onProcessSuccess={handleProcessSuccess}
        tabId={tab.id}
      />
      <ProcessDefinitionModal
        open={showProcessDefinitionModal}
        onClose={handleCloseProcessDefinitionModal}
        button={selectedProcessDefinitionButton}
        onSuccess={handleCompleteRefresh}
        onError={handleCompleteRefresh}
      />
    </>
  );
};

export const Toolbar = ToolbarCmp;
export default Toolbar;
