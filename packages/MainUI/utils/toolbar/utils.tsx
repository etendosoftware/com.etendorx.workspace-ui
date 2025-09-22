/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { OrganizedSections, ToolbarButtonMetadata } from "@/hooks/Toolbar/types";
import type React from "react";
import Base64Icon from "@workspaceui/componentlibrary/src/components/Base64Icon";
import { IconSize, type ToolbarButton } from "@/components/Toolbar/types";
import { TOOLBAR_BUTTONS_ACTIONS, TOOLBAR_BUTTONS_TYPES } from "@/utils/toolbar/constants";
import type { SaveButtonState } from "@/contexts/ToolbarContext";

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
    "toolbar-button-new bg-[var(--color-baseline-100)] text-[var(--color-baseline-0)] h-8 w-8 py-1 pl-3 pr-5 disabled:bg-[var(--color-baseline-100)] disabled:opacity-20 disabled:text-[var(--color-baseline-0)]",
  [TOOLBAR_BUTTONS_ACTIONS.SAVE]:
    "toolbar-button-save bg-[var(--color-baseline-100)] text-[var(--color-baseline-0)] h-8 w-8 py-1 pl-3 pr-5 disabled:bg-[var(--color-baseline-100)] disabled:opacity-20 disabled:text-[var(--color-baseline-0)]",
  [TOOLBAR_BUTTONS_ACTIONS.REFRESH]:
    "toolbar-button-refresh border-1 border-[var(--color-transparent-neutral-20)] h-8 w-8 hover:border-none hover:bg-[var(--color-etendo-dark)] hover:text-[var(--color-baseline-80)]",
  [TOOLBAR_BUTTONS_ACTIONS.CANCEL]: "toolbar-button-cancel",
  [TOOLBAR_BUTTONS_ACTIONS.DELETE]: "toolbar-button-delete",
  [TOOLBAR_BUTTONS_ACTIONS.FIND]: "toolbar-button-find",
  [TOOLBAR_BUTTONS_ACTIONS.FILTER]: "toolbar-button-filter",
  [TOOLBAR_BUTTONS_ACTIONS.COPILOT]: "toolbar-button-copilot",
  [TOOLBAR_BUTTONS_ACTIONS.COLUMN_FILTERS]: "toolbar-button-column-filters",
  [TOOLBAR_BUTTONS_ACTIONS.TOGGLE_TREE_VIEW]: "toolbar-button-toggle-tree-view",
} as const;

export const DefaultIcon = () => <span style={{ fontSize: "1rem" }}>✣</span>;

