import React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { iconActions } from '../Mock';
import { avatarStyles } from '../Nav.styles';

const IconButtons: React.FC = () => {
  return (
    <div>
      {iconActions.map((action, index) => {
        const IconComponent = action.icon;
        return (
          <Tooltip key={index} title={action.label}>
            <IconButton onClick={action.onClick} style={avatarStyles}>
              <IconComponent />
            </IconButton>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default IconButtons;
