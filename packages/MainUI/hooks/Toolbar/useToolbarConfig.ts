import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useTabContext } from "@/contexts/tab";
import { logger } from "@/utils/logger";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearch } from "../../contexts/searchContext";
import { useDeleteRecord } from "../useDeleteRecord";
import { useMetadataContext } from "../useMetadataContext";
import { useSelectedRecord } from "../useSelectedRecord";
import { useSelectedRecords } from "../useSelectedRecords";
import { useTranslation } from "../useTranslation";
import { useStatusModal } from "./useStatusModal";

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
  const selectedRecord = useSelectedRecord(tab);
  const selectedMultiple = useSelectedRecords(tab);
  const selectedIds = useMemo(() => selectedMultiple?.map((r) => String(r.id)) ?? [], [selectedMultiple]);

  const { deleteRecord, loading: deleteLoading } = useDeleteRecord({
    tab: tab as Tab,
    onSuccess: (deletedCount) => {
      if (!tabId) return;

      const recordName = selectedRecord?._identifier || selectedRecord?.id || `${deletedCount} registros`;
      const entityType = tab?.title || "";

      for (const recordId of selectedIds) {
        removeRecord(tabId, recordId);
      }

      const successMessage = `${entityType} '${String(recordName)}' ${t("status.deleteSuccess")}`;

      showDeleteSuccessModal(successMessage, {
        saveLabel: t("common.close"),
        onAfterClose: () => {
          setIsDeleting(false);
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
      CANCEL: () => onBack?.(),
      NEW: () => onNew?.(),
      FIND: () => setSearchOpen(true),
      TAB_CONTROL: () => {
        logger.info("Tab control clicked");
      },
      FILTER: () => onFilter?.(),
      SAVE: () => onSave?.(),
      DELETE: () => {
        if (tab) {
          if (selectedIds.length > 0) {
            const recordsToDelete = selectedIds.map((id) => tab.records?.[id] || { id });

            const confirmText =
              selectedIds.length === 1
                ? `${t("status.deleteConfirmation")} ${String(selectedRecord?._identifier || selectedRecord?.id)}?`
                : `${t("status.multipleDeleteConfirmation")} ${selectedIds.length}`;

            showConfirmModal({
              confirmText,
              onConfirm: () => {
                setIsDeleting(true);
                deleteRecord(selectedIds.length === 1 ? recordsToDelete[0] : recordsToDelete);
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
      REFRESH: () => onRefresh?.(),
    }),
    [
      deleteRecord,
      onBack,
      onFilter,
      onNew,
      onRefresh,
      onSave,
      selectedIds,
      selectedRecord,
      showConfirmModal,
      showErrorModal,
      t,
      tab,
    ]
  );

  const handleAction = useCallback(
    (action: string) => {
      if (isDeleting) return;

      const handler = actionHandlers[action];
      if (handler) {
        handler();
        return;
      }
    },
    [actionHandlers, isDeleting]
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
    ]
  );
};
