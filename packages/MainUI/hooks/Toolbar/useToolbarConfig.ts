import { useCallback, useEffect, useMemo, useState } from 'react';
import { BUTTON_IDS } from '../../constants/Toolbar';
import { useSearch } from '../../contexts/searchContext';
import { useMetadataContext } from '../useMetadataContext';
import { useDeleteRecord } from '../useDeleteRecord';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { logger } from '@/utils/logger';
import { useTranslation } from '../useTranslation';
import { useStatusModal } from './useStatusModal';
import { useToolbarContext } from '@/contexts/ToolbarContext';
import { useTabContext } from '@/contexts/tab';
import { useSelected } from '@/contexts/selected';

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
  const [searchValue, setSearchValue] = useState('');
  const { removeRecord } = useMetadataContext();
  const { graph } = useSelected();
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
  const { onRefresh, onSave, onNew } = useToolbarContext();

  const [isDeleting, setIsDeleting] = useState(false);

  const { tab, record } = useTabContext();
  const selectedRecord = record;
  const selectedIds = useMemo(() => (tab ? graph.getSelectedMultiple(tab.id)?.map(r => String(r.id)) || [] : []), [graph, tab]);

  const { deleteRecord, loading: deleteLoading } = useDeleteRecord({
    tab: tab as Tab,
    onSuccess: deletedCount => {
      if (!tabId) return;

      const recordName = selectedRecord?._identifier || selectedRecord?.id || `${deletedCount} registros`;
      const entityType = tab?.title || '';

      selectedIds.forEach(recordId => {
        removeRecord(tabId, recordId);
      });

      const successMessage = `${entityType} '${String(recordName)}' ${t('status.deleteSuccess')}`;

      showDeleteSuccessModal(successMessage, {
        saveLabel: t('common.close'),
        onAfterClose: () => {
          setIsDeleting(false);
        },
      });
    },
    onError: error => {
      logger.warn('Error deleting record(s):', error);

      showErrorModal(t('status.deleteError'), {
        errorMessage: error,
        saveLabel: t('common.close'),
        secondaryButtonLabel: t('modal.secondaryButtonLabel'),
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

  const handleAction = useCallback(
    (action: string) => {
      if (isDeleting) return;

      switch (action) {
        case BUTTON_IDS.NEW: {
          const params = new URLSearchParams(location.search);
          params.set('recordId_' + tab?.id, 'new');
          history.pushState(null, '', `?${params.toString()}`);
          onNew?.();
          break;
        }
        case BUTTON_IDS.FIND:
          setSearchOpen(true);
          break;
        case BUTTON_IDS.TAB_CONTROL:
          // setShowTabContainer(prevState => !prevState);
          break;
        case BUTTON_IDS.SAVE:
          onSave?.();
          break;
        case BUTTON_IDS.DELETE:
          if (tab) {
            if (selectedIds.length > 0) {
              const recordsToDelete = selectedIds.map(id => tab.records?.[id] || { id });

              const confirmText =
                selectedIds.length === 1
                  ? `${t('status.deleteConfirmation')} ${String(selectedRecord?._identifier || selectedRecord?.id)}?`
                  : `${t('status.multipleDeleteConfirmation')} ${selectedIds.length}`;

              showConfirmModal({
                confirmText,
                onConfirm: () => {
                  setIsDeleting(true);
                  deleteRecord(selectedIds.length === 1 ? recordsToDelete[0] : recordsToDelete);
                },
                saveLabel: t('common.confirm'),
                secondaryButtonLabel: t('common.cancel'),
              });
            } else {
              showErrorModal(t('status.selectRecordError'), {
                saveLabel: t('common.close'),
                secondaryButtonLabel: t('modal.secondaryButtonLabel'),
              });
            }
          }
          break;
        case BUTTON_IDS.REFRESH:
          onRefresh?.();
          break;
        default:
          logger.warn(`Action not implemented: ${action}`);
      }
    },
    [
      deleteRecord,
      isDeleting,
      onNew,
      onRefresh,
      onSave,
      selectedIds,
      selectedRecord?._identifier,
      selectedRecord?.id,
      showConfirmModal,
      showErrorModal,
      t,
      tab,
    ],
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchValue(query);
      setSearchQuery(query);
    },
    [setSearchQuery],
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
    ],
  );
};
