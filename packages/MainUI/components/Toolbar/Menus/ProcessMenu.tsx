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
    <Menu anchorEl={anchorEl} onClose={onClose} className="rounded-xl">
      <div className="rounded-2xl px-2 py-4">
        {processButtons.map((button: ProcessButton, index: number) =>
          isProcessActionButton(button) ? (
            <ProcessMenuItem
              key={`${button.id}-${index}`}
              button={button}
              onProcessClick={onProcessClick}
              disabled={!selectedRecord}
            />
          ) : (
            <ProcessDefinitionMenuItem
              key={`${button.id}-${index}`}
              button={button}
              onProcessClick={onProcessClick}
              disabled={!selectedRecord}
            />
          )
        )}
      </div>
    </Menu>
  );
};

export default ProcessMenu;
