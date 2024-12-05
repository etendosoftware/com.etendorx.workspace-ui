import { memo, useCallback } from 'react';
import { Box } from '@mui/material';
import { useStyle } from '../styles';
import { FormFieldGroupProps } from '../types';
import { GenericSelector } from '@workspaceui/mainui/components/Form/GenericSelector';
import { FieldLabel } from '../Sections/FieldLabel';
import { isEntityReference } from '@workspaceui/etendohookbinder/src/utils/form';

const FormFieldGroup: React.FC<FormFieldGroupProps> = memo(({ tab, field, onLabelClick }) => {
  const { styles, sx } = useStyle();

  const handleLinkClick = useCallback(() => {
    if (isEntityReference(field.type) && typeof field.value === 'object' && 'id' in field.value) {
      const recordId = field.value.id;
      const windowId = field.original?.referencedWindowId;
      const tabId = field.original?.referencedTabId;

      onLabelClick?.(`/window/${windowId}/${tabId}/${recordId}`);
    }
  }, [field, onLabelClick]);

  return (
    <Box style={styles.fieldContainer}>
      <Box sx={sx.labelBox}>
        <FieldLabel
          label={field.label}
          required={field.required}
          fieldType={field.type}
          isEntityReference={isEntityReference(field.type)}
          onLinkClick={handleLinkClick}
        />
      </Box>
      <Box sx={sx.inputBox}>
        <GenericSelector tab={tab} field={field} />
      </Box>
    </Box>
  );
});

export default FormFieldGroup;
