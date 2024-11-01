import Box from '@mui/material/Box';
import { ReactNode } from 'react';
import { useStyle } from '../Nav.styles';

interface RightButtonsProps {
  children?: ReactNode;
}

const RightButtons: React.FC<RightButtonsProps> = ({ children }) => {
  const { styles } = useStyle();
  return (
    <Box style={styles.boxStyles}>
      <Box sx={styles.childBox}>{children}</Box>
    </Box>
  );
};

export default RightButtons;
