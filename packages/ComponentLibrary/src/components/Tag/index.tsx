import type React from 'react';
import { Chip as MuiChip } from '@mui/material';
import { useStyle } from './styles';
import type { TagProps } from './types';

const Tag: React.FC<TagProps> = ({ type, label, icon, onClick }) => {
  const styles = useStyle();
  const coloredIcon = icon && styles.getColoredIcon(icon, type);

  return (
    <MuiChip
      icon={coloredIcon}
      label={label}
      onClick={onClick}
      variant="outlined"
      style={styles.getChipStyles(type)}
      sx={styles.sx.chipLabel(icon)}
    />
  );
};

export default Tag;
