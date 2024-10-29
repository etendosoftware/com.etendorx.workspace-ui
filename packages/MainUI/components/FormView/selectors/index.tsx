import { useCallback } from 'react';
import { Box } from '@mui/material';
import { styles, sx } from '../styles';
import { FormFieldGroupProps } from '../types';
import { FieldLabel } from './FieldLabel';
import { GenericSelector } from './GenericSelector';

const FormFieldGroup: React.FC<FormFieldGroupProps> = ({ field }) => {
  const handleLinkClick = useCallback(() => {
    if (field.type === 'tabledir' && field.value && typeof field.value === 'object' && 'id' in field.value) {
      const recordId = field.value.id;
      const windowId = field.original.referencedWindowId;
      const tabId = field.original.referencedTabId;
      location.href = `/window/${windowId}/${tabId}/${recordId}`;
    }
  }, [field]);

  return (
    <Box style={styles.fieldContainer}>
      <Box sx={sx.labelBox}>
        <FieldLabel
          label={field.original.name}
          required={field.original.isMandatory}
          fieldType={field.type}
          onLinkClick={handleLinkClick}
          readOnly={field.original.readOnly}
        />
      </Box>
      <Box sx={sx.inputBox}>
        <GenericSelector field={field} />
      </Box>
    </Box>
  );
};

export default FormFieldGroup;
