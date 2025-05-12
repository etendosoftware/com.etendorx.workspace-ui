import { theme } from '@workspaceui/componentlibrary/src/theme';
import React from 'react';
import { BUTTON_IDS, StandardButtonId } from '../../constants/Toolbar';
import { StandardButton, StandardButtonConfig, IconSize } from './types';
import { iconMap } from './iconMap';
import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';

export const createStandardButtonConfig = (
  btn: StandardButton,
  handleAction: (action: string) => void,
  isFormView?: boolean,
): StandardButtonConfig => {
  const getIconFill = (buttonId: StandardButtonId): string => {
    const specialButtons = [
      BUTTON_IDS.CANCEL,
      BUTTON_IDS.GRID_VIEW,
      BUTTON_IDS.FIND,
      BUTTON_IDS.DELETE,
      BUTTON_IDS.EXPORT,
      BUTTON_IDS.ATTACHMENTS,
    ] as const;
    return specialButtons.includes(buttonId as (typeof specialButtons)[number])
      ? theme.palette.baselineColor.neutral[100]
      : theme.palette.baselineColor.neutral[0];
  };

  const getButtonText = (buttonId: StandardButtonId): string | undefined => {
    const textConfig: Partial<Record<StandardButtonId, boolean>> = {
      [BUTTON_IDS.NEW]: true,
    };

    return textConfig[buttonId] ? btn.name : undefined;
  };

  const config: StandardButtonConfig = {
    key: btn.id,
    icon: React.createElement(iconMap[btn.icon]),
    tooltip: btn.name,
    onClick: () => handleAction(btn.action),
    disabled: (btn.id === BUTTON_IDS.CANCEL && !isFormView) || !btn.enabled,
    height: IconSize,
    width: IconSize,
    fill: getIconFill(btn.id as StandardButtonId),
  };

  const iconText = getButtonText(btn.id as StandardButtonId);
  if (iconText) {
    config.iconText = iconText;
  }

  return config;
};

export const createTabControlButtonConfig = (
  isRecordSelected: boolean,
  handleAction: (action: string) => void,
): StandardButtonConfig => {
  return {
    key: BUTTON_IDS.TAB_CONTROL,
    action: BUTTON_IDS.TAB_CONTROL,
    icon: React.createElement(iconMap.tabControl),
    tooltip: 'Tab Control',
    onClick: () => handleAction(BUTTON_IDS.TAB_CONTROL),
    disabled: !isRecordSelected,
    height: IconSize,
    width: IconSize,
    fill: theme.palette.baselineColor.neutral[100],
    sx: {
      opacity: isRecordSelected ? 1 : 0.5,
      cursor: isRecordSelected ? 'pointer' : 'not-allowed',
    },
  };
};

export const getStandardButtonStyle = (btnId: StandardButtonId) => {
  const styles: Record<StandardButtonId, React.CSSProperties | SxProps<Theme> | undefined> = {
    [BUTTON_IDS.NEW]: {
      padding: '0.75rem',
      maxHeight: '2rem',
      background: theme.palette.baselineColor.neutral[100],
      borderRadius: '6.25rem 0 0 6.25rem',
      color: theme.palette.baselineColor.neutral[0],
      '&:hover': {
        background: theme.palette.dynamicColor.main,
      },
    },
    [BUTTON_IDS.SAVE]: {
      background: theme.palette.baselineColor.neutral[100],
      marginLeft: '0.2rem',
      border: `1px solid ${theme.palette.baselineColor.transparentNeutral[30]}`,
    },
    [BUTTON_IDS.REFRESH]: {
      padding: '0.75rem',
      maxHeight: '2rem',
      background: theme.palette.baselineColor.neutral[100],
      borderRadius: '0 6.25rem 6.25rem 0',
      color: theme.palette.baselineColor.neutral[0],
      '&:hover': {
        background: theme.palette.dynamicColor.main,
      },
    },
    [BUTTON_IDS.CANCEL]: undefined,
    [BUTTON_IDS.DELETE]: undefined,
    [BUTTON_IDS.EXPORT]: undefined,
    [BUTTON_IDS.ATTACHMENTS]: undefined,
    [BUTTON_IDS.FIND]: undefined,
    [BUTTON_IDS.GRID_VIEW]: undefined,
    [BUTTON_IDS.TAB_CONTROL]: {
      color: theme.palette.baselineColor.neutral[100],
      background: theme.palette.baselineColor.neutral[0],
      '&:hover': {
        background: theme.palette.dynamicColor.main,
      },
    },
  };

  return styles[btnId];
};
