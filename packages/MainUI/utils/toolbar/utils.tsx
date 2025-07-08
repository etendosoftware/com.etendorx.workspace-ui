import type { OrganizedSections, ToolbarButtonMetadata } from "@/hooks/Toolbar/types";
import type { TranslateFunction } from "@/hooks/types";
import type React from "react";
import Base64Icon from "@workspaceui/componentlibrary/src/components/Base64Icon";
import { IconSize, type ToolbarButton } from "@/components/Toolbar/types";
import { TOOLBAR_BUTTONS_ACTIONS, TOOLBAR_BUTTONS_TYPES } from "@/utils/toolbar/constants";

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

const BUTTON_STYLES = {
  [TOOLBAR_BUTTONS_ACTIONS.NEW]:
    "toolbar-button-new bg-(--color-baseline-100) text-(--color-baseline-0) rounded-l-full h-8 px-3 disabled:bg-(--color-baseline-20) disabled:text-(--color-baseline-0)",
  [TOOLBAR_BUTTONS_ACTIONS.SAVE]:
    "toolbar-button-save bg-(--color-baseline-100) text-(--color-baseline-0) h-8.5 w-8.5 ml-1 disabled:bg-(--color-baseline-20) disabled:text-(--color-baseline-0)",
  [TOOLBAR_BUTTONS_ACTIONS.REFRESH]:
    "toolbar-button-refresh bg-(--color-baseline-100) text-(--color-baseline-0) rounded-r-full border-l-1 border-l-[color:var(--color-baseline-0)] w-10 disabled:bg-(--color-baseline-20) disabled:text-(--color-baseline-0)",
  [TOOLBAR_BUTTONS_ACTIONS.CANCEL]: "toolbar-button-cancel",
  [TOOLBAR_BUTTONS_ACTIONS.DELETE]: "toolbar-button-delete",
  [TOOLBAR_BUTTONS_ACTIONS.FIND]: "toolbar-button-find",
  [TOOLBAR_BUTTONS_ACTIONS.FILTER]: "toolbar-button-filter",
} as const;

export const DefaultIcon = () => <span style={{ fontSize: "1rem" }}>✣</span>;

export const IconComponent: React.FC<{ iconKey?: string | null }> = ({ iconKey }) => {
  if (!iconKey) return <DefaultIcon />;

  if (iconKey.startsWith("data:image/")) {
    return <Base64Icon src={iconKey} />;
  }

  if (isBase64Image(iconKey)) {
    return <Base64Icon src={`data:image/png;base64,${iconKey}`} />;
  }

  return <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>{iconKey}</span>;
};

export const ProcessMenuIcon = () => {
  return <span style={{ fontSize: "1rem" }}>⚙️</span>;
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
    if (isFormView && button.action === TOOLBAR_BUTTONS_ACTIONS.FIND) return false;
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

export const createButtonByType = ({
  button,
  onAction,
  isFormView,
  hasFormChanges,
  hasSelectedRecord,
  hasParentRecordSelected,
}: {
  button: ToolbarButtonMetadata;
  onAction: (action: string, button: ToolbarButtonMetadata, event?: React.MouseEvent<HTMLElement>) => void;
  isFormView: boolean;
  hasFormChanges: boolean;
  hasSelectedRecord: boolean;
  hasParentRecordSelected: boolean;
}): ToolbarButton => {
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
    const showIconTextFor = [TOOLBAR_BUTTONS_ACTIONS.NEW];

    if (showIconTextFor.includes(button.action)) {
      return { iconText: button.name };
    }

    if (button.buttonType === TOOLBAR_BUTTONS_TYPES.DROPDOWN) {
      return { iconText: `${button.name} ▼` };
    }

    if (button.buttonType === TOOLBAR_BUTTONS_TYPES.MODAL && button.modalConfig?.title) {
      return { iconText: button.modalConfig.title };
    }

    return {};
  };

  const getDisableConfig = (): Partial<ToolbarButton> => {
    switch (button.action) {
      case TOOLBAR_BUTTONS_ACTIONS.CANCEL: {
        const isDisabledCancel = !(isFormView || hasSelectedRecord);
        return { disabled: isDisabledCancel, tooltip: isDisabledCancel ? "" : button.name };
      }
      case TOOLBAR_BUTTONS_ACTIONS.DELETE: {
        const isDisabledDelete = !hasSelectedRecord;
        return { disabled: isDisabledDelete, tooltip: isDisabledDelete ? "" : button.name };
      }
      case TOOLBAR_BUTTONS_ACTIONS.NEW: {
        const isDisabledNew = !hasParentRecordSelected;
        return { disabled: isDisabledNew, tooltip: isDisabledNew ? "" : button.name };
      }
      case TOOLBAR_BUTTONS_ACTIONS.REFRESH: {
        const isDisabledRefresh = !hasParentRecordSelected;
        return { disabled: isDisabledRefresh, tooltip: isDisabledRefresh ? "" : button.name };
      }
      case TOOLBAR_BUTTONS_ACTIONS.SAVE: {
        const isDisabledSave = !isFormView || !hasFormChanges || !hasParentRecordSelected;
        return { disabled: isDisabledSave, tooltip: isDisabledSave ? "" : button.name };
      }
      default: {
        const isDisabledDefault = !button.active;
        return { disabled: isDisabledDefault, tooltip: isDisabledDefault ? "" : button.name };
      }
    }
  };

  const getClickConfig = (): Partial<ToolbarButton> => {
    switch (button.buttonType) {
      case TOOLBAR_BUTTONS_TYPES.DROPDOWN:
        return {
          onClick: (event?: React.MouseEvent<HTMLElement>) => {
            onAction("OPEN_DROPDOWN", button, event);
          },
        };
      case TOOLBAR_BUTTONS_TYPES.MODAL:
        return {
          onClick: () => onAction("OPEN_MODAL", button),
        };
      case TOOLBAR_BUTTONS_TYPES.TOGGLE:
        return {
          onClick: () => onAction("TOGGLE", button),
        };
      case TOOLBAR_BUTTONS_TYPES.CUSTOM:
        return {
          onClick: (event?: React.MouseEvent<HTMLElement>) => {
            onAction("CUSTOM_ACTION", button, event);
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

export const getButtonStyles = (button: ToolbarButtonMetadata) => {
  return BUTTON_STYLES[button.action as keyof typeof BUTTON_STYLES];
};

export const createProcessMenuButton = (
  processCount: number,
  hasSelectedRecord: boolean,
  onMenuOpen: (event: React.MouseEvent<HTMLButtonElement>) => void,
  t: TranslateFunction,
  anchorEl: HTMLElement | null
): ToolbarButton => ({
  key: "process-menu",
  icon: <ProcessMenuIcon />,
  iconText: t("common.processes"),
  tooltip: t("common.processes"),
  anchorEl: anchorEl,
  disabled: !hasSelectedRecord,
  className: "bg-(--color-warning-main) disabled:bg-(--color-warning-light) h-8 [&>svg]:w-4 [&>svg]:h-4",
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
    if (hasSelectedRecord && event && processCount > 0) {
      onMenuOpen(event);
    }
  },
});
