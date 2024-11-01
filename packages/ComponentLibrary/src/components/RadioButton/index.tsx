import { MenuItem, Radio, Box, Typography, useTheme } from '@mui/material';
import { useStyle } from './styles';
import { RadioButtonItemProps } from './types';

const RadioButtonItem: React.FC<RadioButtonItemProps> = ({ id, title, description, isSelected, onSelect }) => {
  const theme = useTheme();
  const { sx } = useStyle();
  return (
    <MenuItem
      sx={{
        ...sx.menuItem,
        border: isSelected
          ? `1px solid ${theme.palette.baselineColor.etendoPrimary.main}`
          : `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
        backgroundColor: isSelected ? theme.palette.baselineColor.transparentNeutral[5] : 'transparent',
      }}
      onClick={() => onSelect(id)}>
      <Radio checked={isSelected} sx={sx.radioButton} />
      <Box sx={sx.menuItemContent}>
        <Typography sx={sx.menuItemTitle}>{title}</Typography>
        <Typography sx={sx.menuItemDescription}>{description}</Typography>
      </Box>
    </MenuItem>
  );
};

export default RadioButtonItem;