export const IconComponent: React.FC<{ iconKey?: string | null }> = ({ iconKey }) => {
  if (!iconKey) return <DefaultIcon data-testid="DefaultIcon__5aeccd" />;

  if (iconKey.startsWith("data:image/")) {
    return <Base64Icon src={iconKey} data-testid="Base64Icon__5aeccd" />;
  }

  if (isBase64Image(iconKey)) {
    return <Base64Icon src={`data:image/png;base64,${iconKey}`} data-testid="Base64Icon__5aeccd" />;
  }

  return <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>{iconKey}</span>;
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

const isVisibleButton = (button: ToolbarButtonMetadata, isFormView: boolean, isTreeNodeView?: boolean) => {
  if (!button.active) return false;

  const isFindButtonInFormView = isFormView && button.action === TOOLBAR_BUTTONS_ACTIONS.FIND;
  const isSaveButtonInNonFormView = !isFormView && button.action === TOOLBAR_BUTTONS_ACTIONS.SAVE;
  const isCreateButtonInFormView = isFormView && button.action === TOOLBAR_BUTTONS_ACTIONS.NEW;
  const isFilterButtonInFormView = isFormView && button.action === TOOLBAR_BUTTONS_ACTIONS.FILTER;
  const isToggleTreeView = !isTreeNodeView && button.action === TOOLBAR_BUTTONS_ACTIONS.TOGGLE_TREE_VIEW;
  return (
    !isFindButtonInFormView &&
    !isSaveButtonInNonFormView &&
    !isCreateButtonInFormView &&
    !isFilterButtonInFormView &&
    !isToggleTreeView
  );
};

export const organizeButtonsBySection = (
  buttons: ToolbarButtonMetadata[],
  isFormView: boolean,
  isTreeNodeView?: boolean
): OrganizedSections => {
  const sections: OrganizedSections = { left: [], center: [], right: [] };

  const visibleButtons = buttons.filter((button) => isVisibleButton(button, isFormView, isTreeNodeView));

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
  isCopilotInstalled,
  saveButtonState,
}: {
  button: ToolbarButtonMetadata;
  onAction: (action: string, button: ToolbarButtonMetadata, event?: React.MouseEvent<HTMLElement>) => void;
  isFormView: boolean;
  hasFormChanges: boolean;
  hasSelectedRecord: boolean;
  hasParentRecordSelected: boolean;
  isCopilotInstalled?: boolean;
  saveButtonState?: SaveButtonState;
}): ToolbarButton => {
  const buttonKey = button.id || `${button.action}-${button.name}`;

  const baseConfig: ToolbarButton = {
    key: buttonKey,
    icon: <IconComponent iconKey={button.icon} data-testid="IconComponent__5aeccd" />,
    tooltip: button.name,
    disabled: !button.active,
    height: IconSize,
    width: IconSize,
    onClick: () => onAction(button.action, button),
  };

  const getIconTextConfig = (): Partial<ToolbarButton> => {
    const showIconTextFor = [TOOLBAR_BUTTONS_ACTIONS.NEW, TOOLBAR_BUTTONS_ACTIONS.SAVE];

    if (showIconTextFor.includes(button.action)) {
      if (button.action === TOOLBAR_BUTTONS_ACTIONS.SAVE && saveButtonState?.isCalloutLoading) {
        return { iconText: "Loading callouts..." };
      }

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

  const buildDisableConfig = (isDisabled: boolean): Partial<ToolbarButton> => ({
    disabled: isDisabled,
    tooltip: isDisabled ? "" : button.name,
  });

  const getDisableConfig = (): Partial<ToolbarButton> => {
    const actionHandlers = {
      [TOOLBAR_BUTTONS_ACTIONS.CANCEL]: () => buildDisableConfig(!(isFormView || hasSelectedRecord)),
      [TOOLBAR_BUTTONS_ACTIONS.DELETE]: () => buildDisableConfig(!hasSelectedRecord),
      [TOOLBAR_BUTTONS_ACTIONS.COPILOT]: () => buildDisableConfig(!hasSelectedRecord || !isCopilotInstalled),
      [TOOLBAR_BUTTONS_ACTIONS.NEW]: () => buildDisableConfig(!hasParentRecordSelected),
      [TOOLBAR_BUTTONS_ACTIONS.REFRESH]: () => buildDisableConfig(!hasParentRecordSelected),
      [TOOLBAR_BUTTONS_ACTIONS.SAVE]: () => {
        const baseDisabled = !isFormView || !hasFormChanges || !hasParentRecordSelected;
        const additionalDisabled = saveButtonState
          ? saveButtonState.isCalloutLoading || saveButtonState.isSaving
          : false;
        return buildDisableConfig(baseDisabled || additionalDisabled);
      },
    };

    const handler = actionHandlers[button.action];
    return handler ? handler() : buildDisableConfig(!button.active);
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
          onClick: (event?: React.MouseEvent<HTMLElement>) => onAction(button.action, button, event),
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

/**
 * Configuration object for button creation
 */
interface ButtonConfig {
  isFormView: boolean;
  hasFormChanges: boolean;
  hasSelectedRecord: boolean;
  hasParentRecordSelected: boolean;
  saveButtonState?: SaveButtonState;
  isCopilotInstalled?: boolean;
}

/**
 * Creates toolbar buttons with configuration and styles applied
 */
const createSectionButtons = (
  sectionButtons: ToolbarButtonMetadata[],
  onAction: (action: string, button: ToolbarButtonMetadata, event?: React.MouseEvent<HTMLElement>) => void,
  config: ButtonConfig
): ToolbarButton[] => {
  return sectionButtons.map((button) => {
    const toolbarButton = createButtonByType({
      button,
      onAction,
      ...config,
    });

    // Apply button-specific styles if available
    const styles = getButtonStyles(button);
    if (styles) {
      toolbarButton.className = toolbarButton.className ? `${toolbarButton.className} ${styles}` : styles;
    }

    return toolbarButton;
  });
};

/**
 * Base styles for toolbar sections - memoized to avoid object recreation
 */
const SECTION_BASE_STYLES: React.CSSProperties = { display: "flex", alignItems: "center" };
const SECTION_STYLE: React.CSSProperties = { ...SECTION_BASE_STYLES, gap: "0.25rem" };

/**
 * Configuration object for getToolbarSections function
 */
interface ToolbarSectionsConfig {
  buttons: ToolbarButtonMetadata[];
  onAction: (action: string, button: ToolbarButtonMetadata, event?: React.MouseEvent<HTMLElement>) => void;
  isFormView: boolean;
  isTreeNodeView?: boolean;
  hasFormChanges?: boolean;
  hasSelectedRecord?: boolean;
  hasParentRecordSelected?: boolean;
  isCopilotInstalled?: boolean;
  saveButtonState?: SaveButtonState;
}

export const getToolbarSections = ({
  buttons,
  onAction,
  isFormView,
  isTreeNodeView,
  hasFormChanges = false,
  hasSelectedRecord = false,
  hasParentRecordSelected = false,
  isCopilotInstalled = false,
  saveButtonState,
}: ToolbarSectionsConfig): {
  leftSection: { buttons: ToolbarButton[]; style: React.CSSProperties };
  centerSection: { buttons: ToolbarButton[]; style: React.CSSProperties };
  rightSection: { buttons: ToolbarButton[]; style: React.CSSProperties };
} => {
  const organizedButtons = organizeButtonsBySection(buttons, isFormView, isTreeNodeView);

  // Shared configuration object to avoid parameter repetition
  const buttonConfig: ButtonConfig = {
    isFormView,
    hasFormChanges,
    hasSelectedRecord,
    hasParentRecordSelected,
    saveButtonState,
    isCopilotInstalled,
  };

  return {
    leftSection: {
      buttons: createSectionButtons(organizedButtons.left, onAction, buttonConfig),
      style: SECTION_STYLE,
    },
    centerSection: {
      buttons: createSectionButtons(organizedButtons.center, onAction, buttonConfig),
      style: SECTION_STYLE,
    },
    rightSection: {
      buttons: createSectionButtons(organizedButtons.right, onAction, buttonConfig),
      style: SECTION_STYLE,
    },
  };
};
