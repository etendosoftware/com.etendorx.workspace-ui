import React from 'react';
import { Menu, MenuItem, Tooltip } from '@mui/material';
import { ProcessButton } from '@workspaceui/componentlibrary/src/components/ProcessModal/types';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { ProcessMenuProps } from './types';

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
  margin: '0 0.5rem',
  padding: '0.5rem',
  borderRadius: '0.5rem',
  '&:hover': {
    background: theme.palette.baselineColor.neutral[20],
    color: theme.palette.baselineColor.neutral[90],
  },
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
      {processButtons.map((button: ProcessButton) => (
        <MenuItem key={button.id} onClick={() => onProcessClick(button)} sx={menuItemStyle} disabled={!selectedRecord}>
          <Tooltip title={button.name} enterDelay={600} leaveDelay={100}>
            <span>{button.name}</span>
          </Tooltip>
        </MenuItem>
      ))}
    </Menu>
  );
};

export default ProcessMenu;
