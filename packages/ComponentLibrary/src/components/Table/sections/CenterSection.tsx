import { Box, useTheme } from '@mui/material';
import IconButton from '../../IconButton';
import Excel from '../../../assets/icons/ilustration/excel.svg';
import Copilot from '../../../assets/icons/sparks.svg';
import Print from '../../../assets/icons/color-picker.svg';
import Trash from '../../../assets/icons/trash-2.svg';
import Printer from '../../../assets/icons/printer.svg';
import Copy from '../../../assets/icons/copy.svg';
import Mail from '../../../assets/icons/mail.svg';
import LinkIcon from '../../../assets/icons/link.svg';

const CenterSection = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
        borderRadius: '10rem',
        padding: '.25rem',
        gap: '0.25rem',
      }}>
      <IconButton tooltip="Print" width={16} height={16}>
        <Print />
      </IconButton>
      <IconButton tooltip="Copilot" width={16} height={16}>
        <Copilot />
      </IconButton>
      <IconButton tooltip="Delete" width={16} height={16}>
        <Trash />
      </IconButton>
      <IconButton tooltip="Print" width={16} height={16}>
        <Printer />
      </IconButton>
      <IconButton tooltip="Copy" width={16} height={16}>
        <Copy />
      </IconButton>
      <IconButton tooltip="Excel" width={16} height={16}>
        <Excel />
      </IconButton>
      <IconButton tooltip="Contact" width={16} height={16}>
        <Mail />
      </IconButton>
      <IconButton tooltip="Link" width={16} height={16}>
        <LinkIcon />
      </IconButton>
    </Box>
  );
};

export default CenterSection;
