import React from 'react';
import { IconButtonProps, IconButton as MUIIconButton } from '@mui/material';

interface IIconButton extends IconButtonProps {
  icon: string;
  alt?: string;
}

const IconButton: React.FC<IIconButton> = ({ icon, alt, ...props }) => {
  return (
    <MUIIconButton {...props}>
      <img src={icon} alt={alt} />
    </MUIIconButton>
  );
};

export default IconButton;
