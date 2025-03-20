import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BUTTON_IDS } from '../../constants/Toolbar';
import { useSearch } from '../../contexts/searchContext';
import { useMetadataContext } from '../useMetadataContext';
import { useDeleteRecord } from '../useDeleteRecord';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { logger } from '@/utils/logger';
import { useTranslation } from '../useTranslation';
import { useStatusModal } from './useStatusModal';

export const useToolbarConfig = ({
  windowId,
  tabId,
  onSave,
  parentId,
}: {
  windowId?: string;
  tabId?: string;
  onSave?: () => void;
  parentId?: string | null;
  isFormView?: boolean;
}) => {
  const router = useRouter();
  const { setSearchQuery } = useSearch();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { setShowTabContainer, tabs, selected, clearSelections, refetch } = useMetadataContext();
  const {
    statusModal,
    confirmAction,
    showSuccessModal,
    showErrorModal,
    showConfirmModal,
    handleConfirm,
    handleCancelConfirm,
    hideStatusModal,
  } = useStatusModal();
  const { t } = useTranslation();

  const [isDeleting, setIsDeleting] = useState(false);

  const tab = useMemo<Tab | undefined>(() => {
    return tabs.find(tab => tab.id === tabId);
  }, [tabs, tabId]);

  const selectedRecord = tab ? selected[tab.level] : undefined;

  const { deleteRecord, loading: deleteLoading } = useDeleteRecord({
    tab: tab as Tab,
    onSuccess: () => {
      const recordName = selectedRecord?._identifier || selectedRecord?.id;
      const entityType = tab?.title || '';

      if (typeof refetch === 'function') {
        try {
          logger.debug('Executing immediate refetch after deletion');
          refetch();
        } catch (error) {
          logger.error('Error in immediate refetch:', error);
        }
      }

      clearSelections(tabId || '');

      const successMessage = `${entityType} '${recordName}' ${t('status.deleteSuccess')}`;

      showSuccessModal(successMessage, {
        saveLabel: t('common.close'),
        secondaryButtonLabel: t('modal.secondaryButtonLabel'),
        onAfterClose: () => {
          setIsDeleting(false);
        },
      });
    },
    onError: error => {
      logger.error('Error deleting record:', error);

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

  const handleAction = useCallback(
    (action: string) => {
      if (isDeleting) return;

      switch (action) {
        case BUTTON_IDS.NEW:
          router.push(`/window/${windowId}/${tabId}/NewRecord?parentId=${parentId ?? null}`);
          break;
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
          if (tab && selectedRecord) {
            const recordName = selectedRecord._identifier || selectedRecord.id;

            showConfirmModal({
              confirmText: `${t('status.deleteConfirmation')}${recordName}?`,
              onConfirm: () => {
                setIsDeleting(true);
                deleteRecord(selectedRecord);
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
          break;
        default:
          logger.debug(`Action not implemented: ${action}`);
      }
    },
    [
      isDeleting,
      deleteRecord,
      onSave,
      parentId,
      router,
      selectedRecord,
      setShowTabContainer,
      showConfirmModal,
      showErrorModal,
      t,
      tab,
      tabId,
      windowId,
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
