import { memo, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { useStyle } from '../styles';
import { FormFieldGroupProps } from '../types';
import { GenericSelector } from './GenericSelector';
import { FieldLabel } from '../Sections/FieldLabel';

const FormFieldGroup: React.FC<FormFieldGroupProps> = memo(({ field }) => {
  const { styles, sx } = useStyle();

  const isEntityReference = useMemo(() => ['tabledir', 'search'].includes(field.type), [field.type]);

  const handleLinkClick = useCallback(() => {
    if (isEntityReference && typeof field.value === 'object' && 'id' in field.value) {
      const recordId = field.value.id;
      const windowId = field.original?.referencedWindowId;
      const tabId = field.original?.referencedTabId;
      location.href = `/window/${windowId}/${tabId}/${recordId}`;
    }
  }, [field.original?.referencedTabId, field.original?.referencedWindowId, field.value, isEntityReference]);

  return (
    <Box style={styles.fieldContainer}>
      <Box sx={sx.labelBox}>
        <FieldLabel
          label={field.label}
          required={field.required}
          fieldType={field.type}
          isEntityReference={isEntityReference}
          onLinkClick={handleLinkClick}
        />
      </Box>
      <Box sx={sx.inputBox}>
        <GenericSelector field={field} />
      </Box>
    </Box>
  );
});

export default FormFieldGroup;
