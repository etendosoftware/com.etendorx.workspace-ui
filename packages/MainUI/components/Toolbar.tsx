import React from 'react';
import { Box } from '@mui/material';
import { useToolbar } from '@workspaceui/etendohookbinder/src/hooks/useToolbar';
import PlusIcon from '@workspaceui/componentlibrary/src/assets/icons/plus.svg';
import SaveIcon from '@workspaceui/componentlibrary/src/assets/icons/save.svg';
import SearchIcon from '@workspaceui/componentlibrary/src/assets/icons/search.svg';
import RefreshIcon from '@workspaceui/componentlibrary/src/assets/icons/refresh-cw.svg';
import TrashIcon from '@workspaceui/componentlibrary/src/assets/icons/trash-2.svg';
import GridIcon from '@workspaceui/componentlibrary/src/assets/icons/grid.svg';
import DownloadIcon from '@workspaceui/componentlibrary/src/assets/icons/download.svg';
import PaperclipIcon from '@workspaceui/componentlibrary/src/assets/icons/paperclip.svg';
import TopToolbar from '@workspaceui/componentlibrary/src/components/Table/Toolbar';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { IconName, IconSize, ToolbarResponse, ToolbarProps, ButtonConfig } from './types';
import { useRouter } from 'next/navigation';
import {
  LEFT_SECTION_BUTTONS,
  BUTTON_IDS,
  CENTER_SECTION_BUTTONS,
  RIGHT_SECTION_BUTTONS,
  ButtonId,
} from '../constants/Toolbar';
import { useTranslation } from '../hooks/useTranslation';

const iconMap: Record<IconName, React.FC<unknown>> = {
  plus: PlusIcon,
  save: SaveIcon,
  trash: TrashIcon,
  'refresh-cw': RefreshIcon,
  search: SearchIcon,
  grid: GridIcon,
  download: DownloadIcon,
  paperclip: PaperclipIcon,
};

export const Toolbar: React.FC<ToolbarProps> = ({ windowId, tabId }) => {
  const { toolbar, loading } = useToolbar(windowId, tabId);
  const router = useRouter();

  const handleAction = (action: string) => {
    if (action === BUTTON_IDS.NEW) {
      router.push(`/window/${windowId}/${tabId}/NewRecord`);
    }
  };

  const { t } = useTranslation();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={64}>
        {t('common.loading')}
      </Box>
    );
  }

  const createToolbarConfig = () => {
    const buttons = (toolbar as ToolbarResponse)?.response?.buttons || [];

    return {
      leftSection: {
        buttons: buttons
          .filter(btn => LEFT_SECTION_BUTTONS.includes(btn.id as ButtonId))
          .map(btn => {
            const buttonConfig: ButtonConfig = {
              key: btn.id,
              icon: React.createElement(iconMap[btn.icon]),
              tooltip: btn.name,
              onClick: () => handleAction(btn.action),
              disabled: !btn.enabled,
              height: IconSize,
              width: IconSize,
              fill: theme.palette.baselineColor.neutral[0],
            };

            if (btn.id === BUTTON_IDS.NEW) {
              buttonConfig.iconText = btn.name;
            }

            buttonConfig['sx'] = (() => {
              if (btn.id === BUTTON_IDS.NEW) {
                return {
                  padding: '0.75rem',
                  maxHeight: '2rem',
                  background: theme.palette.baselineColor.neutral[100],
                  borderRadius: '6.25rem 0 0 6.25rem',
                  color: theme.palette.baselineColor.neutral[0],
                  '&:hover': {
                    background: theme.palette.dynamicColor.main,
                  },
                };
              }
              if (btn.id === BUTTON_IDS.SAVE) {
                return {
                  background: theme.palette.baselineColor.neutral[100],
                  marginLeft: '0.2rem',
                  border: `1px solid ${theme.palette.baselineColor.transparentNeutral[30]}`,
                };
              }
              if (btn.id === BUTTON_IDS.REFRESH) {
                return {
                  padding: '0.75rem',
                  maxHeight: '2rem',
                  background: theme.palette.baselineColor.neutral[100],
                  borderRadius: '0 6.25rem 6.25rem 0',
                  color: theme.palette.baselineColor.neutral[0],
                  '&:hover': {
                    background: theme.palette.dynamicColor.main,
                  },
                };
              }
              return undefined;
            })();

            return buttonConfig;
          }),
        style: {
          display: 'flex',
          width: 'auto',
          alignItems: 'center',
          background: `var(--Neutral-0, ${theme.palette.baselineColor.neutral[0]})`,
          borderRadius: '10rem',
          padding: '0.25rem',
          maxHeight: '2.5rem',
          gap: '0.05rem',
        },
      },
      centerSection: {
        buttons: buttons
          .filter(btn => CENTER_SECTION_BUTTONS.includes(btn.id as ButtonId))
          .map(btn => ({
            key: btn.id,
            icon: React.createElement(iconMap[btn.icon]),
            tooltip: btn.name,
            onClick: () => {},
            disabled: !btn.enabled,
            height: IconSize,
            width: IconSize,
          })),
        style: {
          display: 'flex',
          width: '100%',
          background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
          borderRadius: '10rem',
          padding: '.25rem',
          gap: '0.25rem',
        },
      },
      rightSection: {
        buttons: buttons
          .filter(btn => RIGHT_SECTION_BUTTONS.includes(btn.id as ButtonId))
          .map(btn => ({
            key: btn.id,
            icon: React.createElement(iconMap[btn.icon]),
            tooltip: btn.name,
            onClick: () => {},
            disabled: !btn.enabled,
            height: IconSize,
            width: IconSize,
          })),
        style: {
          display: 'flex',
          gap: '0.25rem',
          background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
          borderRadius: '10rem',
          padding: '0.25rem',
        },
      },
    };
  };

  return <TopToolbar isItemSelected={false} {...createToolbarConfig()} />;
};
