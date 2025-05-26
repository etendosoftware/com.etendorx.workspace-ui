import React, { useCallback, useMemo, useState } from 'react';
import TopToolbar from '@workspaceui/componentlibrary/src/components/Table/Toolbar';
import { ToolbarProps } from './types';
import SearchPortal from './SearchPortal';
import { useTranslation } from '../../hooks/useTranslation';
import { useProcessExecution } from '../../hooks/Toolbar/useProcessExecution';
import { useProcessButton } from '../../hooks/Toolbar/useProcessButton';
import { useToolbarConfig } from '../../hooks/Toolbar/useToolbarConfig';
import { useToolbar } from '../../hooks/Toolbar/useToolbar';
import ProcessMenu from './ProcessMenu';
import StatusModal from '@workspaceui/componentlibrary/src/components/StatusModal';
import ConfirmModal from '@workspaceui/componentlibrary/src/components/StatusModal/ConfirmModal';
import { ProcessButton, ProcessButtonType, ProcessDefinitionButton, ProcessResponse } from '../ProcessModal/types';
import ProcessModal from '../ProcessModal';
import { useDatasourceContext } from '@/contexts/datasourceContext';
import ProcessDefinitionModal from '../ProcessModal/ProcessDefinitionModal';
import { useUserContext } from '@/hooks/useUserContext';
import { useTabContext } from '@/contexts/tab';
import { compileExpression } from '../Form/FormView/selectors/BaseSelector';
import { useSelected, useSelectedRecord, useSelectedRecords } from '@/contexts/selected';
import useFormFields from '@/hooks/useFormFields';
import {
  organizeButtonsBySection,
  createButtonByType,
  createProcessMenuButton,
  getButtonStyles,
  ToolbarButtonMetadata,
} from './buttonConfigs';

const BaseSection = { display: 'flex', alignItems: 'center', gap: '0.25rem' };

