import { Menu, MenuItem, Tooltip } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { ProcessMenuProps } from './types';
import { ProcessButton } from '../ProcessModal/types';
import { forwardRef, useCallback } from 'react';

const menuStyle = {
  marginTop: '0.5rem',
  paddingY: 0,
  '& .MuiPaper-root': {
    borderRadius: '0.75rem',
    background: theme.palette.baselineColor.neutral[5],
  },
};

const menuItemStyle = {
  display: 'flex',
  width: 'auto',
  margin: '0.5rem',
  padding: '0.5rem',
  borderRadius: '0.5rem',
  '&:hover': {
    background: theme.palette.baselineColor.neutral[20],
    color: theme.palette.baselineColor.neutral[90],
  },
};

interface ProcessMenuItemProps {
  button: ProcessButton;
  onProcessClick: (button: ProcessButton) => void;
  disabled: boolean;
}

const ProcessMenuItem = forwardRef<HTMLLIElement, ProcessMenuItemProps>(
  ({ button, onProcessClick, disabled }: ProcessMenuItemProps, ref) => {
    const handleClick = useCallback(() => {
      onProcessClick(button);
    }, [button, onProcessClick]);

    return (
      <Tooltip title={button.name} enterDelay={600} leaveDelay={100}>
        <MenuItem onClick={handleClick} sx={menuItemStyle} disabled={disabled} ref={ref}>
          <span>{button.name}</span>
        </MenuItem>
      </Tooltip>
    );
  },
);

ProcessMenuItem.displayName = 'ProcessMenuItem';

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
      {processButtons.map((button: ProcessButton, index: number) => (
        <ProcessMenuItem
          key={`${button.id}-${index}`}
          button={button}
          onProcessClick={onProcessClick}
          disabled={!selectedRecord}
        />
      ))}
    </Menu>
  );
};

export default ProcessMenu;
