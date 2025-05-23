import { theme } from '@workspaceui/componentlibrary/src/theme';
import React from 'react';
import { BUTTON_IDS, StandardButtonId } from '../../constants/Toolbar';
import { StandardButton, StandardButtonConfig } from './types';
import { iconMap } from './iconMap';

export const createStandardButtonConfig = (
  btn: StandardButton,
  handleAction: (action: string) => void,
): StandardButtonConfig => {
  const getIconFill = (buttonId: StandardButtonId): string => {
    const specialButtons = [
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
    icon: React.createElement(iconMap[btn.icon], {
      className: 'w-4 h-4',
    }),
    tooltip: btn.name,
    onClick: () => handleAction(btn.action),
    disabled: !btn.enabled,

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
    icon: React.createElement(iconMap.tabControl, {
      className: 'w-4 h-4',
    }),
    tooltip: 'Tab Control',
    onClick: () => handleAction(BUTTON_IDS.TAB_CONTROL),
    disabled: !isRecordSelected,
    className: getStandardButtonStyle(BUTTON_IDS.TAB_CONTROL),
  };
};

export const getStandardButtonStyle = (btnId: StandardButtonId) => {
  const classNames: Record<StandardButtonId, string | undefined> = {
    [BUTTON_IDS.NEW]: 'bg-(--color-baseline-100) text-(--color-baseline-0) rounded-l-full h-8 px-3',
    [BUTTON_IDS.SAVE]: 'bg-(--color-baseline-100) text-(--color-baseline-0) h-8.5 w-8.5 ml-1',
    [BUTTON_IDS.REFRESH]:
      'bg-(--color-baseline-100) text-(--color-baseline-0) rounded-r-full  border-l-1 border-l-[color:var(--color-baseline-0)] w-10',
    [BUTTON_IDS.DELETE]: '',
    [BUTTON_IDS.EXPORT]: '',
    [BUTTON_IDS.ATTACHMENTS]: '',
    [BUTTON_IDS.FIND]: '',
    [BUTTON_IDS.GRID_VIEW]: '',
    [BUTTON_IDS.TAB_CONTROL]: '',
  };

  return classNames[btnId];
};
