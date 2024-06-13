import React from 'react';
import { Chip as MuiChip } from '@mui/material';
import { getIconColor, chipStyles, chipLabelStyles } from './styles';
import { TagProps } from './types';

const Tag: React.FC<TagProps> = ({
  type,
  label,
  icon,
  onClick,
}) => {
  const coloredIcon = icon && React.cloneElement(icon, {
    style: { ...icon.props.style, color: getIconColor(type), width: '1rem', height: '1rem', margin: '0px', padding: '0' }
  });

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