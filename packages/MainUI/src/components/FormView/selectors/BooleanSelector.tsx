import { memo } from 'react';
import {
  FormControl,
  FormControlLabel,
  Checkbox,
  Box,
  styled,
} from '@mui/material';
import { sx } from '../styles';
import { theme } from '@workspaceui/componentlibrary/src/components';
import { BooleanSelectorProps } from '../types';

const CustomCheckbox = styled(FormControlLabel)(() => ({
  '& .MuiCheckbox-root.Mui-checked': {
    color: theme.palette.dynamicColor.main,
  },
}));

const BooleanSelector: React.FC<BooleanSelectorProps> = memo(
  ({ label, readOnly }) => (
    <FormControl fullWidth margin="normal">
      <Box sx={sx.checkboxContainer}>
        <CustomCheckbox
          control={<Checkbox size="small" disabled={readOnly} />}
          label={label}
        />
      </Box>
    </FormControl>
  ),
);

export default BooleanSelector;
