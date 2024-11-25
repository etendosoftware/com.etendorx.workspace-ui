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
import SettingsIcon from '@workspaceui/componentlibrary/src/assets/icons/settings.svg';
import TopToolbar from '@workspaceui/componentlibrary/src/components/Table/Toolbar';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import {
  IconName,
  IconSize,
  ToolbarResponse,
  ToolbarProps,
  isProcessButton,
  StandardButton,
  ProcessButton,
  StandardButtonConfig,
} from './types';
import { useRouter } from 'next/navigation';
import {
  LEFT_SECTION_BUTTONS,
  BUTTON_IDS,
  CENTER_SECTION_BUTTONS,
  RIGHT_SECTION_BUTTONS,
  StandardButtonId,
} from '../../constants/Toolbar';
import { useTranslation } from '../../hooks/useTranslation';
import GenericProcessButton from './ProcessButton';

const iconMap = {
  plus: PlusIcon,
  save: SaveIcon,
  trash: TrashIcon,
  'refresh-cw': RefreshIcon,
  search: SearchIcon,
  grid: GridIcon,
  download: DownloadIcon,
  paperclip: PaperclipIcon,
  process: SettingsIcon,
} as const satisfies Record<IconName, React.FC<unknown>>;

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

    const createStandardButtonConfig = (btn: StandardButton) =>
      ({
        key: btn.id,
        icon: React.createElement(iconMap[btn.icon]),
        tooltip: btn.name,
        onClick: () => handleAction(btn.action),
        disabled: !btn.enabled,
        height: IconSize,
        width: IconSize,
        fill: theme.palette.baselineColor.neutral[0],
      } as StandardButtonConfig);

    const createProcessButtonConfig = (btn: ProcessButton) => ({
      key: btn.id,
      icon: React.createElement(SettingsIcon),
      tooltip: btn.name,
      onClick: () => {
        console.log('Executing process:', btn.processId);
      },
      height: IconSize,
      width: IconSize,
      sx: { background: theme.palette.specificColor.warning.main },
      customComponent: (
        <GenericProcessButton
          button={btn}
          onExecute={() => {
            console.log('Executing process:', btn.processId);
          }}
        />
      ),
    });

    const standardButtonStyle = (btnId: string) => {
      if (btnId === BUTTON_IDS.NEW) {
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
      if (btnId === BUTTON_IDS.SAVE) {
        return {
          background: theme.palette.baselineColor.neutral[100],
          marginLeft: '0.2rem',
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[30]}`,
        };
      }
      if (btnId === BUTTON_IDS.REFRESH) {
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
    };

    return {
      leftSection: {
        buttons: buttons
          .filter(btn => LEFT_SECTION_BUTTONS.includes(btn.id as StandardButtonId))
          .map(btn => {
            const config = createStandardButtonConfig(btn as StandardButton);
            const style = standardButtonStyle(btn.id);
            if (style) {
              config.sx = style;
            }
            if (btn.id === BUTTON_IDS.NEW) {
              config.iconText = btn.name;
            }
            return config;
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
          .filter(btn => CENTER_SECTION_BUTTONS.includes(btn.id as StandardButtonId))
          .map(btn => createStandardButtonConfig(btn as StandardButton)),
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
          .filter(btn => {
            if (isProcessButton(btn)) return true;
            return RIGHT_SECTION_BUTTONS.includes(btn.id as StandardButtonId);
          })
          .map(btn => {
            if (isProcessButton(btn)) {
              return createProcessButtonConfig(btn);
            }
            return createStandardButtonConfig(btn as StandardButton);
          }),
        style: {
          display: 'flex',
          gap: '0.25rem',
          background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
          borderRadius: '10rem',
          padding: '0.25rem',
        },
      },
      isItemSelected: false,
    };
  };

  return <TopToolbar {...createToolbarConfig()} />;
};
