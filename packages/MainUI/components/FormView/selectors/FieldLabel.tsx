import { Box, Link } from '@mui/material';
import { styles, sx } from '../styles';
import { FieldLabelProps } from '../types';

export const FieldLabel: React.FC<FieldLabelProps> = ({ label, required, fieldType, onLinkClick }) => (
  <Box sx={styles.labelWrapper}>
    {fieldType === 'tabledir' ? (
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
