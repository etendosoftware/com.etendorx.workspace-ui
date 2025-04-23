import { useCallback, useMemo, useState, createElement } from 'react';
import { Box } from '@mui/material';
import TopToolbar from '@workspaceui/componentlibrary/src/components/Table/Toolbar';
import {
  IconSize,
  ProcessResponse,
  StandardButton,
  StandardButtonConfig,
  ToolbarProps,
  isProcessButton,
} from './types';
import {
  LEFT_SECTION_BUTTONS,
  CENTER_SECTION_BUTTONS,
  RIGHT_SECTION_BUTTONS,
  StandardButtonId,
  BUTTON_IDS,
} from '../../constants/Toolbar';
import SearchPortal from './SearchPortal';
import { useTranslation } from '../../hooks/useTranslation';
import { useProcessExecution } from '../../hooks/Toolbar/useProcessExecution';
import { createStandardButtonConfig, createTabControlButtonConfig, getStandardButtonStyle } from './buttonConfigs';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { useProcessButton } from '../../hooks/Toolbar/useProcessButton';
import { useToolbarConfig } from '../../hooks/Toolbar/useToolbarConfig';
import { iconMap } from './iconMap';
import { useToolbar } from '../../hooks/Toolbar/useToolbar';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import ProcessMenu from './ProcessMenu';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import StatusModal from '@workspaceui/componentlibrary/src/components/StatusModal';
import ConfirmModal from '@workspaceui/componentlibrary/src/components/StatusModal/ConfirmModal';
import { ProcessButton, ProcessButtonType, ProcessDefinitionButton } from '../ProcessModal/types';
import { ProcessActionModal } from '../ProcessModal';
import { useDatasourceContext } from '@/contexts/datasourceContext';
import ProcessDefinitionModal from '../ProcessModal/ProcessDefinitionModal';
import { useUserContext } from '@/hooks/useUserContext';
import TabContextProvider from '@/contexts/tab';
import { compileExpression } from '../Form/FormView/selectors/BaseSelector';

