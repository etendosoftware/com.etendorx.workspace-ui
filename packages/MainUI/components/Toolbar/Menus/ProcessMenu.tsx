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
import { useCallback } from "react";
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

interface ProcessMenuItemProps {
  button: ProcessActionButton;
  onProcessClick: (button: ProcessButton) => void;
  disabled: boolean;
  buttonName: string;
}

interface ProcessDefinitionMenuItemProps {
  button: ProcessDefinitionButton;
  onProcessClick: (button: ProcessButton) => void;
  disabled: boolean;
  buttonName: string;
}

const ProcessMenuItem = ({ button, onProcessClick, disabled, buttonName }: ProcessMenuItemProps) => {
  const handleClick = useCallback(() => {
    onProcessClick(button);
  }, [button, onProcessClick]);

  return (
    <div
      onClick={disabled ? undefined : handleClick}
      className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}>
      {buttonName}
    </div>
  );
};

ProcessMenuItem.displayName = "ProcessMenuItem";

const ProcessDefinitionMenuItem = ({
  button,
  onProcessClick,
  disabled,
  buttonName,
}: ProcessDefinitionMenuItemProps) => {
  const handleClick = useCallback(() => {
    onProcessClick(button);
  }, [button, onProcessClick]);

  return (
    <div
      onClick={disabled ? undefined : handleClick}
      className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}>
      {buttonName}
    </div>
  );
};

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
