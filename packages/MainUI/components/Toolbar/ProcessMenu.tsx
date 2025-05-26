'use client';

import { useCallback } from 'react';
import { ProcessMenuProps } from './types';
import { ProcessButton } from '../ProcessModal/types';
import useDisplayLogic from '@/hooks/useDisplayLogic';
import Menu from '@workspaceui/componentlibrary/src/components/Menu';

interface ProcessMenuItemProps {
  button: ProcessButton;
  onProcessClick: (button: ProcessButton) => void;
  disabled: boolean;
}

const ProcessMenuItem = ({ button, onProcessClick, disabled }: ProcessMenuItemProps) => {
  const isDisplayed = useDisplayLogic(button);

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
      <div className="py-2 px-2">
        {processButtons.map((button: ProcessButton, index: number) => (
          <ProcessMenuItem
            key={`${button.id}-${index}`}
            button={button}
            onProcessClick={onProcessClick}
            disabled={!selectedRecord}
          />
        ))}
      </div>
    </Menu>
  );
};

export default ProcessMenu;
