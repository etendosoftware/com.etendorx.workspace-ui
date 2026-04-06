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
import ConfirmModal from "@workspaceui/componentlibrary/src/components/StatusModal/ConfirmModal";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import SaveViewMenu from "./Menus/SaveViewMenu";
import SearchPortal from "./SearchPortal";
import TopToolbar from "./TopToolbar/TopToolbar";
import ToolbarSkeleton from "../Skeletons/ToolbarSkeleton";
import { getToolbarSections } from "@/utils/toolbar/utils";
import { createProcessMenuButton } from "@/utils/toolbar/process-button/utils";
import type { ToolbarProps } from "./types";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { TAB_MODES } from "@/utils/url/constants";
import { useWindowContext } from "@/contexts/window";
import ActionModal from "@workspaceui/componentlibrary/src/components/ActionModal";
import { PROCESS_TYPES } from "@/utils/processes/definition/constants";
import { useTableStatePersistenceTab } from "@/hooks/useTableStatePersistenceTab";

const ToolbarCmp: React.FC<ToolbarProps> = ({ windowId, isFormView = false }) => {
  const [openIframeModal, setOpenIframeModal] = useState(false);
  const [showProcessDefinitionModal, setShowProcessDefinitionModal] = useState(false);
  const [processResponse, setProcessResponse] = useState<ProcessResponse | null>(null);
  const [selectedProcessActionButton, setSelectedProcessActionButton] = useState<ProcessButton | null>(null);
  const [selectedProcessDefinitionButton, setSelectedProcessDefinitionButton] =
    useState<ProcessDefinitionButton | null>(null);

  const { refetchDatasource } = useDatasourceContext();
  const { tab, parentTab, parentRecord, hasFormChanges } = useTabContext();
  const { buttons, processButtons, loading, refetch: refetchToolbar } = useToolbar(windowId, tab?.id);
  const { saveButtonState, isImplicitFilterApplied, isAdvancedFilterApplied } = useToolbarContext();
  const { graph } = useSelected();
  const {
    activeWindow,
    getTabFormState,
    clearChildrenSelections,
    setTableFilters,
    setTableVisibility,
    setTableSorting,
    setTableOrder,
  } = useWindowContext();
  const { executeProcess } = useProcessExecution();
  const { t } = useTranslation();
  const { isSessionSyncLoading, isCopilotInstalled, session } = useUserContext();
  const selectedParentItems = useSelectedRecords(parentTab as Tab);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [saveViewAnchorEl, setSaveViewAnchorEl] = useState<HTMLElement | null>(null);
  const [isProcessRefreshing, setIsProcessRefreshing] = useState(false);

  const selectedRecord = useSelectedRecord(tab);
  const selectedRecords = useSelectedRecords(tab) || [];
  const hasParentTab = !!tab?.parentTabId;

  // Table state for Save View feature — reads current grid state to persist
  const windowIdentifier = activeWindow?.windowIdentifier ?? "";
  const { tableColumnFilters, tableColumnVisibility, tableColumnSorting, tableColumnOrder } =
    useTableStatePersistenceTab({
      windowIdentifier,
      tabId: tab?.id ?? "",
    });
  const parentId = parentRecord?.id?.toString();
  const isTreeNodeView = tab?.tableTree ? true : undefined;

  const {
    handleAction,
    searchOpen,
    setSearchOpen,
    handleSearch,
    searchValue,
    setSearchValue,
    confirmAction,
    handleConfirm,
    handleCancelConfirm,
    actionModal,
    closeActionModal,
  } = useToolbarConfig({ windowId, tabId: tab?.id, parentId, isFormView });

  const { handleProcessClick } = useProcessButton(executeProcess, refetchToolbar);
  const { formViewRefetch } = useToolbarContext();

  // State for temporary filter tooltip
  const [showFilterTooltip, setShowFilterTooltip] = useState(false);
  const [showShareLinkTooltip, setShowShareLinkTooltip] = useState(false);

  // Check if any child tab is fully expanded
  const isChildTabExpanded = useMemo(() => {
    if (!activeWindow || !tab?.id) return false;
    const navigationState = activeWindow.navigation;
    // If we are in a parent tab (level 0) and there is an active tab in level 1, it means a child is expanded/visible
    return navigationState.activeLevels.includes(1) && navigationState.activeTabsByLevel.has(1);
  }, [activeWindow, tab?.id]);

  // Manage temporary filter tooltip visibility
  useEffect(() => {
    // Do not show tooltip if a child tab is expanded/visible
    if (isChildTabExpanded) {
      setShowFilterTooltip(false);
      return;
    }

    if (isImplicitFilterApplied) {
      setShowFilterTooltip(true);
      const timer = setTimeout(() => {
        setShowFilterTooltip(false);
      }, 3000);
      return () => clearTimeout(timer);
    }

    setShowFilterTooltip(false);
  }, [isImplicitFilterApplied, isChildTabExpanded]);

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

  const handleSaveViewMenuToggle = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!saveViewAnchorEl) {
        setSaveViewAnchorEl(event.currentTarget);
      } else {
        setSaveViewAnchorEl(null);
      }
    },
    [saveViewAnchorEl]
  );

  const handleSaveViewMenuClose = useCallback(() => {
    setSaveViewAnchorEl(null);
  }, []);

  const handleApplyView = useCallback(
    (state: {
      filters: typeof tableColumnFilters;
      visibility: typeof tableColumnVisibility;
      sorting: typeof tableColumnSorting;
      order: typeof tableColumnOrder;
    }) => {
      if (!activeWindow?.windowIdentifier || !tab?.id) return;
      const wi = activeWindow.windowIdentifier;
      const ti = tab.id;
      setTableFilters(wi, ti, state.filters);
      setTableVisibility(wi, ti, state.visibility);
      setTableSorting(wi, ti, state.sorting);
      setTableOrder(wi, ti, state.order);
    },
    [activeWindow?.windowIdentifier, tab?.id, setTableFilters, setTableVisibility, setTableSorting, setTableOrder]
  );

  const handleProcessMenuClick = useCallback(
    async (button: ProcessButton) => {
      const record = selectedRecord || selectedRecords[0];
      if (!record) return;

      if (ProcessButtonType.PROCESS_ACTION in button) {
        const response = await handleProcessClick(button, String(record.id));
        setProcessResponse(response);
        setSelectedProcessActionButton(button);
        if (response.showInIframe) {
          setOpenIframeModal(true);
        } else if (response.responseActions?.[0]?.showMsgInProcessView) {
          // If there's an error and not an iframe, show it in actionModal or similar.
          // For now, logging it clearly, as the previous logic just hung infinitely.
          console.error("Process error:", response.responseActions[0].showMsgInProcessView);
        }
      } else if (ProcessButtonType.PROCESS_DEFINITION in button) {
        setSelectedProcessDefinitionButton(button);
        setShowProcessDefinitionModal(true);
      } else {
        throw new Error("Unknown process type");
      }

      handleMenuClose();
    },
    [handleMenuClose, handleProcessClick, selectedRecord, selectedRecords]
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
    (childTabs: (typeof tab)[], windowIdentifier: string) => {
      const childTabIdsInFormView: string[] = [];

      for (const childTab of childTabs) {
        const childTabFormState = getTabFormState(windowIdentifier, childTab.id);
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
    setIsProcessRefreshing(true);
    try {
      const childTabs = graph.getChildren(tab);
      const childTabIdsInFormView: string[] = [];
      const hasChildTabs = childTabs && childTabs.length > 0;
      const windowIdentifier = activeWindow?.windowIdentifier;

      if (hasChildTabs && windowIdentifier) {
        childTabIdsInFormView.push(...processChildTabsInFormView(childTabs, windowIdentifier));
      }

      if (isFormView && formViewRefetch) {
        await formViewRefetch();
      } else {
        await refetchDatasource(tab.id);
      }

      if (hasChildTabs) {
        await Promise.all(childTabs.map((childTab) => refetchDatasource(childTab.id)));
      }

      Metadata.clearToolbarCache();
      await refetchToolbar();

      if (childTabIdsInFormView.length > 0 && windowIdentifier) {
        clearChildrenSelections(windowIdentifier, childTabIdsInFormView);
      }
    } finally {
      setIsProcessRefreshing(false);
    }
  }, [
    graph,
    refetchToolbar,
    refetchDatasource,
    tab,
    isFormView,
    formViewRefetch,
    activeWindow,
    processChildTabsInFormView,
    clearChildrenSelections,
  ]);

  const handleCloseSearch = useCallback(() => setSearchOpen(false), [setSearchOpen]);

  const handleActionWithTooltip = useCallback(
    (action: string, button: ToolbarButtonMetadata, event?: React.MouseEvent<HTMLElement>) => {
      if (action === "SHARE_LINK") {
        setShowShareLinkTooltip(true);
        setTimeout(() => {
          setShowShareLinkTooltip(false);
        }, 2000);
      }
      handleAction(action, button, event);
    },
    [handleAction]
  );

  const toolbarConfig = useMemo(() => {
    const hasSelectedRecord = !!selectedRecord?.id;
    const selectedRecordsLength = selectedRecords.length;
    const hasParentRecordSelected = !hasParentTab || selectedParentItems.length === 1;

    const baseConfig = getToolbarSections({
      buttons: buttons as ToolbarButtonMetadata[],
      onAction: handleActionWithTooltip,
      isFormView: isFormView,
      isTreeNodeView: isTreeNodeView,
      hasFormChanges: hasFormChanges,
      hasParentRecordSelected: hasParentRecordSelected,
      isCopilotInstalled: isCopilotInstalled,
      saveButtonState: saveButtonState,
      session: session,
      isImplicitFilterApplied: isImplicitFilterApplied,
      showFilterTooltip: showFilterTooltip,
      showShareLinkTooltip: showShareLinkTooltip,
      tab: tab,
      selectedRecordsLength: selectedRecordsLength,
      t: t,
      isAdvancedFilterApplied: isAdvancedFilterApplied,
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
              isSessionSyncLoading || isProcessRefreshing
            )
          : undefined,
    };

    return config;
  }, [
    buttons,
    tab,
    isTreeNodeView,
    isFormView,
    selectedRecord?.id,
    selectedRecords,
    processButtons.length,
    t,
    handleActionWithTooltip,
    handleMenuToggle,
    anchorEl,
    hasParentTab,
    selectedParentItems,
    hasFormChanges,
    saveButtonState,
    isSessionSyncLoading,
    isCopilotInstalled,
    session,
    isImplicitFilterApplied,
    showFilterTooltip,
    showShareLinkTooltip,
    isAdvancedFilterApplied,
    isProcessRefreshing,
  ]);

  if (loading) {
    return <ToolbarSkeleton data-testid="ToolbarSkeleton__a2dd07" />;
  }

  return (
    <>
      <div className="relative flex items-center gap-1">
        <div className="flex-1">
          <TopToolbar {...toolbarConfig} data-testid="TopToolbar__a2dd07" />
        </div>
        {!isFormView && tab?.id && (
          <button
            type="button"
            className="h-8 w-8 flex items-center justify-center rounded-full bg-[var(--color-baseline-0)] border border-[var(--color-transparent-neutral-20)] hover:border-none hover:bg-[var(--color-dynamic-main)] hover:text-[var(--color-baseline-0)] transition-colors shrink-0"
            title={t("table.tooltips.views")}
            onClick={handleSaveViewMenuToggle}
            data-testid="SaveViewMenu__trigger">
            <span className="text-xs leading-none" aria-label={t("table.tooltips.views")}>
              ≡
            </span>
          </button>
        )}
      </div>
      {!isFormView && tab?.id && (
        <SaveViewMenu
          anchorEl={saveViewAnchorEl}
          onClose={handleSaveViewMenuClose}
          tabId={tab.id}
          currentFilters={tableColumnFilters}
          currentVisibility={tableColumnVisibility}
          currentSorting={tableColumnSorting}
          currentOrder={tableColumnOrder}
          onApplyView={handleApplyView}
          data-testid="SaveViewMenu__a2dd07"
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
          hasSelection={!!(selectedRecord || selectedRecords.length > 0)}
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
        type={PROCESS_TYPES.PROCESS_DEFINITION}
        open={showProcessDefinitionModal}
        onClose={handleCloseProcessDefinitionModal}
        button={selectedProcessDefinitionButton}
        onSuccess={handleCompleteRefresh}
        onError={handleCompleteRefresh}
        data-testid="ProcessDefinitionModal__a2dd07"
      />
      {actionModal.isOpen && (
        <ActionModal
          isOpen={actionModal.isOpen}
          title={actionModal.title}
          message={actionModal.message}
          buttons={actionModal.buttons}
          onClose={closeActionModal}
          isLoading={actionModal.isLoading}
          t={t}
          data-testid="ActionModal__a2dd07"
        />
      )}
    </>
  );
};

export const Toolbar = ToolbarCmp;
export default Toolbar;
