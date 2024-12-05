import { Box, Link } from '@mui/material';
import { useStyle } from '../styles';
import { FieldLabelProps } from '../types';

export const FieldLabel: React.FC<FieldLabelProps> = ({ isEntityReference, label, required, onLinkClick }) => {
  const { styles, sx } = useStyle();

  return (
    <Box sx={styles.labelWrapper}>
      {isEntityReference ? (
        <Link onClick={onLinkClick} sx={sx.linkStyles}>
          {label}
        </Link>
      ) : (
        <span style={styles.labelText}>{label}</span>
      )}
      {required && <span style={styles.requiredAsterisk}>*</span>}
      <span style={styles.dottedSpacing} />
    </Box>
  );
};
