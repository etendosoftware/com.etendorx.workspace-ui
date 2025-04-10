import { ProcessButtonType } from '../ProcessModal/types';
import { useCallback } from 'react';
import { Menu, Tooltip } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { ProcessMenuProps } from './types';
import { ProcessButton } from '../ProcessModal/types';
import useDisplayLogic from '@/hooks/useDisplayLogic';

const menuStyle = {
  marginTop: '0.5rem',
  paddingY: 0,
  '& .MuiPaper-root': {
    borderRadius: '0.75rem',
    background: theme.palette.baselineColor.neutral[5],
  },
};

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
    <Tooltip title={button.name} enterNextDelay={1000} followCursor>
      <div
        onClick={disabled ? undefined : handleClick}
        className="p-2 m-2 hover:bg-(--color-baseline-20) transition rounded-lg cursor-pointer">
        {button.name}
      </div>
    </Tooltip>
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
    <Tooltip title={button.name} enterNextDelay={1000} followCursor>
      <div
        onClick={disabled ? undefined : handleClick}
        className="p-2 m-2 hover:bg-(--color-baseline-20) transition rounded-lg cursor-pointer">
        {button.name}
      </div>
    </Tooltip>
  );
};

const ProcessMenu: React.FC<ProcessMenuProps> = ({
  anchorEl,
  open,
  onClose,
  processButtons,
  onProcessClick,
  selectedRecord,
}) => {
  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose} sx={menuStyle}>
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
    </Menu>
  );
};

export default ProcessMenu;
