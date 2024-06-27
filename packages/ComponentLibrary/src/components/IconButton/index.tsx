import React from 'react';
import { IconButton as MUIIconButton } from '@mui/material';
import { IIconButton } from './types';
import { DEFAULT_SIZE } from './default';

const IconButton: React.FC<IIconButton> = ({
  icon,
  alt = 'icon',
  styleIcon,
  ...props
}) => {
  return (
    <MUIIconButton style={DEFAULT_SIZE} {...props}>
      {React.cloneElement(icon, { style: styleIcon, alt })}{' '}
    </MUIIconButton>
  );
};

export default IconButton;
