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

export const useToolbarConfig = ({
  tabId,
}: {
  windowId?: string;
  tabId?: string;
  parentId?: string | null;
  isFormView?: boolean;
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
  const { onRefresh, onSave, onNew, onBack, onFilter } = useToolbarContext();

  const [isDeleting, setIsDeleting] = useState(false);

  const { tab } = useTabContext();
  const { activeWindow, getSelectedRecord, clearSelectedRecord } = useMultiWindowURL();
  const { graph } = useSelected();

  const selectedMultiple = useSelectedRecords(tab);
  const selectedRecord = useSelectedRecord(tab);

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
    onError: (error) => {
      logger.warn("Error deleting record(s):", error);

      showErrorModal(t("status.deleteError"), {
        errorMessage: error,
        saveLabel: t("common.close"),
        secondaryButtonLabel: t("modal.secondaryButtonLabel"),
        onAfterClose: () => {
          setIsDeleting(false);
        },
      });
    },
  });

  useEffect(() => {
    if (!statusModal.open && isDeleting) {
      setIsDeleting(false);
    }
  }, [statusModal.open, isDeleting]);

  const actionHandlers = useMemo<Record<string, () => void>>(
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
        onSave?.();
      },
      DELETE: () => {
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
              onConfirm: () => {
                setIsDeleting(true);
                deleteRecord(
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
      },
      REFRESH: () => {
        onRefresh?.();
      },
    }),
    [
      deleteRecord,
      onBack,
      onFilter,
      onNew,
      onRefresh,
      onSave,
      selectedIds,
      selectedMultiple,
      showConfirmModal,
      showErrorModal,
      t,
      tab,
    ]
  );

  const handleAction = useCallback(
    (action: string) => {
      if (isDeleting) {
        return;
      }

      const handler = actionHandlers[action];
      if (handler) {
        handler();
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
