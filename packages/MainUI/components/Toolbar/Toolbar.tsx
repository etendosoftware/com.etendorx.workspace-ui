import React, { useCallback, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import TopToolbar from '@workspaceui/componentlibrary/src/components/Table/Toolbar';
import ProcessModal from '@workspaceui/componentlibrary/src/components/ProcessModal';
import { IconSize, ProcessResponse, StandardButton, ToolbarProps, isProcessButton } from './types';
import {
  LEFT_SECTION_BUTTONS,
  CENTER_SECTION_BUTTONS,
  RIGHT_SECTION_BUTTONS,
  StandardButtonId,
} from '../../constants/Toolbar';
import SearchPortal from './SearchPortal';
import { useTranslation } from '../../hooks/useTranslation';
import { useProcessExecution } from '../../hooks/Toolbar/useProcessExecution';
import { createStandardButtonConfig, getStandardButtonStyle } from './buttonConfigs';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { useProcessButton } from '../../hooks/Toolbar/useProcessButton';
import { useToolbarConfig } from '../../hooks/Toolbar/useToolbarConfig';
import { iconMap } from './iconMap';
import { useToolbar } from '../../hooks/Toolbar/useToolbar';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import { ProcessButton } from '@workspaceui/componentlibrary/src/components/ProcessModal/types';

export const Toolbar: React.FC<ToolbarProps> = ({ windowId, tabId }) => {
  const [openModal, setOpenModal] = React.useState(false);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [processResponse, setProcessResponse] = React.useState<ProcessResponse | null>(null);
  const [selectedProcessButton, setSelectedProcessButton] = React.useState<ProcessButton | null>(null);
  const [searchValue, setSearchValue] = useState('');

  const { toolbar, loading, refetch } = useToolbar(windowId, tabId);
  const { selected, tabs } = useMetadataContext();
  const { executeProcess } = useProcessExecution();
  const { t } = useTranslation();
  const { handleAction, searchOpen, setSearchOpen, handleSearch } = useToolbarConfig(windowId, tabId);
  const { handleProcessClick } = useProcessButton(executeProcess, refetch);

  const tab = useMemo(() => tabs.find(tab => tab.id === tabId), [tabs, tabId]);
  const selectedRecord = tab ? selected[tab.level] : undefined;

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      handleSearch(value);
    },
    [handleSearch],
  );

  const handleConfirm = useCallback(async () => {
    if (!selectedProcessButton || !selectedRecord?.id) return;

    setIsExecuting(true);
    try {
      const response = await handleProcessClick(selectedProcessButton, selectedRecord?.id);
      if (response) {
        setProcessResponse(response);
      } else {
        setProcessResponse(null);
      }
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
  }, [handleProcessClick, selectedProcessButton, selectedRecord?.id]);

  const handleClose = useCallback(() => {
    setOpenModal(false);
    setSelectedProcessButton(null);
    setProcessResponse(null);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={64}>
        {t('common.loading')}
      </Box>
    );
  }

  const createToolbarConfig = () => {
    const buttons = toolbar?.response?.buttons || [];

    const createProcessButtonConfig = (btn: ProcessButton) => {
      const config = {
        key: btn.id,
        icon: React.createElement(iconMap.process),
        tooltip: btn.name,
        iconText: btn.name,
        height: IconSize,
        width: IconSize,
        sx: {
          color: theme.palette.baselineColor.neutral[100],
          background: theme.palette.specificColor.warning.main,
          opacity: selectedRecord ? 1 : 0.5,
          cursor: selectedRecord ? 'pointer' : 'not-allowed',
        },
        onClick: () => {
          if (selectedRecord) {
            setSelectedProcessButton(btn);
            setOpenModal(true);
          }
        },
      };

      return {
        ...config,
      };
    };

    const sections = {
      leftSection: LEFT_SECTION_BUTTONS,
      centerSection: CENTER_SECTION_BUTTONS,
      rightSection: RIGHT_SECTION_BUTTONS,
    };

    const createSectionConfig = (sectionButtons: StandardButtonId[], includeProcess = false) => ({
      buttons: buttons
        .filter((btn: StandardButton) => {
          if (includeProcess && isProcessButton(btn)) return true;
          return sectionButtons.includes(btn.id as StandardButtonId);
        })
        .map(btn => {
          if (isProcessButton(btn)) {
            return createProcessButtonConfig(btn);
          }
          const config = createStandardButtonConfig(btn as StandardButton, handleAction);
          const style = getStandardButtonStyle(btn.id as StandardButtonId);

          if (style) {
            config.sx = style;
          }
          return config;
        }),
      style: getSectionStyle(sectionButtons),
    });

    return {
      leftSection: createSectionConfig(sections.leftSection),
      centerSection: createSectionConfig(sections.centerSection),
      rightSection: createSectionConfig(sections.rightSection, true),
      isItemSelected: !!selectedRecord?.id,
    };
  };

  return (
    <>
      <TopToolbar {...createToolbarConfig()} />
      {searchOpen && (
        <SearchPortal
          isOpen={searchOpen}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          onClose={() => setSearchOpen(false)}
          placeholder={t('table.placeholders.search')}
          autoCompleteTexts={[]}
        />
      )}
      {selectedProcessButton && (
        <ProcessModal
          open={openModal}
          onClose={handleClose}
          button={selectedProcessButton}
          onConfirm={handleConfirm}
          isExecuting={isExecuting}
          processResponse={processResponse}
          confirmationMessage={t('process.confirmationMessage')}
          cancelButtonText={t('common.cancel')}
          executeButtonText={t('common.execute')}
        />
      )}
    </>
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
