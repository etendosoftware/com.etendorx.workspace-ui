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
import { useTabContext } from "@/contexts/tab";
import { logger } from "@/utils/logger";
import type { Tab, EntityData } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearch } from "../../contexts/searchContext";
import { useDeleteRecord } from "../useDeleteRecord";
import { useMetadataContext } from "../useMetadataContext";
import { useTranslation } from "../useTranslation";
import { useStatusModal } from "./useStatusModal";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { useSelected } from "@/hooks/useSelected";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";
import { useSelectedRecord } from "@/hooks/useSelectedRecord";
import { useRecordContext } from "@/hooks/useRecordContext";
import type { ToolbarButtonMetadata } from "./types";

export const useToolbarConfig = ({
  tabId,
  isFormView,
}: {
  tabId: string;
  isFormView: boolean;
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
  const { onRefresh, onSave, onNew, onBack, onFilter, onColumnFilters, onToggleTreeView } = useToolbarContext();

  const [isDeleting, setIsDeleting] = useState(false);

  const { tab } = useTabContext();
  const { activeWindow, getSelectedRecord, clearSelectedRecord } = useMultiWindowURL();
  const { graph } = useSelected();

  const selectedMultiple = useSelectedRecords(tab);
  const selectedRecord = useSelectedRecord(tab);
  const { contextString, hasSelectedRecords, contextItems } = useRecordContext();

  const selectedRecordId = useMemo(() => {
    if (!activeWindow?.windowId || !tab) return null;
    return getSelectedRecord(activeWindow.windowId, tab.id);
  }, [activeWindow?.windowId, tab, getSelectedRecord]);

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

          if (activeWindow?.windowId && tab) {
            clearSelectedRecord(activeWindow.windowId, tab.id);
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

  const handleDeleteRecord = useCallback(async () => {
    if (tab) {
      if (selectedIds.length > 0) {
        let recordsToDelete: EntityData[] | EntityData;

        if (selectedMultiple.length > 0) {
          recordsToDelete = selectedMultiple;
        } else {
          recordsToDelete = selectedIds.map((id) => ({ id }) as EntityData);
        }
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
  }, [tab, selectedIds, selectedMultiple, showConfirmModal, t, deleteRecord, showErrorModal]);

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
        onSave?.(true);
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
    }),
    [
      onBack,
      onNew,
      onFilter,
      onSave,
      tab,
      selectedIds,
      selectedMultiple,
      showConfirmModal,
      t,
      deleteRecord,
      showErrorModal,
      onRefresh,
      hasSelectedRecords,
      contextString,
      contextItems,
      onColumnFilters,
      onToggleTreeView,
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
    ]
  );
};
