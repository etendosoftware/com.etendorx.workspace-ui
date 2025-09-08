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

import useDisplayLogic from "@/hooks/useDisplayLogic";
import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import { useCallback } from "react";
import type { ProcessButton } from "../../ProcessModal/types";
import { isProcessActionButton } from "../../ProcessModal/types";
import type { ProcessMenuProps } from "../types";

interface ProcessMenuItemProps {
  button: ProcessButton;
  onProcessClick: (button: ProcessButton) => void;
  disabled: boolean;
}

const ProcessMenuItem = ({ button, onProcessClick, disabled }: ProcessMenuItemProps) => {
  const isDisplayed = useDisplayLogic({ field: button });

  const handleClick = useCallback(() => {
    onProcessClick(button);
  }, [button, onProcessClick]);

  if (!isDisplayed) {
    return null;
  }

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
      {button.name}
    </div>
  );
};

ProcessMenuItem.displayName = "ProcessMenuItem";

const ProcessDefinitionMenuItem = ({ button, onProcessClick, disabled }: ProcessMenuItemProps) => {
  const isDisplayed = useDisplayLogic({ field: button as ProcessButton });

  const handleClick = useCallback(() => {
    onProcessClick(button);
  }, [button, onProcessClick]);

  if (!isDisplayed) {
    return null;
  }

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
      {button.name}
    </div>
  );
};

const ProcessMenu: React.FC<ProcessMenuProps> = ({
  anchorEl,
  onClose,
  processButtons,
  onProcessClick,
  selectedRecord,
}) => {
  return (
    <Menu anchorEl={anchorEl} onClose={onClose} className="rounded-xl" data-testid="Menu__541926">
      <div className="rounded-2xl px-2 py-4">
        {processButtons.map((button: ProcessButton, index: number) =>
          isProcessActionButton(button) ? (
            <ProcessMenuItem
              key={`${button.id}-${index}`}
              button={button}
              onProcessClick={onProcessClick}
              disabled={!selectedRecord}
              data-testid="ProcessMenuItem__541926"
            />
          ) : (
            <ProcessDefinitionMenuItem
              key={`${button.id}-${index}`}
              button={button}
              onProcessClick={onProcessClick}
              disabled={!selectedRecord}
              data-testid="ProcessDefinitionMenuItem__541926"
            />
          )
        )}
      </div>
    </Menu>
  );
};

export default ProcessMenu;
