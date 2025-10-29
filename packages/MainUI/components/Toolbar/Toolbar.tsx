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

import { useDatasourceContext } from "@/contexts/datasourceContext";
import { useTabContext } from "@/contexts/tab";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import type { ToolbarButtonMetadata } from "@/hooks/Toolbar/types";
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
import ProcessIframeModal from "../ProcessModal/Iframe";
import ProcessDefinitionModal from "../ProcessModal/ProcessDefinitionModal";
import {
  type ProcessButton,
  ProcessButtonType,
  type ProcessDefinitionButton,
  type ProcessResponse,
} from "../ProcessModal/types";
import ProcessMenu from "./Menus/ProcessMenu";
import SearchPortal from "./SearchPortal";
import TopToolbar from "./TopToolbar/TopToolbar";
import ToolbarSkeleton from "../Skeletons/ToolbarSkeleton";
import { getToolbarSections } from "@/utils/toolbar/utils";
import { createProcessMenuButton } from "@/utils/toolbar/process-button/utils";
import type { ToolbarProps } from "./types";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { TAB_MODES } from "@/utils/url/constants";

const ToolbarCmp: React.FC<ToolbarProps> = ({ windowId, isFormView = false }) => {
  const [openIframeModal, setOpenIframeModal] = useState(false);
  const [showProcessDefinitionModal, setShowProcessDefinitionModal] = useState(false);
  const [processResponse, setProcessResponse] = useState<ProcessResponse | null>(null);
  const [selectedProcessActionButton, setSelectedProcessActionButton] = useState<ProcessButton | null>(null);
  const [selectedProcessDefinitionButton, setSelectedProcessDefinitionButton] =
    useState<ProcessDefinitionButton | null>(null);

  const [activeModal, setActiveModal] = useState<{
    button: ToolbarButtonMetadata;
    isOpen: boolean;
  } | null>(null);

  const { refetchDatasource } = useDatasourceContext();
  const { tab, parentTab, parentRecord, hasFormChanges } = useTabContext();
  const { saveButtonState } = useToolbarContext();
  const { buttons, processButtons, loading, refetch } = useToolbar(windowId, tab?.id);
  const { graph } = useSelected();
  const { activeWindow, getTabFormState, clearChildrenSelections } = useMultiWindowURL();
  const { executeProcess } = useProcessExecution();
  const { t } = useTranslation();
  const { isSessionSyncLoading, isCopilotInstalled } = useUserContext();
  const selectedParentItems = useSelectedRecords(parentTab as Tab);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const selectedRecord = useSelectedRecord(tab);
  const hasParentTab = !!tab?.parentTabId;
  const parentId = parentRecord?.id?.toString();
  const isTreeNodeView = tab?.tableTree;

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
  } = useToolbarConfig({ windowId, tabId: tab?.id, parentId, isFormView });

  const { handleProcessClick } = useProcessButton(executeProcess, refetch);
  const { formViewRefetch } = useToolbarContext();

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
        setOpenIframeModal(true);
      } else if (ProcessButtonType.PROCESS_DEFINITION in button) {
        setSelectedProcessDefinitionButton(button);
        setShowProcessDefinitionModal(true);
      } else {
        throw new Error("Unknown process type");
      }

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

  const handleCloseProcess = useCallback(() => {
    setOpenIframeModal(false);
    setProcessResponse(null);
    setSelectedProcessActionButton(null);
  }, []);

  const handleCloseProcessDefinitionModal = useCallback(() => {
    setShowProcessDefinitionModal(false);
    setSelectedProcessDefinitionButton(null);
  }, []);

  const processChildTabsInFormView = useCallback(
    (childTabs: (typeof tab)[], windowId: string) => {
      const childTabIdsInFormView: string[] = [];

      for (const childTab of childTabs) {
        const childTabFormState = getTabFormState(windowId, childTab.id);
        const isChildInFormView = childTabFormState?.mode === TAB_MODES.FORM && !!childTabFormState?.recordId;

        if (isChildInFormView) {
          childTabIdsInFormView.push(childTab.id);
        }
      }

      return childTabIdsInFormView;
    },
    [getTabFormState]
  );

  const handleCompleteRefresh = useCallback(async () => {
    const childTabs = graph.getChildren(tab);
    const childTabIdsInFormView: string[] = [];

    const hasChildTabs = childTabs && childTabs.length > 0;
    const windowId = activeWindow?.windowId;

    if (hasChildTabs && windowId) {
      childTabIdsInFormView.push(...processChildTabsInFormView(childTabs, windowId));
    }

    if (isFormView && formViewRefetch) {
      await formViewRefetch();
    } else {
      refetchDatasource(tab.id);
    }

    if (hasChildTabs) {
      for (const childTab of childTabs) {
        refetchDatasource(childTab.id);
      }
    }

    Metadata.clearToolbarCache();
    await refetch();

    if (childTabIdsInFormView.length > 0 && windowId) {
      clearChildrenSelections(windowId, childTabIdsInFormView);
    }
  }, [
    graph,
    refetch,
    refetchDatasource,
    tab,
    isFormView,
    formViewRefetch,
    activeWindow,
    processChildTabsInFormView,
    clearChildrenSelections,
  ]);

  const handleCloseSearch = useCallback(() => setSearchOpen(false), [setSearchOpen]);

  const handleCloseStatusModal = useCallback(() => setActiveModal(null), []);

  const toolbarConfig = useMemo(() => {
    const hasSelectedRecord = !!selectedRecord?.id;
    const hasParentRecordSelected = !hasParentTab || selectedParentItems.length === 1;

    const baseConfig = getToolbarSections({
      buttons: buttons as ToolbarButtonMetadata[],
      onAction: handleAction,
      isFormView: isFormView,
      isTreeNodeView: isTreeNodeView,
      hasFormChanges: hasFormChanges,
      hasSelectedRecord: hasSelectedRecord,
      hasParentRecordSelected: hasParentRecordSelected,
      isCopilotInstalled: isCopilotInstalled,
      saveButtonState: saveButtonState,
    });

    const config = {
      ...baseConfig,
      isItemSelected: hasSelectedRecord,
      processButton:
        processButtons.length > 0
          ? createProcessMenuButton(
              processButtons.length,
              hasSelectedRecord,
              handleMenuToggle,
              t,
              anchorEl,
              isSessionSyncLoading
            )
          : undefined,
    };

    return config;
  }, [
    buttons,
    isTreeNodeView,
    isFormView,
    selectedRecord?.id,
    processButtons.length,
    t,
    handleAction,
    handleMenuToggle,
    anchorEl,
    hasParentTab,
    selectedParentItems,
    hasFormChanges,
    saveButtonState,
    isSessionSyncLoading,
    isCopilotInstalled,
  ]);

  if (loading) {
    return <ToolbarSkeleton data-testid="ToolbarSkeleton__a2dd07" />;
  }

  return (
    <>
      <TopToolbar {...toolbarConfig} data-testid="TopToolbar__a2dd07" />
      {activeModal && (
        <StatusModal
          open={activeModal.isOpen}
          statusText={`Modal para: ${activeModal.button.name}`}
          statusType="info"
          saveLabel="Cerrar"
          onClose={handleCloseStatusModal}
          data-testid="StatusModal__a2dd07"
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
          data-testid="StatusModal__a2dd07"
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
          data-testid="ConfirmModal__a2dd07"
        />
      )}
      {processButtons.length > 0 && (
        <ProcessMenu
          anchorEl={anchorEl}
          onClose={handleMenuClose}
          processButtons={processButtons}
          onProcessClick={handleProcessMenuClick}
          selectedRecord={selectedRecord}
          data-testid="ProcessMenu__a2dd07"
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
          data-testid="SearchPortal__a2dd07"
        />
      )}
      <ProcessIframeModal
        isOpen={openIframeModal}
        onClose={handleCloseProcess}
        url={processResponse?.iframeUrl}
        title={selectedProcessActionButton?.name}
        onProcessSuccess={handleCompleteRefresh}
        tabId={tab.id}
        data-testid="ProcessIframeModal__a2dd07"
      />
      <ProcessDefinitionModal
        open={showProcessDefinitionModal}
        onClose={handleCloseProcessDefinitionModal}
        button={selectedProcessDefinitionButton}
        onSuccess={handleCompleteRefresh}
        onError={handleCompleteRefresh}
        data-testid="ProcessDefinitionModal__a2dd07"
      />
    </>
  );
};

export const Toolbar = ToolbarCmp;
export default Toolbar;