const ToolbarCmp: React.FC<ToolbarProps> = ({ windowId, tabId, isFormView = false, onSave, onRefresh }) => {
  const [openModal, setOpenModal] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [processResponse, setProcessResponse] = useState<ProcessResponse | null>(null);
  const [selectedProcessActionButton, setSelectedProcessActionButton] = useState<ProcessButton | null>(null);
  const [selectedProcessDefinitionButton, setSelectedProcessDefinitionButton] =
    useState<ProcessDefinitionButton | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { session } = useUserContext();
  const { toolbar, loading, refetch } = useToolbar(windowId, tabId);
  const { selected, tabs, clearSelections } = useMetadataContext();
  const { executeProcess } = useProcessExecution();
  const { t } = useTranslation();
  const { refetchDatasource } = useDatasourceContext();

  const tab = useMemo<Tab>(() => {
    const result = tabs.find(tab => tab.id === tabId);

    if (result) {
      return result;
    }

    throw new Error('Error creating toolbar: Missing tab');
  }, [tabs, tabId]);

  const selectedRecord = tab ? selected[tab.level] : undefined;
  const parentId = useMemo(() => selected[tab?.level - 1]?.id ?? null, [selected, tab?.level]);

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
  } = useToolbarConfig({
    windowId,
    tabId,
    onSave,
    onRefresh,
    parentId,
    isFormView,
  });

  const { handleProcessClick } = useProcessButton(executeProcess, refetch);

  // Filter process buttons based on display logic
  const processButtons = useMemo(() => {
    const buttons = toolbar?.buttons.filter(isProcessButton) || [];
    const selectedItems = Array.isArray(selected[tab.level]) ? selected[tab.level] : [selectedRecord];

    const filteredButtons = buttons.filter(button => {
      if (!button.field.displayLogicExpression) {
        return true;
      }

      const compiledExpr = compileExpression(button.field.displayLogicExpression);

      try {
        const isVisible = selectedItems.some(record => {
          return compiledExpr(session, record);
        });
        return isVisible;
      } catch (error) {
        return true;
      }
    });

    return filteredButtons;
  }, [toolbar?.buttons, selectedRecord, selected, session, tab.level]);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleProcessMenuClick = useCallback(
    (button: ProcessButton) => {
      if (selectedRecord) {
        if (ProcessButtonType.PROCESS_ACTION in button) {
          setSelectedProcessActionButton(button);
        } else if (ProcessButtonType.PROCESS_DEFINITION in button) {
          setSelectedProcessDefinitionButton(button);
        } else {
          throw new Error('Unknown process type');
        }
        setOpenModal(true);
      }
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
    if (processResponse && !processResponse.showDeprecatedFeatureModal && processResponse.success) {
      if (tabId) {
        refetchDatasource(tabId);
        clearSelections(tabId);
      }
    }
  }, [tabId, refetchDatasource, clearSelections, processResponse]);

  const handleConfirmProcess = useCallback(async () => {
    if (!selectedProcessActionButton || !selectedRecord?.id) return;

    setIsExecuting(true);
    try {
      const response = await handleProcessClick(selectedProcessActionButton, selectedRecord?.id);
      if (response) {
        setProcessResponse(response);
      } else {
        setProcessResponse(null);
      }
    } catch (error) {
      setProcessResponse({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
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
    setSelectedProcessActionButton(null);
    setSelectedProcessDefinitionButton(null);
    setProcessResponse(null);
  }, []);

  const toolbarConfig = useMemo(() => {
    const buttons = toolbar?.buttons ?? [];

    const createProcessMenuButton = (): StandardButtonConfig => ({
      key: 'process-menu',
      action: 'MENU',
      name: t('common.processes'),
      icon: createElement(iconMap.process),
      iconText: t('common.processes'),
      tooltip: t('common.processes'),
      height: IconSize,
      width: IconSize,
      enabled: processButtons.length > 0,
      sx: {
        color: theme.palette.baselineColor.neutral[100],
        background: theme.palette.specificColor.warning.main,
        opacity: selectedRecord ? 1 : 0.5,
        cursor: selectedRecord ? 'pointer' : 'not-allowed',
      },
      onClick: (event?: React.MouseEvent<HTMLElement>) => {
        if (selectedRecord && event && processButtons.length > 0) {
          handleMenuOpen(event);
        }
      },
    });

    const sections = {
      leftSection: LEFT_SECTION_BUTTONS,
      centerSection: CENTER_SECTION_BUTTONS,
      rightSection: RIGHT_SECTION_BUTTONS,
    };

    const createSectionConfig = (sectionButtons: StandardButtonId[]) => {
      const sectionConfig = {
        buttons: buttons
          .filter((btn: StandardButton) => {
            if (isFormView && btn.id === 'FIND') return false;
            if (isProcessButton(btn)) return false;
            return sectionButtons.includes(btn.id as StandardButtonId);
          })
          .map(btn => {
            const config = createStandardButtonConfig(btn as StandardButton, handleAction);
            const style = getStandardButtonStyle(btn.id as StandardButtonId);
            if (style) {
              config.sx = style;
            }
            return config;
          }),
        style: getSectionStyle(sectionButtons),
      };

      if (sectionButtons.includes(BUTTON_IDS.TAB_CONTROL) && !buttons.some(btn => btn.id === BUTTON_IDS.TAB_CONTROL)) {
        const tabControlConfig = createTabControlButtonConfig(!!selectedRecord?.id, handleAction);
        sectionConfig.buttons.push(tabControlConfig);
      }

      return sectionConfig;
    };

    const config = {
      leftSection: createSectionConfig(sections.leftSection),
      centerSection: createSectionConfig(sections.centerSection),
      rightSection: createSectionConfig(sections.rightSection),
      isItemSelected: !!selectedRecord?.id,
    };

    if (processButtons.length > 0) {
      config.rightSection.buttons.push(createProcessMenuButton());
    }

    return config;
  }, [handleAction, handleMenuOpen, isFormView, processButtons, selectedRecord, t, toolbar?.buttons]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={64}>
        {t('common.loading')}
      </Box>
    );
  }

  return (
    <TabContextProvider tab={tab}>
      <TopToolbar {...toolbarConfig} />
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
        <ProcessActionModal
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
        />
      )}
      {selectedProcessDefinitionButton && (
        <ProcessDefinitionModal
          open={openModal}
          onClose={handleCloseProcess}
          button={selectedProcessDefinitionButton}
          onSuccess={() => {
            handleCloseProcess();
            if (onRefresh && tab) {
              onRefresh();
            }
          }}
        />
      )}
    </TabContextProvider>
  );
};

const getSectionStyle = (sectionType: string[]) => {
  const baseStyle = {
    display: 'flex',
    borderRadius: '10rem',
    padding: '0.25rem',
    gap: '0.25rem',
  };

  if (sectionType === LEFT_SECTION_BUTTONS) {
    return {
      ...baseStyle,
      width: 'auto',
      alignItems: 'center',
      background: theme.palette.baselineColor.neutral[0],
      maxHeight: '2.5rem',
      gap: '0.05rem',
    };
  }

  if (sectionType === RIGHT_SECTION_BUTTONS) {
    return {
      ...baseStyle,
      background: theme.palette.baselineColor.transparentNeutral[5],
      maxHeight: '2.5rem',
    };
  }

  return {
    ...baseStyle,
    width: sectionType === CENTER_SECTION_BUTTONS ? '100%' : 'auto',
    background: theme.palette.baselineColor.transparentNeutral[5],
  };
};

export const Toolbar = ToolbarCmp;
export default Toolbar;
