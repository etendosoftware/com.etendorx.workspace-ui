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

"use client";

import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import { useCallback, type HTMLAttributes, type KeyboardEvent, type MouseEvent } from "react";
import type { ProcessButton, ProcessActionButton, ProcessDefinitionButton } from "../../ProcessModal/types";
import { isProcessActionButton } from "../../ProcessModal/types";
import type { ProcessMenuProps } from "../types";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

/**
 * Resolves the display name for a process action button based on the selected record's state.
 *
 * Some buttons have dynamic names defined in `buttonRefList` that map to specific
 * record property values (e.g., "Complete" vs "Reactivate" based on document status).
 *
 * @param button - The process action button with optional refList configuration
 * @param selectedRecord - The currently selected record to derive the name from
 * @returns The resolved button label, or the default button name if no match is found
 */
const getProcessButtonName = (
  button: ProcessActionButton | ProcessDefinitionButton,
  selectedRecord: EntityData | undefined
): string => {
  const refListOptions = button.buttonRefList;

  // Early return if no record or no dynamic name options configured
  if (!selectedRecord || !refListOptions) {
    return button.name;
  }

  const recordValue = selectedRecord[button.hqlName];
  // NOTE: legacy condition to handle "--" value
  const formattedRecordValue = recordValue === "--" ? "CL" : recordValue;
  const matchingOption = refListOptions.find((option) => option.value === formattedRecordValue);

  return matchingOption?.label ?? button.name;
};

type ProcessMenuItemBaseProps<T extends ProcessButton> = {
  button: T;
  onProcessClick: (button: ProcessButton) => void;
  disabled: boolean;
  buttonName: string;
} & HTMLAttributes<HTMLDivElement>;

const ProcessMenuItemBase = <T extends ProcessButton>({
  button,
  onProcessClick,
  disabled,
  buttonName,
  onClick,
  onKeyDown,
  className,
  ...divProps
}: ProcessMenuItemBaseProps<T>) => {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }
      onClick?.(event);
      if (!event.defaultPrevented) {
        onProcessClick(button);
      }
    },
    [button, disabled, onClick, onProcessClick]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled) {
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onProcessClick(button);
      }
    },
    [button, disabled, onKeyDown, onProcessClick]
  );

  return (
    <div
      {...divProps}
      onClick={disabled ? undefined : handleClick}
      className={
        className
          ? `cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20) ${className}`
          : "cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)"
      }
      onKeyDown={handleKeyDown}>
      {buttonName}
    </div>
  );
};

type ProcessMenuItemProps = ProcessMenuItemBaseProps<ProcessActionButton>;
type ProcessDefinitionMenuItemProps = ProcessMenuItemBaseProps<ProcessDefinitionButton>;

const ProcessMenuItem = (props: ProcessMenuItemProps) => (
  <ProcessMenuItemBase {...props} data-testid="ProcessMenuItemBase__541926" />
);
const ProcessDefinitionMenuItem = (props: ProcessDefinitionMenuItemProps) => (
  <ProcessMenuItemBase {...props} data-testid="ProcessMenuItemBase__541926" />
);

ProcessMenuItem.displayName = "ProcessMenuItem";
ProcessDefinitionMenuItem.displayName = "ProcessDefinitionMenuItem";

const ProcessMenu: React.FC<ProcessMenuProps> = ({
  anchorEl,
  onClose,
  processButtons,
  onProcessClick,
  selectedRecord,
  hasSelection,
}) => {
  const isDisabled = hasSelection !== undefined ? !hasSelection : !selectedRecord;

  return (
    <Menu anchorEl={anchorEl} onClose={onClose} className="rounded-xl" data-testid="Menu__541926">
      <div className="rounded-2xl px-2 py-4">
        {processButtons.map((button: ProcessButton, index: number) => {
          const buttonName = getProcessButtonName(button, selectedRecord);

          if (isProcessActionButton(button)) {
            return (
              <ProcessMenuItem
                key={`${button.id}-${index}`}
                button={button}
                onProcessClick={onProcessClick}
                buttonName={buttonName}
                disabled={isDisabled}
                data-testid="ProcessMenuItem__541926"
              />
            );
          }
          return (
            <ProcessDefinitionMenuItem
              key={`${button.id}-${index}`}
              button={button}
              onProcessClick={onProcessClick}
              buttonName={buttonName}
              disabled={isDisabled}
              data-testid="ProcessDefinitionMenuItem__541926"
            />
          );
        })}
      </div>
    </Menu>
  );
};

export default ProcessMenu;
