import React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { appIcon } from '../Nav.icons.Mock';
import { AppStyles } from '../Nav.styles';

export const AppIcon: React.FC = () => {
  const IconComponent = appIcon.icon;
  return (
    <Tooltip title={appIcon.label}>
      <IconButton onClick={appIcon.onClick} style={AppStyles}>
        <IconComponent />
      </IconButton>
    </Tooltip>
  );
};
