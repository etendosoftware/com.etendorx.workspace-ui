import Box from '@mui/material/Box';
import styles from '../Nav.styles';
import { ReactNode } from 'react';

interface RightButtonsProps {
  children?: ReactNode;
}

const RightButtons: React.FC<RightButtonsProps> = ({ children }) => {
  return (
    <Box style={styles.boxStyles}>
      <Box sx={styles.childBox}>{children}</Box>
    </Box>
  );
};

export default RightButtons;
