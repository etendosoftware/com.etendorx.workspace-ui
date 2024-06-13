import React from 'react';
import { Chip as MuiChip } from '@mui/material';
import { chipStyles, chipLabelStyles, getColoredIcon } from './styles';
import { TagProps } from './types';

const Tag: React.FC<TagProps> = ({
  type,
  label,
  icon,
  onClick,
}) => {
  const coloredIcon = icon && getColoredIcon(icon, type);

  return (
    <MuiChip
      icon={coloredIcon}
      label={label}
      onClick={onClick}
      variant="outlined"
      style={chipStyles(type)}
      sx={chipLabelStyles(icon)}
    />
  );
};

export default Tag;
