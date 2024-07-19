import IconButton from '../../IconButton';
import ChevronDown from '../../../assets/icons/chevrons-down.svg';
import Refresh from '../../../assets/icons/refresh-cw.svg';
import { Box } from '@mui/material';

const LeftSection = () => (
  <Box sx={{ display: 'flex', gap: '0.25rem' }}>
    <IconButton
      tooltip="New Line"
      onClick={() => console.log('Add new row')}
      width={16}
      height={16}>
      <ChevronDown />
    </IconButton>
    <IconButton
      tooltip="Refresh"
      onClick={() => console.log('Refresh table')}
      width={16}
      height={16}>
      <Refresh />
    </IconButton>
  </Box>
);

export default LeftSection;
