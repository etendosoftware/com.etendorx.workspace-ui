import { FieldLabelProps } from '../types';
import { FieldDefinition } from '../../../screens/Form/types';
import { styles, sx } from '../styles';
import { Box, Link } from '@mui/material';
import { useCallback } from 'react';

const isReferenceField = (fieldType: FieldDefinition['type']) => ['tabledir', 'search'].includes(fieldType);

const LinkLabel = ({ field }: FieldLabelProps) => {
  const handleLinkClick = useCallback(() => {
    if (field.type === 'tabledir' && field.value && typeof field.value === 'object' && 'id' in field.value) {
      const recordId = field.value.id;
      const windowId = field.original?.referencedWindowId;
      location.href = `/window/${windowId}/${recordId}`;
    }
  }, [field]);

  return (
    <Link onClick={handleLinkClick} sx={sx.linkStyles}>
      {field.label}
    </Link>
  );
};

const Label = ({ field }: FieldLabelProps) => {
  if (isReferenceField(field.type)) {
    return <LinkLabel field={field} />;
  } else {
    return <span style={styles.labelText}>{field.label}</span>;
  }
};

const FieldLabel: React.FC<FieldLabelProps> = ({ field }) => {
  return (
    <Box sx={sx.labelBox}>
      <Box sx={styles.labelWrapper}>
        <Label field={field} />
        {field.required && <span style={styles.requiredAsterisk}>*</span>}
        <span style={styles.dottedSpacing} />
      </Box>
    </Box>
  );
};

export default FieldLabel;
