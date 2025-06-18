import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useTabContext } from "@/contexts/tab";
import { logger } from "@/utils/logger";
import type { Tab } from "@workspaceui/etendohookbinder/src/api/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearch } from "../../contexts/searchContext";
import { useDeleteRecord } from "../useDeleteRecord";
import { useMetadataContext } from "../useMetadataContext";
import { useTranslation } from "../useTranslation";
import { useStatusModal } from "./useStatusModal";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { useSelected } from "@/hooks/useSelected";

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
  const { activeWindow, getSelectedRecord } = useMultiWindowURL();
  const { graph } = useSelected();

  // ✅ OBTENER DATOS DESDE URL EN LUGAR DE HOOKS ANTIGUOS
  const selectedRecordId = useMemo(() => {
    if (!activeWindow?.windowId || !tab) return null;
    return getSelectedRecord(activeWindow.windowId, tab.id);
  }, [activeWindow?.windowId, tab, getSelectedRecord]);

  // ✅ OBTENER REGISTRO ACTUAL DESDE GRAPH (para compatibilidad con delete)
  const selectedRecord = useMemo(() => {
    if (!selectedRecordId || !tab) return null;

    // Intentar obtener del graph primero
    const graphRecord = graph.getSelected(tab);
    if (graphRecord) return graphRecord;

    // Fallback: crear objeto mínimo con ID
    return { id: selectedRecordId };
  }, [selectedRecordId, tab, graph]);

  // ✅ OBTENER REGISTROS MÚLTIPLES DESDE GRAPH
  const selectedMultiple = useMemo(() => {
    if (!tab) return [];
    return graph.getSelectedMultiple(tab) || [];
  }, [tab, graph]);

  const selectedIds = useMemo(() => {
    // Si hay selección múltiple, usar esa
    if (selectedMultiple.length > 0) {
      return selectedMultiple.map((r) => String(r.id));
    }

    // Si hay una selección única, usar esa
    if (selectedRecordId) {
      return [selectedRecordId];
    }

    return [];
  }, [selectedMultiple, selectedRecordId]);

  console.log(`[useToolbarConfig ${tabId}] Selection state:`, {
    selectedRecordId,
    selectedMultipleCount: selectedMultiple.length,
    selectedIds,
    hasRecord: !!selectedRecord,
  });

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

          // ✅ LIMPIAR SELECCIÓN DESPUÉS DE DELETE
          if (activeWindow?.windowId && tab) {
            // Limpiar tanto URL como graph
            const { clearSelectedRecord } = useMultiWindowURL();
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
        console.log(`[useToolbarConfig ${tabId}] CANCEL action triggered`);
        onBack?.();
      },
      NEW: () => {
        console.log(`[useToolbarConfig ${tabId}] NEW action triggered`);
        onNew?.();
      },
      FIND: () => {
        console.log(`[useToolbarConfig ${tabId}] FIND action triggered`);
        setSearchOpen(true);
      },
      TAB_CONTROL: () => {
        logger.info("Tab control clicked");
      },
      FILTER: () => {
        console.log(`[useToolbarConfig ${tabId}] FILTER action triggered`);
        onFilter?.();
      },
      SAVE: () => {
        console.log(`[useToolbarConfig ${tabId}] SAVE action triggered`);
        onSave?.();
      },
      DELETE: () => {
        console.log(`[useToolbarConfig ${tabId}] DELETE action triggered`, {
          selectedIdsCount: selectedIds.length,
          selectedIds,
        });

        if (tab) {
          if (selectedIds.length > 0) {
            // ✅ CREAR OBJETOS DE REGISTRO PARA DELETE
            const recordsToDelete = selectedIds.map((id) => {
              // Intentar obtener del graph o crear objeto mínimo
              const existingRecord = selectedMultiple.find((r) => String(r.id) === id);
              return existingRecord || { id };
            });

            const confirmText =
              selectedIds.length === 1
                ? `${t("status.deleteConfirmation")} ${String(selectedRecord?._identifier || selectedRecord?.id)}?`
                : `${t("status.multipleDeleteConfirmation")} ${selectedIds.length}`;

            showConfirmModal({
              confirmText,
              onConfirm: () => {
                console.log(`[useToolbarConfig ${tabId}] Confirming delete for:`, recordsToDelete);
                setIsDeleting(true);
                deleteRecord(selectedIds.length === 1 ? recordsToDelete[0] : recordsToDelete);
              },
              saveLabel: t("common.confirm"),
              secondaryButtonLabel: t("common.cancel"),
            });
          } else {
            console.log(`[useToolbarConfig ${tabId}] No records selected for delete`);
            showErrorModal(t("status.selectRecordError"), {
              saveLabel: t("common.close"),
              secondaryButtonLabel: t("modal.secondaryButtonLabel"),
            });
          }
        }
      },
      REFRESH: () => {
        console.log(`[useToolbarConfig ${tabId}] REFRESH action triggered`);
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
      selectedRecord,
      selectedMultiple,
      showConfirmModal,
      showErrorModal,
      t,
      tab,
      tabId,
    ]
  );

  const handleAction = useCallback(
    (action: string) => {
      if (isDeleting) {
        console.log(`[useToolbarConfig ${tabId}] Ignoring action ${action} - currently deleting`);
        return;
      }

      console.log(`[useToolbarConfig ${tabId}] Handling action: ${action}`);
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
      console.log(`[useToolbarConfig ${tabId}] Search query: ${query}`);
      setSearchValue(query);
      setSearchQuery(query);
    },
    [setSearchQuery, tabId]
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
      // ✅ EXPONER DATOS DE SELECCIÓN PARA DEBUGGING
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
