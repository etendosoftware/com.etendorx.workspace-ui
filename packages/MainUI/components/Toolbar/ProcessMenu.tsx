'use client';

import { useCallback } from 'react';
import { ProcessMenuProps } from './types';
import { ProcessButton } from '../ProcessModal/types';
import { ProcessButtonType } from '../ProcessModal/types';
import useDisplayLogic from '@/hooks/useDisplayLogic';
import Menu from '@workspaceui/componentlibrary/src/components/Menu';

interface ProcessMenuItemProps {
  button: ProcessButton;
  onProcessClick: (button: ProcessButton) => void;
  disabled: boolean;
}

const ProcessMenuItem = ({ button, onProcessClick, disabled }: ProcessMenuItemProps) => {
  const isDisplayed = useDisplayLogic(button.field);

  const handleClick = useCallback(() => {
    onProcessClick(button);
  }, [button, onProcessClick]);

  if (!isDisplayed) {
    return null;
  }

  return (
    <div
      onClick={disabled ? undefined : handleClick}
      className="p-2 hover:bg-(--color-baseline-20) transition rounded-lg cursor-pointer">
      {button.name}
    </div>
  );
};

ProcessMenuItem.displayName = 'ProcessMenuItem';

const ProcessDefinitionMenuItem = ({ button, onProcessClick, disabled }: ProcessMenuItemProps) => {
  const isDisplayed = useDisplayLogic(button.field);

  const handleClick = useCallback(() => {
    onProcessClick(button);
  }, [button, onProcessClick]);

  if (!isDisplayed) {
    return null;
  }

  return (
    <div onClick={disabled ? undefined : handleClick} className="transition rounded-lg cursor-pointer">
      {button.name}
    </div>
  );
};

const ProcessMenu: React.FC<ProcessMenuProps> = ({
  anchorRef,
  open,
  onClose,
  processButtons,
  onProcessClick,
  selectedRecord,
}) => {
  return (
    <Menu className="rounded-2xl" anchorRef={anchorRef} open={open} onClose={onClose} animation="height">
      <div className="py-4 px-2">
        {processButtons.map((button: ProcessButton, index: number) =>
          ProcessButtonType.PROCESS_ACTION in button ? (
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
          ),
        )}
      </div>
    </Menu>
  );
};

export default ProcessMenu;
