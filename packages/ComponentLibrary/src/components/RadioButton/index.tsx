import { MenuItem, Radio, Box, Typography } from '@mui/material';
import { theme } from '../../theme';
import { sx } from './styles';
import { RadioButtonItemProps } from './types';

const RadioButtonItem: React.FC<RadioButtonItemProps> = ({ id, title, description, isSelected, onSelect }) => {
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
