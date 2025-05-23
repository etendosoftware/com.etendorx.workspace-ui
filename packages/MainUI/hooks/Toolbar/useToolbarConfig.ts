import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ToolbarButtonMetadata } from '@/components/Toolbar/buttonConfigs';

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
  const { onRefresh, onSave, onNew, onBack, onFilter } = useToolbarContext();

  const [isDeleting, setIsDeleting] = useState(false);

  const { tab, record } = useTabContext();
  const selectedRecord = record;
  const selectedMultiple = graph.getSelectedMultiple(tab);
  const selectedIds = useMemo(() => selectedMultiple?.map(r => String(r.id)) ?? [], [selectedMultiple]);

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

  const actionHandlers = useMemo(
    () => ({
      CANCEL: () => onBack?.(),
      NEW: () => {
        const params = new URLSearchParams(location.search);
        params.set('recordId_' + tab?.id, 'new');
        history.pushState(null, '', `?${params.toString()}`);
        onNew?.();
      },
      FIND: () => setSearchOpen(true),
      TAB_CONTROL: () => {
        logger.info('Tab control clicked');
      },
      FILTER: () => onFilter?.(),
      SAVE: () => onSave?.(),
      DELETE: () => {
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
    ],
  );

  const handleAction = useCallback(
    (action: string, button?: ToolbarButtonMetadata) => {
      if (isDeleting) return;

      const handler = actionHandlers[action];
      if (handler) {
        handler();
        return;
      }
      if (button) {
        switch (button.buttonType) {
          case 'MODAL':
            logger.info(`Opening modal for: ${button.name}`);
            break;
          case 'DROPDOWN':
            logger.info(`Opening dropdown for: ${button.name}`);
            break;
          case 'TOGGLE':
            logger.info(`Toggling: ${button.name}`);
            break;
          case 'CUSTOM':
            logger.info(`Custom action for: ${button.name}`);
            break;

          default:
            logger.warn(`Action not implemented: ${action} for button type: ${button.buttonType}`);
        }
      } else {
        logger.warn(`Action not implemented: ${action}`);
      }
    },
    [actionHandlers, isDeleting],
  );

  const handleButtonAction = useCallback(
    (action: string, button: ToolbarButtonMetadata, event?: React.MouseEvent<HTMLElement>) => {
      logger.debug('Dynamic button action:', { action, button: button.name, buttonType: button.buttonType });

      if (action in actionHandlers) {
        handleAction(action, button);
        return;
      }

      switch (action) {
        case 'OPEN_MODAL':
          logger.info(`Opening modal for button: ${button.name}`);
          break;

        case 'OPEN_DROPDOWN':
          logger.info(`Opening dropdown for button: ${button.name}`, button.dropdownConfig);
          break;

        case 'TOGGLE':
          logger.info(`Toggling button: ${button.name}`);
          break;

        case 'CUSTOM_ACTION':
          logger.info(`Custom action for button: ${button.name}`);
          handleAction(button.action, button);
          break;

        default:
          // Fallback a acción normal
          handleAction(action, button);
      }
    },
    [actionHandlers, handleAction],
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
      handleButtonAction,
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
      handleButtonAction,
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
    ],
  );
};
