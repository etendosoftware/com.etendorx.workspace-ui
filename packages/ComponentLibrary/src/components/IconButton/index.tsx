import React from 'react';
import { IconButton as MUIIconButton } from '@mui/material';
import { IIconButton } from './types';

const IconButton: React.FC<IIconButton> = ({
  icon,
  alt = 'icon',
  ...props
}) => {
  return (
    <MUIIconButton {...props}>
      <img src={icon} alt={alt} />
    </MUIIconButton>
  );
};

export default IconButton;