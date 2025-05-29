import type { OrganizedSections, ToolbarButtonMetadata } from '@/hooks/Toolbar/types';
import type { TranslateFunction } from '@/hooks/types';
import type React from 'react';
import Base64Icon from './Base64Icon';
import { IconSize, type ToolbarButton } from './types';

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

export const IconComponent: React.FC<{ iconKey?: string | null }> = ({ iconKey }) => {
  if (!iconKey) return <DefaultIcon />;

  if (iconKey.startsWith('data:image/')) {
    return <Base64Icon src={iconKey} />;
  }

  if (isBase64Image(iconKey)) {
    return <Base64Icon src={`data:image/png;base64,${iconKey}`} />;
  }

  return <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{iconKey}</span>;
};

export const ProcessMenuIcon = () => {
  return <span style={{ fontSize: '1rem' }}>⚙️</span>;
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

export const organizeButtonsBySection = (buttons: ToolbarButtonMetadata[], isFormView: boolean): OrganizedSections => {
  const sections: OrganizedSections = { left: [], center: [], right: [] };

  const visibleButtons = buttons.filter((button) => {
    if (!button.active) return false;
    if (isFormView && button.action === 'FIND') return false;
    return true;
  });

  for (const button of visibleButtons) {
    if (button.section && sections[button.section]) {
      sections[button.section].push(button);
    }
  }

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
): ToolbarButton => {
  const buttonKey = button.id || `${button.action}-${button.name}`;

  const baseConfig: ToolbarButton = {
    key: buttonKey,
    icon: <IconComponent iconKey={button.icon} />,
    tooltip: button.name,
    disabled: !button.active,
    height: IconSize,
    width: IconSize,
    onClick: () => onAction(button.action, button),
  };

  const getIconTextConfig = (): Partial<ToolbarButton> => {
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

  const getDisableConfig = (): Partial<ToolbarButton> => {
    switch (button.action) {
      case 'CANCEL':
        return { disabled: !(isFormView || hasSelectedRecord) };
      case 'DELETE':
        return { disabled: !hasSelectedRecord };
      default:
        return { disabled: !button.active };
    }
  };

  const getClickConfig = (): Partial<ToolbarButton> => {
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
  NEW: 'toolbar-button-new bg-(--color-baseline-100) text-(--color-baseline-0) rounded-l-full h-8 px-3',
  SAVE: 'toolbar-button-save bg-(--color-baseline-100) text-(--color-baseline-0) h-8.5 w-8.5 ml-1',
  REFRESH:
    'toolbar-button-refresh bg-(--color-baseline-100) text-(--color-baseline-0) rounded-r-full border-l-1 border-l-[color:var(--color-baseline-0)] w-10',
  CANCEL: 'toolbar-button-cancel',
  DELETE: 'toolbar-button-delete',
  FIND: 'toolbar-button-find',
  FILTER: 'toolbar-button-filter',
} as const;

export const getButtonStyles = (button: ToolbarButtonMetadata) => {
  return BUTTON_STYLES[button.action as keyof typeof BUTTON_STYLES];
};

export const createProcessMenuButton = (
  processCount: number,
  hasSelectedRecord: boolean,
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void,
  t: TranslateFunction,
  buttonRef: React.LegacyRef<HTMLButtonElement>,
): ToolbarButton => ({
  key: 'process-menu',
  icon: <ProcessMenuIcon />,
  iconText: t('common.processes'),
  tooltip: t('common.processes'),
  ref: buttonRef,
  disabled: !hasSelectedRecord,
  className: 'bg-(--color-warning-main) disabled:bg-(--color-warning-light) h-8 [&>svg]:w-4 [&>svg]:h-4',
  onClick: (event?: React.MouseEvent<HTMLElement>) => {
    if (hasSelectedRecord && event && processCount > 0) {
      onMenuOpen(event);
    }
  },
});
