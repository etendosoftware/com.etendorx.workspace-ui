import { memo, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { useStyle } from '../styles';
import { FormFieldGroupProps } from '../types';
import { GenericSelector } from '@workspaceui/mainui/components/Form/GenericSelector';
import { FieldLabel } from '../Sections/FieldLabel';
import { isEntityReference } from '@workspaceui/etendohookbinder/src/utils/metadata';

const FormFieldGroup: React.FC<FormFieldGroupProps> = memo(({ tab, field, onLabelClick, formState }) => {
  const { styles, sx } = useStyle();

  const handleLinkClick = useCallback(() => {
    if (isEntityReference(field.type) && field.value && typeof field.value === 'object' && 'id' in field.value) {
      const recordId = field.value.id;
      const windowId = field.original?.referencedWindowId;
      const tabId = field.original?.referencedTabId;

      if (recordId && windowId && tabId && onLabelClick) {
        const path = `/window/${windowId}/${tabId}/${recordId}`;
        onLabelClick(path);
      }
    }
  }, [field, onLabelClick]);

  const isReadOnly = useMemo(() => {
    if (formState?._readOnly) return true;

    return field.readOnlyState?.readOnly ?? false;
  }, [field.readOnlyState?.readOnly, formState?._readOnly]);

  return (
    <Box style={styles.fieldContainer}>
      <Box sx={sx.labelBox}>
        <FieldLabel
          label={field.label}
          required={field.required}
          fieldType={field.type}
          isEntityReference={isEntityReference(field.type)}
          onLinkClick={handleLinkClick}
          readOnly={isReadOnly}
          readOnlyReason={field.readOnlyState?.readOnlyReason}
        />
      </Box>
      <Box sx={sx.inputBox}>
        <GenericSelector tab={tab} field={field} readOnly={isReadOnly} />
      </Box>
    </Box>
  );
});

export default FormFieldGroup;
