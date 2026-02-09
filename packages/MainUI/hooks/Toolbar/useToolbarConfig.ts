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

import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useUserContext } from "@/hooks/useUserContext";
import { useTabContext } from "@/contexts/tab";
import { logger } from "@/utils/logger";
import type { Tab, EntityData } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearch } from "../../contexts/searchContext";
import { useDeleteRecord } from "../useDeleteRecord";
import { useMetadataContext } from "../useMetadataContext";
import { useTranslation } from "../useTranslation";
import { useStatusModal } from "./useStatusModal";
import { useSelected } from "@/hooks/useSelected";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";
import { useSelectedRecord } from "@/hooks/useSelectedRecord";
import { useRecordContext } from "@/hooks/useRecordContext";
import type { ToolbarButtonMetadata } from "./types";
import { TOOLBAR_BUTTONS_ACTIONS } from "@/utils/toolbar/constants";
import { useWindowContext } from "@/contexts/window";
import type { ActionButton, ActionModalProps } from "@workspaceui/componentlibrary/src/components/ActionModal/types";
import { isEmptyArray } from "@/utils/commons";
import { getNewTabFormState } from "@/utils/window/utils";
import { copyRecordRequest, handleCopyRecordResponse } from "@/utils/processes/toolbar/utils";
import { FORM_MODES, TAB_MODES } from "@/utils/url/constants";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";

