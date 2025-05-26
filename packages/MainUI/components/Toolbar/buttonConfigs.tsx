import React from 'react';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { StandardButtonConfig, IconSize } from './types';
import { TranslateFunction } from '@/hooks/types';
import Base64Icon from './Base64Icon';

export type ButtonType = 'ACTION' | 'DROPDOWN' | 'MODAL' | 'TOGGLE' | 'CUSTOM';
export type ButtonSection = 'left' | 'center' | 'right';

export interface ToolbarButtonMetadata {
  id: string;
  action: string;
  name: string;
  icon?: string | null;
  active: boolean;
  seqno?: number | null;
  buttonType: ButtonType;
  section: ButtonSection;
  modalConfig?: {
    title?: string;
    size?: 'small' | 'medium' | 'large';
  };
  dropdownConfig?: {
    items?: Array<{ label: string; action: string }>;
  };
}

export interface OrganizedSections {
  left: ToolbarButtonMetadata[];
  center: ToolbarButtonMetadata[];
  right: ToolbarButtonMetadata[];
}

export const DefaultIcon = () => <span style={{ fontSize: '1rem' }}>✣</span>;

const isBase64Image = (str: string): boolean => {
  try {
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    const isValidLength = str.length > 20 && str.length % 4 === 0;
    const isValidFormat = base64Regex.test(str);
    return isValidLength && isValidFormat;
  } catch {
    return false;
  }
};

const sortButtonsBySeqno = (buttons: ToolbarButtonMetadata[]): ToolbarButtonMetadata[] => {
  return [...buttons].sort((a, b) => {
    const seqnoA = a.seqno ?? Number.MAX_SAFE_INTEGER;
    const seqnoB = b.seqno ?? Number.MAX_SAFE_INTEGER;

    if (seqnoA !== seqnoB) {
      return seqnoA - seqnoB;
    }

    return a.name.localeCompare(b.name);
  });
};

export const IconComponent: React.FC<{ iconKey?: string | null }> = ({ iconKey }) => {
  if (!iconKey) return <DefaultIcon />;

  if (iconKey.startsWith('data:image/')) {
    return <Base64Icon src={iconKey} />;
  }

  if (isBase64Image(iconKey)) {
    return <Base64Icon src={`data:image/png;base64,${iconKey}`} />; // TODO: Modularize the way to implement filterClass to Icons filterClass="brightness-0 invert"
  }

  return <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{iconKey}</span>;
};

export const ProcessMenuIcon = () => {
  return <span style={{ fontSize: '1rem' }}>⚙️</span>;
};

export const organizeButtonsBySection = (buttons: ToolbarButtonMetadata[], isFormView: boolean): OrganizedSections => {
  const sections: OrganizedSections = { left: [], center: [], right: [] };

  const visibleButtons = buttons.filter(button => {
    if (!button.active) return false;
    if (isFormView && button.action === 'FIND') return false;
    return true;
  });

  visibleButtons.forEach(button => {
    if (button.section && sections[button.section]) {
      sections[button.section].push(button);
    }
  });

  return {
    left: sortButtonsBySeqno(sections.left),
    center: sortButtonsBySeqno(sections.center),
    right: sortButtonsBySeqno(sections.right),
  };
};

export const createButtonByType = (
  button: ToolbarButtonMetadata,
  onAction: (action: string, button: ToolbarButtonMetadata, event?: React.MouseEvent<HTMLElement>) => void,
  isFormView: boolean,
  hasSelectedRecord: boolean,
): StandardButtonConfig => {
  const baseConfig: StandardButtonConfig = {
    key: button.id,
    icon: <IconComponent iconKey={button.icon} />,
    tooltip: button.name,
    disabled: !button.active,
    height: IconSize,
    width: IconSize,
    onClick: function (): void {
      throw new Error('Function of button not implemented yet');
    },
  };

  const getIconTextConfig = () => {
    const showIconTextFor = ['NEW'];

    if (showIconTextFor.includes(button.action)) {
      return { iconText: button.name };
    }

    if (button.buttonType === 'DROPDOWN') {
      return { iconText: `${button.name} ▼` };
    }

    if (button.buttonType === 'MODAL' && button.modalConfig?.title) {
      return { iconText: button.modalConfig.title };
    }

    return {};
  };

  const getDisableConfig = () => {
    switch (button.action) {
      case 'CANCEL':
        return { disabled: !(isFormView || hasSelectedRecord) };
      case 'DELETE':
        return { disabled: !hasSelectedRecord };
      default:
        return {};
    }
  };

  const getClickConfig = () => {
    switch (button.buttonType) {
      case 'DROPDOWN':
        return {
          onClick: (event?: React.MouseEvent<HTMLElement>) => {
            onAction('OPEN_DROPDOWN', button, event);
          },
        };
      case 'MODAL':
        return {
          onClick: () => onAction('OPEN_MODAL', button),
        };
      case 'TOGGLE':
        return {
          onClick: () => onAction('TOGGLE', button),
        };
      case 'CUSTOM':
        return {
          onClick: (event?: React.MouseEvent<HTMLElement>) => {
            onAction('CUSTOM_ACTION', button, event);
          },
        };
      default:
        return {
          onClick: () => onAction(button.action, button),
        };
    }
  };

  return {
    ...baseConfig,
    ...getIconTextConfig(),
    ...getDisableConfig(),
    ...getClickConfig(),
  };
};

const BUTTON_STYLES = {
  NEW: 'bg-(--color-baseline-100) text-(--color-baseline-0) rounded-l-full h-8 px-3',
  SAVE: 'bg-(--color-baseline-100) text-(--color-baseline-0) h-8.5 w-8.5 ml-1',
  REFRESH:
    'bg-(--color-baseline-100) text-(--color-baseline-0) rounded-r-full  border-l-1 border-l-[color:var(--color-baseline-0)] w-10',
} as const;

export const getButtonStyles = (button: ToolbarButtonMetadata) => {
  return BUTTON_STYLES[button.action as keyof typeof BUTTON_STYLES];
};

export const createProcessMenuButton = (
  processCount: number,
  hasSelectedRecord: boolean,
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void,
  t: TranslateFunction,
): StandardButtonConfig => ({
  key: 'process-menu',
  icon: <ProcessMenuIcon />,
  iconText: t('common.processes'),
  tooltip: t('common.processes'),
  height: IconSize,
  width: IconSize,
  enabled: processCount > 0,
  className: `bg-(--color-warning) color-(--color-baseline-100) max-h-8 ${hasSelectedRecord ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`,
  onClick: (event?: React.MouseEvent<HTMLElement>) => {
    if (hasSelectedRecord && event && processCount > 0) {
      onMenuOpen(event);
    }
  },
});
