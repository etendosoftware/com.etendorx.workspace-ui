import IconButton from '../../IconButton';
import ChevronDown from '../../../assets/icons/chevron-down.svg';
import PlusIcon from '../../../assets/icons/plus.svg';
import Refresh from '../../../assets/icons/refresh-cw.svg';
import { Box, Button } from '@mui/material';
import { sx } from '../styles';
import { TOOLTIPS } from '../tableConstants';
import { theme } from '../../../theme';

interface LeftSectionProps {
  newLineText?: string;
  onNewLineClick: () => void;
  onChevronClick: () => void;
}

const LeftSection: React.FC<LeftSectionProps> = ({
  newLineText = 'New Line',
  onNewLineClick,
  onChevronClick,
}) => (
  <Box>
    <Box sx={sx.leftSection}>
      <Button
        startIcon={<PlusIcon fill={theme.palette.baselineColor.neutral[0]} />}
        onClick={onNewLineClick}
        sx={sx.newLineButton}>
        {newLineText}
        <IconButton
          width={12.5}
          height={12.5}
          sx={{
            padding: '0.25rem',
            position: 'absolute',
            right: '0',
            marginRight: '0.5rem',
            '&: hover': {
              background: theme.palette.baselineColor.neutral[80],
            },
          }}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onChevronClick();
          }}>
          <ChevronDown />
        </IconButton>
      </Button>
      <IconButton
        tooltip={TOOLTIPS.REFRESH}
        onClick={() => {}}
        width={16}
        height={16}>
        <Refresh />
      </IconButton>
    </Box>
  </Box>
);

export default LeftSection;