export const useToolbarConfig = ({
  tabId,
  isFormView,
  windowIdentifier,
  windowId = undefined,
}: {
  tabId: string;
  isFormView: boolean;
  windowIdentifier: string;
  windowId?: string;
  parentId?: string | null;
}) => {
  const { setSearchQuery } = useSearch();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { removeRecord } = useMetadataContext();
  const {
    statusModal,
    confirmAction,
    showDeleteSuccessModal,
    showErrorModal,
    showConfirmModal,
    handleConfirm,
    handleCancelConfirm,
    hideStatusModal,
  } = useStatusModal();
  const { t } = useTranslation();
  const {
    onRefresh,
    onSave,
    onNew,
    onBack,
    onFilter,
    onColumnFilters,
    onToggleTreeView,
    attachmentAction,
    onExportCSV,
    onPrintRecord,
    onAdvancedFilters,
  } = useToolbarContext();

  const [isDeleting, setIsDeleting] = useState(false);

  const [actionModal, setActionModal] = useState<Omit<ActionModalProps, "onClose"> & { isOpen: boolean }>({
    isOpen: false,
    title: "",
    message: "",
    buttons: [],
    t,
  });

  const { token } = useUserContext();

  const [resultModal, setResultModal] = useState<{
    open: boolean;
    success: boolean;
    message?: string;
    title?: string;
  }>({
    open: false,
    success: false,
  });

  const closeResultModal = useCallback(() => {
    setResultModal((prev) => ({ ...prev, open: false }));
  }, []);

  const closeActionModal = useCallback(() => {
    setActionModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const { tab } = useTabContext();
  const { clearSelectedRecord, getSelectedRecord, setSelectedRecord, setTabFormState } = useWindowContext();
  const { graph } = useSelected();

  const selectedMultiple = useSelectedRecords(tab);
  const selectedRecord = useSelectedRecord(tab);
  const { contextString, hasSelectedRecords, contextItems } = useRecordContext();
  const { triggerParentRefreshes } = useTabRefreshContext();

  const selectedRecordId = useMemo(() => {
    if (!windowIdentifier || !tab) return null;
    return getSelectedRecord(windowIdentifier, tab.id);
  }, [windowIdentifier, tab, getSelectedRecord]);

  const selectedIds = useMemo(() => {
    if (selectedMultiple.length > 0) {
      return selectedMultiple.map((r) => String(r.id));
    }

    if (selectedRecordId) {
      return [selectedRecordId];
    }

    return [];
  }, [selectedMultiple, selectedRecordId]);

  const { deleteRecord, loading: deleteLoading } = useDeleteRecord({
    tab: tab as Tab,
    onSuccess: (deletedCount) => {
      if (!tabId) return;

      let recordName = "";
      if (selectedMultiple.length > 1) {
        recordName = `${selectedMultiple.length} ${t("common.records")}`;
      } else if (selectedMultiple.length === 1) {
        const record = selectedMultiple[0];
        recordName = String(record._identifier || record.id || `${t("common.record")}`);
      } else if (selectedRecord) {
        recordName = String(selectedRecord._identifier || selectedRecord.id || `${t("common.records")}`);
      } else {
        recordName = `${deletedCount} ${t("common.records")}`;
      }

      const entityType = tab?.title || "";

      for (const recordId of selectedIds) {
        removeRecord(tabId, recordId);
      }

      const successMessage = `${entityType} '${recordName}' ${t("status.deleteSuccess")}`;

      showDeleteSuccessModal(successMessage, {
        saveLabel: t("common.close"),
        onAfterClose: () => {
          setIsDeleting(false);

          if (windowIdentifier && tab) {
            clearSelectedRecord(windowIdentifier, tab.id);
            graph.clearSelected(tab);
            graph.clearSelectedMultiple(tab);
          }
        },
      });
    },
    onError: ({ errorMessage, needToRefresh = false }) => {
      logger.warn("Error deleting record(s):", errorMessage);

      showErrorModal(t("status.deleteError"), {
        errorMessage: errorMessage,
        saveLabel: t("common.close"),
        secondaryButtonLabel: t("modal.secondaryButtonLabel"),
        onAfterClose: () => {
          setIsDeleting(false);
        },
      });
      if (needToRefresh) {
        onRefresh?.();
      }
    },
    isFormView,
  });

  const getRecordsToDelete = useCallback((): EntityData[] | EntityData | [] => {
    if (selectedMultiple.length > 0) {
      return selectedMultiple;
    }

    return selectedIds.map((id) => ({ id }) as EntityData);
  }, [selectedIds, selectedMultiple]);

  const handleDeleteRecord = useCallback(async () => {
    if (tab) {
      if (selectedIds.length > 0) {
        const recordsToDelete: EntityData[] | EntityData = getRecordsToDelete();

        let confirmText: string;
        if (selectedIds.length === 1) {
          const recordToDelete = Array.isArray(recordsToDelete) ? recordsToDelete[0] : recordsToDelete;
          const identifier = String(recordToDelete._identifier || recordToDelete.id);
          confirmText = `${t("status.deleteConfirmation")} ${identifier}?`;
        } else {
          confirmText = `${t("status.multipleDeleteConfirmation")} ${selectedIds.length} ${t("common.records")}?`;
        }

        showConfirmModal({
          confirmText,
          onConfirm: async () => {
            setIsDeleting(true);
            await deleteRecord(
              selectedIds.length === 1 && Array.isArray(recordsToDelete) ? recordsToDelete[0] : recordsToDelete
            );
          },
          saveLabel: t("common.confirm"),
          secondaryButtonLabel: t("common.cancel"),
        });
      } else {
        showErrorModal(t("status.selectRecordError"), {
          saveLabel: t("common.close"),
          secondaryButtonLabel: t("modal.secondaryButtonLabel"),
        });
      }
    }
  }, [tab, selectedIds, getRecordsToDelete, showConfirmModal, t, deleteRecord, showErrorModal]);

  const onShareLink = useCallback(async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      logger.info("Sharable link copied to clipboard");
    } catch (error) {
      logger.error("Error copying URL to clipboard:", error);
    }
  }, []);
  const handleCopyRecord = useCallback(() => {
    if (!tab || !windowIdentifier || isEmptyArray(selectedIds)) return;

    const isComplexClone = tab.obuiappCloneChildren;
    const title = t("common.confirm");
    const message = t("modal.cloneConfirmation");

    const handleRequest = async (cloneWithChildren: boolean) => {
      setActionModal((prev) => ({ ...prev, isLoading: true }));

      const { ok, data } = await copyRecordRequest(tab, selectedIds, windowId || "", cloneWithChildren);

      setActionModal((prev) => ({ ...prev, isLoading: false, isOpen: false }));
      onRefresh?.();

      handleCopyRecordResponse({
        ok,
        data,
        onError: () => {
          showErrorModal(t("status.copyError"), {
            saveLabel: t("common.close"),
            secondaryButtonLabel: t("modal.secondaryButtonLabel"),
          });
        },
        onRefreshParent: () => {
          triggerParentRefreshes(tab.tabLevel);
        },
        onSingleRecord: (newRecordId) => {
          const formMode = FORM_MODES.EDIT;
          const newTabFormState = getNewTabFormState(newRecordId, TAB_MODES.FORM, formMode);
          setSelectedRecord(windowIdentifier, tabId, newRecordId);
          setTabFormState(windowIdentifier, tabId, newTabFormState);
        },
        onMultipleRecords: () => {
          clearSelectedRecord(windowIdentifier, tabId);
        },
      });
    };

    const buttons: ActionButton[] = [];

    if (isComplexClone) {
      buttons.push(
        {
          id: "clone",
          label: t("common.clone"),
          onClick: () => handleRequest(false),
          variant: "primary",
        },
        {
          id: "cloneWithChildren",
          label: t("common.cloneWithChildren"),
          onClick: () => handleRequest(true),
          variant: "primary",
        },
        {
          id: "cancel",
          label: t("common.cancel"),
          onClick: closeActionModal,
          variant: "secondary",
        }
      );
    } else {
      buttons.push(
        {
          id: "true",
          label: t("common.trueText"),
          onClick: () => handleRequest(true),
          variant: "primary",
        },
        {
          id: "false",
          label: t("common.falseText"),
          onClick: closeActionModal,
          variant: "secondary",
        }
      );
    }

    setActionModal({
      isOpen: true,
      title,
      message,
      buttons,
      t,
    });
  }, [
    tab,
    selectedIds,
    windowIdentifier,
    t,
    closeActionModal,
    showErrorModal,
    onRefresh,
    setSelectedRecord,
    setTabFormState,
    triggerParentRefreshes,
    clearSelectedRecord,
    tabId,
  ]);

  useEffect(() => {
    if (!statusModal.open && isDeleting) {
      setIsDeleting(false);
    }
  }, [statusModal.open, isDeleting]);

  const actionHandlers = useMemo<Record<string, (event?: React.MouseEvent<HTMLElement>) => void>>(
    () => ({
      CANCEL: () => {
        onBack?.();
      },
      NEW: () => {
        onNew?.();
      },
      FIND: () => {
        setSearchOpen(true);
      },
      TAB_CONTROL: () => {
        logger.info("Tab control clicked");
      },
      FILTER: () => {
        onFilter?.();
      },
      SAVE: () => {
        onSave?.({ showModal: true });
      },
      DELETE: () => {
        handleDeleteRecord();
      },
      REFRESH: () => {
        onRefresh?.();
      },
      COPILOT: () => {
        const customEvent = new CustomEvent("openCopilotWithContext", {
          detail: {
            contextString: hasSelectedRecords ? contextString : null,
            contextItems: hasSelectedRecords ? contextItems : [],
            hasContext: hasSelectedRecords,
          },
        });
        window.dispatchEvent(customEvent);
      },
      COLUMN_FILTERS: (event?: React.MouseEvent<HTMLElement>) => {
        const buttonElement = event?.currentTarget as HTMLElement;
        onColumnFilters?.(buttonElement);
      },
      TOGGLE_TREE_VIEW: () => {
        onToggleTreeView?.();
      },
      ATTACHMENT: () => {
        if (attachmentAction) {
          attachmentAction();
        } else {
          logger.info("Attachment button clicked - no action registered");
        }
      },
      EXPORT_CSV: async () => {
        await onExportCSV?.();
      },
      SHARE_LINK: () => {
        onShareLink();
      },
      [TOOLBAR_BUTTONS_ACTIONS.COPY_RECORD]: () => {
        handleCopyRecord();
      },
      [TOOLBAR_BUTTONS_ACTIONS.PRINT_RECORD]: async () => {
        await onPrintRecord?.();
      },
      [TOOLBAR_BUTTONS_ACTIONS.ADVANCED_FILTERS]: (event?: React.MouseEvent<HTMLElement>) => {
        onAdvancedFilters?.(event?.currentTarget);
      },
      INITIALIZE_RX_SERVICES: async () => {
        try {
          const baseUrl = "/api/erp/org.openbravo.client.kernel";
          const queryParams = new URLSearchParams();
          queryParams.set("_action", "com.etendoerp.etendorx.actionhandler.InitializeRXServices");

          const apiUrl = `${baseUrl}?${queryParams.toString()}`;

          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json;charset=UTF-8",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Execution failed");
          }

          const result = await response.json();

          const { severity, text, refreshGrid } = result.severity ? result : result.message || result;

          const isSuccess = severity === "success";

          let finalMessage = text;
          if (finalMessage?.includes("Process completed successfully<br/>")) {
            finalMessage = finalMessage.replace("Process completed successfully<br/>", "");
          }

          if (isSuccess && refreshGrid) {
            finalMessage += `<br/>${t("process.refreshGrid") || "Refresh the grid to see the changes."}`;
          }

          setResultModal({
            open: true,
            success: isSuccess,
            message: finalMessage,
          });

          if (isSuccess && refreshGrid) {
            onRefresh?.();
          }
        } catch (error) {
          logger.error("Error initializing RX services:", error);
          setResultModal({
            open: true,
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      },
    }),
    [
      onBack,
      onNew,
      onFilter,
      onSave,
      t,
      onRefresh,
      hasSelectedRecords,
      contextString,
      contextItems,
      onColumnFilters,
      onToggleTreeView,
      handleDeleteRecord,
      attachmentAction,
      onExportCSV,
      onShareLink,
      handleCopyRecord,
      onPrintRecord,
      onAdvancedFilters,
      token,
    ]
  );

  const handleAction = useCallback(
    (action: string, _button?: ToolbarButtonMetadata, event?: React.MouseEvent<HTMLElement>) => {
      if (isDeleting) {
        return;
      }

      const handler = actionHandlers[action];
      if (handler) {
        handler(event);
        return;
      }

      console.warn(`[useToolbarConfig ${tabId}] No handler found for action: ${action}`);
    },
    [actionHandlers, isDeleting, tabId]
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchValue(query);
      setSearchQuery(query);
    },
    [setSearchQuery]
  );

  return useMemo(
    () => ({
      handleAction,
      searchOpen,
      setSearchOpen,
      handleSearch,
      searchValue,
      setSearchValue,
      deleteLoading,
      statusModal,
      confirmAction,
      handleConfirm,
      handleCancelConfirm,
      hideStatusModal,
      isDeleting,
      actionHandlers,
      selectedRecord,
      selectedMultiple,
      selectedIds,
      selectedRecordId,
      actionModal,
      closeActionModal,
      resultModal,
      closeResultModal,
    }),
    [
      handleAction,
      handleSearch,
      searchOpen,
      searchValue,
      deleteLoading,
      statusModal,
      confirmAction,
      handleConfirm,
      handleCancelConfirm,
      hideStatusModal,
      isDeleting,
      actionHandlers,
      selectedRecord,
      selectedMultiple,
      selectedIds,
      selectedRecordId,
      actionModal,
      closeActionModal,
      resultModal,
      closeResultModal,
    ]
  );
};
