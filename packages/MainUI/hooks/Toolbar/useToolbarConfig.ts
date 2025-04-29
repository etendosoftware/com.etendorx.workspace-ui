import { useCallback, useEffect, useMemo, useState } from 'react';
import { BUTTON_IDS } from '../../constants/Toolbar';
import { useSearch } from '../../contexts/searchContext';
import { useMetadataContext } from '../useMetadataContext';
import { useDeleteRecord } from '../useDeleteRecord';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { logger } from '@/utils/logger';
import { useTranslation } from '../useTranslation';
import { useStatusModal } from './useStatusModal';
import { useSearchParams } from 'next/navigation';
import { useToolbarContext } from '@/contexts/ToolbarContext';

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
  const { setShowTabContainer, tabs, selected, removeRecord, getSelectedIds } = useMetadataContext();
  const searchParams = useSearchParams();
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

  const tab = useMemo<Tab | undefined>(() => {
    return tabs.find(tab => tab.id === tabId);
  }, [tabs, tabId]);

  const selectedRecord = tab ? selected[tab.level] : undefined;
  const selectedIds = useMemo(() => (tab ? getSelectedIds(tab.id) : []), [getSelectedIds, tab]);

  const { deleteRecord, loading: deleteLoading } = useDeleteRecord({
    tab: tab as Tab,
    onSuccess: deletedCount => {
      if (!tabId) return;

      const recordName = selectedRecord?._identifier || selectedRecord?.id || `${deletedCount} registros`;
      const entityType = tab?.title || '';

      selectedIds.forEach(recordId => {
        removeRecord(tabId, recordId);
      });

      const successMessage = `${entityType} '${recordName}' ${t('status.deleteSuccess')}`;

      showDeleteSuccessModal(successMessage, {
        saveLabel: t('common.close'),
        onAfterClose: () => {
          setIsDeleting(false);
        },
      });
    },
    onError: error => {
      logger.error('Error deleting record(s):', error);

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
          const params = new URLSearchParams(searchParams.toString());
          params.set('recordId_' + tab?.id, 'new');
          history.pushState(null, '', `?${params.toString()}`);
          onNew?.();
          break;
        }
        case BUTTON_IDS.FIND:
          setSearchOpen(true);
          break;
        case BUTTON_IDS.TAB_CONTROL:
          setShowTabContainer(prevState => !prevState);
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
                  ? `${t('status.deleteConfirmation')} ${selectedRecord?._identifier || selectedRecord?.id}?`
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
      isDeleting,
      setShowTabContainer,
      onNew,
      onSave,
      tab,
      onRefresh,
      searchParams,
      selectedIds,
      t,
      selectedRecord?._identifier,
      selectedRecord?.id,
      showConfirmModal,
      deleteRecord,
      showErrorModal,
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
      setShowTabContainer,
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
      setShowTabContainer,
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
