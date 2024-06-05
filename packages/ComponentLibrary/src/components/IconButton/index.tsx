import React from 'react';
import { IconButton as MUIIconButton } from '@mui/material';
import { IIconButton } from './types';

/**
 * A custom IconButton component that displays an icon.
 * @param {IIconButton} props - The properties for the IconButton component.
 * @returns {JSX.Element} The rendered IconButton component.
 */
const IconButton: React.FC<IIconButton> = ({ icon, alt = "icon", ...props }) => {
  return (
    <MUIIconButton {...props}>
      <img src={icon} alt={alt} />
    </MUIIconButton>
  );
};

export default IconButton;