const ToolbarCmp: React.FC<ToolbarProps> = ({ windowId, tabId, isFormView = false }) => {
  const [openModal, setOpenModal] = useState(false);
  const [showProcessDefinitionModal, setShowProcessDefinitionModal] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [processResponse, setProcessResponse] = useState<ProcessResponse | null>(null);
  const [selectedProcessActionButton, setSelectedProcessActionButton] = useState<ProcessButton | null>(null);
  const [selectedProcessDefinitionButton, setSelectedProcessDefinitionButton] =
    useState<ProcessDefinitionButton | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const [activeModal, setActiveModal] = useState<{
    button: ToolbarButtonMetadata;
    isOpen: boolean;
  } | null>(null);

  const [activeDropdown, setActiveDropdown] = useState<{
    button: ToolbarButtonMetadata;
    anchorEl: HTMLElement;
  } | null>(null);

  const { session } = useUserContext();
  const { toolbar, loading, refetch } = useToolbar(windowId, tabId);
  const { graph } = useSelected();
  const { executeProcess } = useProcessExecution();
  const { t } = useTranslation();
  const { refetchDatasource } = useDatasourceContext();
  const { tab, parentRecord } = useTabContext();

  const buttons: ToolbarButtonMetadata[] = toolbar?.response.data ?? [];
  const selectedRecord = useSelectedRecord(tab);
  const parentId = parentRecord?.id?.toString();

  const {
    handleAction,
    searchOpen,
    setSearchOpen,
    handleSearch,
    searchValue,
    setSearchValue,
    statusModal,
    confirmAction,
    handleConfirm,
    handleCancelConfirm,
    hideStatusModal,
  } = useToolbarConfig({ windowId, tabId, parentId, isFormView });

  const { handleProcessClick } = useProcessButton(executeProcess, refetch);
  const selectedItems = useSelectedRecords(tab);
  const {
    fields: { actionFields },
  } = useFormFields(tab);

  const processButtons = useMemo(() => {
    const buttons = Object.values(actionFields) || [];
    return buttons.filter(button => {
      if (!button.displayLogicExpression || !selectedItems) return true;

      const compiledExpr = compileExpression(button.displayLogicExpression);
      try {
        return selectedItems.some(record => compiledExpr(session, record));
      } catch {
        return true;
      }
    });
  }, [actionFields, selectedItems, session]);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleProcessMenuClick = useCallback(
    (button: ProcessButton) => {
      if (!selectedRecord) return;

      if (ProcessButtonType.PROCESS_ACTION in button) {
        setSelectedProcessActionButton(button);
      } else if (ProcessButtonType.PROCESS_DEFINITION in button) {
        setSelectedProcessDefinitionButton(button);
        setShowProcessDefinitionModal(true);
      } else {
        throw new Error('Unknown process type');
      }

      setOpenModal(true);
      handleMenuClose();
    },
    [selectedRecord, handleMenuClose],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      handleSearch(value);
    },
    [handleSearch, setSearchValue],
  );

  const handleProcessSuccess = useCallback(() => {
    refetchDatasource(tab.id);
    graph.clearSelected(tab);
  }, [graph, refetchDatasource, tab]);

  const handleConfirmProcess = useCallback(async () => {
    if (!selectedProcessActionButton || !selectedRecord?.id) return;

    setIsExecuting(true);
    try {
      const response = await handleProcessClick(selectedProcessActionButton, String(selectedRecord.id));
      setProcessResponse(response || null);
    } catch (error) {
      setProcessResponse({
        responseActions: [
          {
            showMsgInProcessView: {
              msgType: 'error',
              msgTitle: 'Error',
              msgText: error instanceof Error ? error.message : 'Unknown error',
            },
          },
        ],
      });
    } finally {
      setIsExecuting(false);
    }
  }, [handleProcessClick, selectedProcessActionButton, selectedRecord?.id]);

  const handleCloseProcess = useCallback(() => {
    setOpenModal(false);
    setProcessResponse(null);
    setSelectedProcessActionButton(null);
  }, []);

  const handleCloseProcessDefinitionModal = useCallback(() => {
    setShowProcessDefinitionModal(false);
    setSelectedProcessDefinitionButton(null);
  }, []);

  const handleCompleteRefresh = useCallback(async () => {
    graph.clearSelected(tab);
    refetchDatasource(tab.id);
  }, [graph, refetchDatasource, tab]);

  const toolbarConfig = useMemo(() => {
    const organizedButtons = organizeButtonsBySection(buttons, isFormView);
    const hasSelectedRecord = !!selectedRecord?.id;

    const createSectionButtons = (sectionButtons: ToolbarButtonMetadata[]) =>
      sectionButtons.map(button => {
        const config = createButtonByType(button, handleAction, isFormView, hasSelectedRecord);

        const styles = getButtonStyles(button);
        if (styles) {
          config.sx = { ...config.sx, ...styles };
        }

        return config;
      });

    const config = {
      leftSection: {
        buttons: createSectionButtons(organizedButtons.left),
        style: BaseSection,
      },
      centerSection: {
        buttons: createSectionButtons(organizedButtons.center),
        style: BaseSection,
      },
      rightSection: {
        buttons: createSectionButtons(organizedButtons.right),
        style: BaseSection,
      },
      isItemSelected: hasSelectedRecord,
    };

    if (processButtons.length > 0) {
      config.rightSection.buttons.push(
        createProcessMenuButton(processButtons.length, hasSelectedRecord, handleMenuOpen, t),
      );
    }

    return config;
  }, [buttons, isFormView, selectedRecord?.id, handleAction, processButtons.length, handleMenuOpen, t]);

  if (loading) return null;

  return (
    <>
      <TopToolbar {...toolbarConfig} />
      {activeModal && (
        <StatusModal
          open={activeModal.isOpen}
          statusText={`Modal para: ${activeModal.button.name}`}
          statusType="info"
          saveLabel="Cerrar"
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeDropdown && (
        <ProcessMenu
          anchorEl={activeDropdown.anchorEl}
          open={Boolean(activeDropdown.anchorEl)}
          onClose={() => setActiveDropdown(null)}
          processButtons={activeDropdown.button.dropdownConfig?.items || []}
          onProcessClick={() => {
            console.log('Dropdown item clicked');
            setActiveDropdown(null);
          }}
          selectedRecord={selectedRecord}
        />
      )}
      {statusModal.open && (
        <StatusModal
          open={statusModal.open}
          statusText={statusModal.statusText}
          statusType={statusModal.statusType}
          errorMessage={statusModal.errorMessage}
          saveLabel={statusModal.saveLabel || t('common.close')}
          secondaryButtonLabel={statusModal.secondaryButtonLabel}
          onClose={hideStatusModal}
        />
      )}
      {confirmAction && (
        <ConfirmModal
          open={!!confirmAction}
          confirmText={confirmAction.confirmText}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
          saveLabel={confirmAction.saveLabel || t('common.confirm')}
          secondaryButtonLabel={confirmAction.secondaryButtonLabel || t('common.cancel')}
        />
      )}
      {processButtons.length > 0 && (
        <ProcessMenu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          processButtons={processButtons}
          onProcessClick={handleProcessMenuClick}
          selectedRecord={selectedRecord}
        />
      )}
      {searchOpen && !isFormView && (
        <SearchPortal
          isOpen={searchOpen}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          onClose={() => setSearchOpen(false)}
          placeholder={t('table.placeholders.search')}
          autoCompleteTexts={[]}
        />
      )}
      {selectedProcessActionButton && (
        <ProcessModal
          open={openModal}
          onClose={handleCloseProcess}
          button={selectedProcessActionButton}
          onConfirm={handleConfirmProcess}
          isExecuting={isExecuting}
          processResponse={processResponse}
          confirmationMessage={t('process.confirmationMessage')}
          cancelButtonText={t('common.cancel')}
          executeButtonText={t('common.execute')}
          onProcessSuccess={handleProcessSuccess}
          tabId={tab.id}
        />
      )}
      <ProcessDefinitionModal
        open={showProcessDefinitionModal}
        onClose={handleCloseProcessDefinitionModal}
        button={selectedProcessDefinitionButton}
        onSuccess={handleCompleteRefresh}
        onError={handleCompleteRefresh}
      />
    </>
  );
};

export const Toolbar = ToolbarCmp;
export default Toolbar;
